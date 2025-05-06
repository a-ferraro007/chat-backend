/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'
import { ConnectedUserService } from './services/connected-user.service'
import { JwtService } from '@nestjs/jwt'
import {
  ExecutionContext,
  createParamDecorator,
  Catch,
  ArgumentsHost,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { jwtConstants } from './constants'
import { Payload } from './guards/auth.guard'
import { Connected_User, UnauthorizedUser, User } from './db/queries'
import { RoomService } from './services/room.service'
import { CreateRoomDto, JoinRoomDto } from './dtos/rooms.dto'
import { KafkaProducerService } from './services/kafka/producer.service'
import { CreateMessageDto } from './dtos/messages.dto'
import { UserService } from './services/user.service'
const consumer_topics = {
  CHAT_EVENTS: 'chat-events',
  ROOM_EVENTS: 'room-events',
  SYSTEM_NOTIFICATIONS: 'system-notifications',
} as const

const WsUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const socket = context.switchToWs().getClient<Socket>()

    return socket.data.user as User | UnauthorizedUser
  },
)

@Catch(WsException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost): void {
    const ws = host.switchToWs()
    const socket = ws.getClient<Socket>()
    const data = ws.getData<{
      message: undefined | string
      id: string
      rid: string
    }>()
    const error = exception.getError()
    const details = error instanceof Object ? { ...error } : { message: error }

    socket.emit(
      'ERROR',
      JSON.stringify({
        message: 'error',
        data: {
          id: socket.id,
          rid: data.rid,
          ...details,
        },
      }),
    )
  }
}

@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly kafkaProducer: KafkaProducerService

  constructor(
    private jwtService: JwtService,
    private roomService: RoomService,
    private userService: UserService,
    private connectedUserService: ConnectedUserService,
  ) {
    this.kafkaProducer = new KafkaProducerService()
  }

  async onModuleInit() {
    await this.connectedUserService.deleteAll()
  }

  async handleConnection(socket: Socket) {
    try {
      const payload = await this.authorizeSocket(socket)
      if (payload) {
        await this.initializeConnectedUser(payload, socket)
      } else {
        console.warn('No JWT payload. Creating Unauthorized User.')
        const unauthorizedUser = await this.userService.createUnauthorizedUser()
        await this.initializeConnectedUser(
          { ...unauthorizedUser, isUnauthorized: false },
          socket,
        )
      }
      // throw new Error('Error: JWT Payload')
    } catch (error) {
      socket.emit('error', { message: 'Invalid authentication token' })
      socket.disconnect()
      console.error(error)
    }
  }

  async handleDisconnect(socket: Socket) {
    await this.connectedUserService.delete(socket.id)
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @WsUser() currentUser: User,
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      if (!(await this.SocketAuthMiddleware(socket))) return
      await this.kafkaProducer.publish(consumer_topics.ROOM_EVENTS, {
        action: 'CREATE_ROOM',
        currentUser,
        type: data.type,
        name: data.name,
        users: data.users,
      })
    } catch (error) {
      console.error(
        `Error publishing event: ${consumer_topics.ROOM_EVENTS} for action: CREATE_ROOM with message:${error.message}`,
      )
      throw new WsException('Error creating room.')
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @WsUser() currentUser: User,
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      if (!(await this.SocketAuthMiddleware(socket))) return
      await this.kafkaProducer.publish(consumer_topics.ROOM_EVENTS, {
        action: 'JOIN_ROOM',
        currentUser,
        roomId: data.roomId,
        users: data.users,
      })
    } catch (error) {
      console.error(
        `Error publishing event: ${consumer_topics.ROOM_EVENTS} for action: JOIN_ROOM with message: ${error.message}`,
      )
      throw new WsException(`Error joining room`)
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @WsUser() currentUser: User,
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      if (!(await this.SocketAuthMiddleware(socket))) return
      const { id: userId } = currentUser
      const { roomId, message } = data
      const connectedUsers =
        await this.connectedUserService.getConnectedUsersInRoom({
          roomId: roomId,
        })

      const isInRoom = connectedUsers.some(
        (cu: Connected_User) => cu.user_id === userId,
      )

      if (!isInRoom) {
        console.error(`User: ${userId} is not in room: ${roomId}`)
        throw new WsException(`User: ${userId} is not in room: ${roomId}`)
      }

      await this.kafkaProducer.publish(consumer_topics.CHAT_EVENTS, {
        roomId,
        text: message,
        created_by: userId,
        created_on: '',
      })
    } catch (error) {
      if (error.message === 'UNAUTHORIZED') {
        console.log(error.message)
      }
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @WsUser() currentUser: User,
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomId } = data
    try {
      if (!(await this.SocketAuthMiddleware(socket))) return
      await this.roomService.removeUsersFromRoom({
        roomId: roomId,
        users: [currentUser.id],
      })
    } catch (error) {
      console.error(
        `Error leaving roomId: ${roomId} for userId: ${currentUser.id}`,
        error,
      )
    }
  }

  async sendMessageToClients(message: CreateMessageDto) {
    const { roomId, text, created_by } = message
    const connectedUsers =
      await this.connectedUserService.getConnectedUsersInRoom({
        roomId: roomId,
      })

    await Promise.allSettled(
      connectedUsers
        .filter(({ user_id }) => user_id !== created_by)
        .map(({ socket_id }: Connected_User) => {
          return {
            socketId: socket_id,
            promise: new Promise<void>((resolve, reject) => {
              this.server
                .to(socket_id)
                .emit('message', text, (response: any) => {
                  if (response && response.error) {
                    reject(new Error(response.error as string))
                  } else resolve()
                })
            }),
          }
        })
        .map((e) => e.promise),
    )
  }

  async initializeConnectedUser(
    user: Payload | UnauthorizedUser,
    socket: Socket,
  ) {
    socket.data.user = user
    await this.connectedUserService.create(user.id, socket.id)
    console.log(`Client connected: ${socket.id} - User ID: ${user.id}`)
  }

  private extractTokenFromSocket(socket: Socket): {
    accessToken?: string
    refreshToken?: string
  } {
    const handshakeAuth = ((socket: Socket) => {
      if (Object.keys(socket.handshake.auth).length <= 0) return undefined
      return socket.handshake.auth
    })(socket)

    if (handshakeAuth) {
      return {
        accessToken: handshakeAuth.accessToken as string | undefined,
        refreshToken: handshakeAuth.refreshToken as string | undefined,
      } as {
        accessToken: string
        refreshToken: string
      }
    }

    const urlAccessToken = socket.request.url
      .split('accessToken=')[1]
      ?.split('&')[0]
    const urlRefreshToken = socket.request.url
      .split('refreshToken=')[1]
      ?.split('&')[0]

    return {
      accessToken: urlAccessToken,
      refreshToken: urlRefreshToken,
    }
  }

  private async authorizeSocket(socket: Socket): Promise<Payload> {
    try {
      const { accessToken } = this.extractTokenFromSocket(socket)
      if (!accessToken) return undefined

      return await this.jwtService.verifyAsync(accessToken ?? '', {
        secret: jwtConstants.accessSecret,
      })
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new Error(error)
    }
  }

  private async SocketAuthMiddleware(socket: Socket) {
    try {
      if (!(await this.authorizeSocket(socket))) throw new Error()
      return true
    } catch (error) {
      socket.emit('error', { message: 'Invalid access token' })
      socket.disconnect()
      console.error(error)
    }
    return false
  }
}

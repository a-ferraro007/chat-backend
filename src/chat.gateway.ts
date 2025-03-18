/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BaseWsExceptionFilter,
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
  // UnauthorizedException,
  Catch,
  HttpException,
  ArgumentsHost,
  UseFilters,
} from '@nestjs/common'
import { jwtConstants } from './constants'
import { Payload } from './guards/auth.guard'
import { Connected_User, User } from './db/queries'
import { RoomService } from './services/room.service'
import { CreateRoomDto, JoinRoomDto } from './dtos/rooms.dto'
import { MessageService } from './services/message.service'

const WsUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    return context.switchToWs().getClient().data.user as User
  },
)

@Catch(WsException, HttpException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost): void {
    const ws = host.switchToWs()
    const socket = ws.getClient<Socket>()
    const data = ws.getData<{
      message: undefined | string
      id: string
      rid: string
    }>()
    const error =
      exception instanceof WsException
        ? exception.getError()
        : exception.getResponse()
    const details = error instanceof Object ? { ...error } : { message: error }

    socket.send(
      JSON.stringify({
        event: 'error',
        data: {
          id: socket.id,
          rid: data.rid,
          ...details,
        },
      }),
    )
  }
}

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
@UseFilters(WebsocketExceptionsFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  constructor(
    private jwtService: JwtService,
    private roomService: RoomService,
    private messageService: MessageService,
    private connectedUserService: ConnectedUserService,
  ) {}

  async onModuleInit() {
    console.log('ChatGateway Module initialized')
    await this.connectedUserService.deleteAll()
  }

  async handleConnection(socket: Socket) {
    const payload = await this.authorizeSocket(socket)
    await this.initializeConnectedUser(payload, socket)
  }

  async handleDisconnect(socket: Socket) {
    console.log(socket.id)
    await this.connectedUserService.delete(socket.id)
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @WsUser() currentUser: User,
    @MessageBody() data: CreateRoomDto,
  ) {
    try {
      const newRoom = await this.roomService.createRoom({
        name: data.name,
        type: data.type,
        users: [],
      })

      await this.roomService.addUserToRoom(currentUser.id, {
        roomId: newRoom[0].id,
      })
    } catch (error) {
      console.error(error.message)
      throw new WsException('Error creating room.')
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @WsUser() currentUser: User,
    @MessageBody() data: JoinRoomDto,
  ) {
    try {
      const room = await this.roomService.getRoomById(data)
      if (room.length === 0) throw new Error()

      await this.roomService.addUserToRoom(currentUser.id, data)
    } catch (error) {
      console.error(
        `Error joining room: ${data.roomId} with message: ${error.message}`,
      )
      throw new WsException(`Error joining room`)
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @WsUser() currentUser: User,
    @MessageBody() data: { roomId: string; message: string },
  ): Promise<void> {
    const { id: userId } = currentUser
    const { roomId, message } = data

    try {
      const connectedUsers =
        await this.connectedUserService.getConnectedUsersInRoom({
          roomId: roomId,
        })

      const isInRoom = connectedUsers.some(
        (cu: Connected_User) => cu.user_id === userId,
      )

      if (!isInRoom) {
        throw new WsException('User is not in room')
      }

      const { text: createdMessageText } =
        await this.messageService.createMessage({
          roomId,
          text: message,
          created_by: userId,
          created_on: '',
        })

      await Promise.allSettled(
        connectedUsers
          .filter(({ user_id }) => user_id !== userId)
          .map(({ socket_id }: Connected_User) => {
            return {
              socketId: socket_id,
              promise: new Promise<void>((resolve, reject) => {
                this.server
                  .to(socket_id)
                  .emit('message', createdMessageText, (response: any) => {
                    if (response && response.error) {
                      reject(new Error(response.error as string))
                    } else resolve()
                  })
              }),
            }
          })
          .map((e) => e.promise),
      )
    } catch (error) {
      console.error(error)
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @WsUser() currentUser: User,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data
    try {
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

  @SubscribeMessage('ping')
  handlePingMessage() {
    return {
      event: 'pong',
      data: 'Wrong data that will make the test fail',
    }
  }

  private extractTokenFromHeader(socket: Socket): string | undefined {
    const headers = socket.handshake.headers
    const [type, token] = headers.authorization?.split(' ') ?? [
      undefined,
      undefined,
    ]
    return type === 'Bearer' ? token : undefined
  }

  private async authorizeSocket(socket: Socket): Promise<Payload> {
    const token = this.extractTokenFromHeader(socket)
    try {
      if (!token) throw new Error()
      return await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.accessSecret,
      })
    } catch {
      throw new WsException({ message: 'Unauthorized' })
    }
  }

  async initializeConnectedUser(user: Payload, socket: Socket) {
    socket.data.user = user
    await this.connectedUserService.create(user.id, socket.id)
    console.log(`Client connected: ${socket.id} - User ID: ${user.id}`)
  }
}

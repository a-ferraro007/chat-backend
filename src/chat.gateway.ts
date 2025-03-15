/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
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
  UnauthorizedException,
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

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
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
    // create message in message service
    // save message in DB
    // return message from DB by roomID

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

      const emitPromises = connectedUsers
        .filter(({ user_id }) => user_id !== userId)
        .map(({ socket_id }: Connected_User) => {
          return {
            socketId: socket_id,
            promise: new Promise<void>((resolve, reject) => {
              this.server
                .to(socket_id)
                .emit('message', createdMessageText, (response: any) => {
                  if (response && response.error) {
                    reject(new Error(response.error))
                  } else resolve()
                })
            }),
          }
        })

      await Promise.allSettled(emitPromises.map(({ promise }) => promise))
    } catch (error) {
      console.error(error)
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
        secret: jwtConstants.secret,
      })
    } catch {
      throw new UnauthorizedException()
    }
  }

  async initializeConnectedUser(user: Payload, socket: Socket) {
    socket.data.user = user
    await this.connectedUserService.create(user.id, socket.id)
    console.log(`Client connected: ${socket.id} - User ID: ${user.id}`)
  }
}

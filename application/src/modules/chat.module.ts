import { Module } from '@nestjs/common'
import { ChatGateway } from '../chat.gateway'
import { ChatService } from '../services/chat.service'
import { ConnectedUserService } from '../services/connected-user.service'
import { RoomService } from '../services/room.service'
import { MessageService } from '../services/message.service'
import { UserService } from 'src/services/user.service'

@Module({
  providers: [
    ChatGateway,
    ChatService,
    UserService,
    RoomService,
    MessageService,
    ConnectedUserService,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}

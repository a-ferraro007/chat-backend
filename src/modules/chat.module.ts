import { Module } from '@nestjs/common'
import { ChatGateway } from '../chat.gateway'
import { ChatService } from '../services/chat.service'
import { ConnectedUserService } from '../services/connected-user.service'
import { RoomService } from '../services/room.service'
import { MessageService } from '../services/message.service'

@Module({
  providers: [
    ChatGateway,
    ChatService,
    ConnectedUserService,
    RoomService,
    MessageService,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}

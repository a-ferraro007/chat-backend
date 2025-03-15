import { Module } from '@nestjs/common'
import { ChatGateway } from '../chat.gateway'
import { ChatService } from '../services/chat.service'
import { ConnectedUserService } from 'src/services/connected-user.service'
import { RoomService } from 'src/services/room.service'
import { MessageService } from 'src/services/message.service'

@Module({
  providers: [
    ChatGateway,
    ChatService,
    ConnectedUserService,
    RoomService,
    MessageService,
  ],
})
export class ChatModule {}

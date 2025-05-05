import { Injectable } from '@nestjs/common'
import { insertIntoMessage } from '../db/queries'
import { CreateMessageDto } from '../dtos/messages.dto'

@Injectable()
export class MessageService {
  async createMessage(createMessageDto: CreateMessageDto) {
    return (await insertIntoMessage(createMessageDto)).rows[0]
  }
}

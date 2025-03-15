import { Injectable } from '@nestjs/common'
import { insertIntoMessage } from 'src/db/queries'

export class CreateMessageDto {
  roomId: string
  text: string
  created_by: string
  created_on: string
}

@Injectable()
export class MessageService {
  async createMessage(createMessageDto: CreateMessageDto) {
    return (await insertIntoMessage(createMessageDto)).rows[0]
  }
}

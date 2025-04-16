/* eslint-disable no-case-declarations */
import { Injectable } from '@nestjs/common'
import { Consumer, KafkaMessage } from 'kafkajs'
import { ChatGateway } from '../../chat.gateway'
import { KafkaService } from './kafka.service'
import { MessageService } from '../message.service'
import { CreateMessageDto } from '../../dtos/messages.dto'
import { RoomService } from '../room.service'
import { CreateRoomDto } from 'src/dtos/rooms.dto'

const consumer_topics = {
  CHAT_EVENTS: 'chat-events',
  ROOM_EVENTS: 'room-events',
  SYSTEM_NOTIFICATIONS: 'system-notifications',
} as const
export type ConsumerTopic =
  (typeof consumer_topics)[keyof typeof consumer_topics]

@Injectable()
export class KafkaConsumerService {
  private consumer: Consumer
  constructor(
    private readonly chatGateway: ChatGateway,
    private messageService: MessageService,
    private roomService: RoomService,
  ) {
    this.consumer = KafkaService.singleton.consumer
  }

  async onApplicationBootstrap() {
    try {
      await this.consumer.connect()
      console.log('Kafka Consumer connected successfully!')
      await this.consumer.subscribe({
        topics: ['chat-events', 'room-events', 'system-notifications'],
        fromBeginning: true,
      })
      console.log(
        'Subscribed to Kafka topics: chat-events, room-events, system-notifications',
      )
      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            switch (topic) {
              case consumer_topics.CHAT_EVENTS:
                await this.handlePublishChatEvent(message)
                break
              case consumer_topics.ROOM_EVENTS:
                const { action } = JSON.parse(message.value?.toString()) as {
                  action: string
                }
                if (action === 'CREATE_ROOM')
                  await this.handlePublishCreateRoomEvent(message)
                break
              case consumer_topics.SYSTEM_NOTIFICATIONS:
                break
              default:
                console.warn('Unknown Topic: ', topic)
                break
            }
          } catch (error) {
            console.error('Error consuming message: ', error)
          }
        },
      })
    } catch (error) {
      console.error('Error in Kafka Consumer:', error)
    }
  }

  private async handlePublishChatEvent(message: KafkaMessage) {
    const parsedMessage = JSON.parse(
      message.value?.toString(),
    ) as unknown as CreateMessageDto

    await this.chatGateway.sendMessageToClients(
      await this.messageService.createMessage(parsedMessage),
    )
  }

  private async handlePublishCreateRoomEvent(message: KafkaMessage) {
    const data = JSON.parse(
      message.value?.toString(),
    ) as unknown as CreateRoomDto
    const newRoom = await this.roomService.createRoom({
      name: data.name,
      type: data.type,
      users: data.users,
    })
    await this.roomService.addUserToRoom(data.currentUser.id, {
      roomId: newRoom[0].id,
    })
  }

  private handlePublishSystemEvent(message: KafkaMessage) {
    const parsedMessage = JSON.parse(message.value?.toString()) as string
    console.log('Publish Topic system-events', parsedMessage)
  }
}

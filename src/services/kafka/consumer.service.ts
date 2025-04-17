/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-case-declarations */
import { Injectable } from '@nestjs/common'
import { Consumer, KafkaMessage } from 'kafkajs'
import { ChatGateway } from '../../chat.gateway'
import { KafkaService } from './kafka.service'
import { MessageService } from '../message.service'
import { CreateMessageDto } from '../../dtos/messages.dto'
import { RoomService } from '../room.service'
import { CreateRoomDto, JoinRoomDto } from 'src/dtos/rooms.dto'
import { WsException } from '@nestjs/websockets'

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
                await this.handleConsumeChatEvent(message)
                break
              case consumer_topics.ROOM_EVENTS:
                const parsedMessage = JSON.parse(message.value?.toString()) as
                  | CreateRoomDto
                  | JoinRoomDto
                const { action } = parsedMessage

                if (action === 'CREATE_ROOM')
                  await this.handleConsumeCreateRoomEvent(
                    parsedMessage as CreateRoomDto,
                  )
                else if (action === 'JOIN_ROOM')
                  await this.handleConsumeJoinRoomEvent(
                    parsedMessage as JoinRoomDto,
                  )
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
      throw error
    }
  }

  private async handleConsumeChatEvent(message: KafkaMessage) {
    try {
      const parsedMessage = JSON.parse(
        message.value?.toString(),
      ) as CreateMessageDto

      await this.chatGateway.sendMessageToClients(
        await this.messageService.createMessage(parsedMessage),
      )
    } catch (error) {
      console.error(`Error consuming chat event with message ${error.message} `)
      throw new WsException('Error sending message')
    }
  }

  private async handleConsumeCreateRoomEvent(message: CreateRoomDto) {
    const { name, type, users, currentUser } = message
    try {
      const newRoom = await this.roomService.createRoom({
        name,
        type,
        users,
      })
      await this.roomService.addUserToRoom(currentUser.id, {
        roomId: newRoom[0].id,
      })
    } catch (error) {
      console.error(
        `Error creating room: ${name} with message: ${error.message}`,
      )
      throw new WsException(`Error creating room`)
    }
  }

  private async handleConsumeJoinRoomEvent(message: JoinRoomDto) {
    const { roomId, users, currentUser } = message
    try {
      const room = await this.roomService.getRoomById({
        roomId,
        users,
      })
      console.log(room, roomId)

      if (room.length <= 0) throw new Error()

      await this.roomService.addUserToRoom(currentUser.id, {
        roomId,
        users,
      })
    } catch (error) {
      console.error(
        `Error joining room: ${roomId} with message: ${error.message}`,
      )
      throw new WsException(`Error joining room`)
    }
  }

  private handleConsumeSystemEvent(message: KafkaMessage) {
    const parsedMessage = JSON.parse(message.value?.toString()) as string
    console.log('Publish Topic system-events', parsedMessage)
  }
}

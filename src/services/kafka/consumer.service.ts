/* eslint-disable @typescript-eslint/unbound-method */
import { Injectable } from '@nestjs/common'
import { Consumer } from 'kafkajs'
import { ChatGateway } from '../../chat.gateway'
import { KafkaService } from './kafka.service'
import { MessageService } from '../message.service'
import { CreateMessageDto } from '../../dtos/messages.dto'

@Injectable()
export class KafkaConsumerService {
  private consumer: Consumer
  constructor(
    private readonly chatGateway: ChatGateway,
    private messageService: MessageService,
  ) {
    this.consumer = KafkaService.singleton.consumer
  }

  async onApplicationBootstrap() {
    try {
      await this.consumer.connect()
      console.log('Kafka Consumer connected successfully!')
      await this.consumer.subscribe({
        topics: ['chat-messages'],
        fromBeginning: true,
      })
      console.log('Subscribed to Kafka topic: chat-messages')
    } catch (error) {
      console.error('Error in Kafka Consumer:', error)
    }
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const parsedMessage = JSON.parse(
            message.value?.toString(),
          ) as unknown as CreateMessageDto

          console.log(parsedMessage, topic)

          const createdMessage =
            await this.messageService.createMessage(parsedMessage)
          await this.chatGateway.sendMessageToClients(createdMessage)
        } catch (error) {
          console.error('Error consuming message: ', error)
        }
      },
      eachBatch: async ({
        batch,
        resolveOffset,
        heartbeat,
        // commitOffsetsIfNecessary,
        // uncommittedOffsets,
        // isRunning,
        // isStale,
        // pause,
      }) => {
        for (const message of batch.messages) {
          console.log({
            topic: batch.topic,
            partition: batch.partition,
            highWatermark: batch.highWatermark,
            message: {
              offset: message.offset,
              key: message.key.toString(),
              value: message.value.toString(),
              headers: message.headers,
            },
          })

          resolveOffset(message.offset)
          await heartbeat()
        }
      },
    })
  }
}

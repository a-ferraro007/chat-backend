import { Injectable } from '@nestjs/common'
import { Consumer } from 'kafkajs'
import { ChatGateway } from 'src/chat.gateway'
import { KafkaService } from './kafka.service'

@Injectable()
export class KafkaConsumerService {
  private consumer: Consumer
  constructor(private readonly chatGateway: ChatGateway) {
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
      console.error('Error starting Kafka Consumer:', error)
    }
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          await this.chatGateway.sendMessageToClients(message.value?.toString())
        } catch (error) {
          console.error('Error sending message to clients: ', error)
        }
      },
    })
  }
}

// @Client({
//    transport: Transport.KAFKA,
//    options: {
//      client: {
//        brokers: ['localhost:9092'], // Replace with your Kafka broker address
//      },
//      consumer: {
//        groupId: 'socket-group', // Consumer group ID
//      },
//    },
//  })
//  client: ClientKafka
// handleChatMessage(message: any) {
//    console.log('Received Kafka message:', message)

//    // Emit the message to all WebSocket clients
//    this.chatGateway.sendMessageToClients(message)
//  }

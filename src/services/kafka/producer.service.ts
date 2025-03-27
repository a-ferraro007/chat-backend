import { Injectable } from '@nestjs/common'
import { KafkaService } from './kafka.service'
import { Producer } from 'kafkajs'
import { CreateMessageDto } from '../message.service'

@Injectable()
export class KafkaProducerService {
  private producer: Producer

  constructor() {
    this.producer = KafkaService.singleton.producer
  }

  async onApplicationBootstrap() {
    try {
      await this.producer.connect()
      console.log('Kafka Producer connected successfully!')
    } catch (error) {
      console.error('Error connecting Kafka Consumer:', error)
    }
  }

  // Publish a message to the 'chat-messages' Kafka topic
  async publish(message: CreateMessageDto) {
    console.log('Publishing to Kafka:', message)
    await this.producer.send({
      topic: 'chat-messages',
      messages: [{ value: JSON.stringify(message) }],
    })
  }
}

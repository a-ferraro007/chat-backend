import { Injectable } from '@nestjs/common'
import { KafkaService } from './kafka.service'
import { Producer } from 'kafkajs'
import { CreateMessageDto } from '../../dtos/messages.dto'
import { ConsumerTopic } from './consumer.service'
import { CreateRoomDto, JoinRoomDto } from 'src/dtos/rooms.dto'

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

  // Publish a message to the given Kafka topic
  async publish(
    topic: ConsumerTopic,
    message: CreateMessageDto | CreateRoomDto | JoinRoomDto,
  ) {
    console.log('Publishing to Kafka:', message)
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    })
  }
}

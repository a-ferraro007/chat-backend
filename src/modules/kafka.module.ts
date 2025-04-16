import { Module } from '@nestjs/common'
import { ChatModule } from './chat.module'
import { KafkaConsumerService } from '../services/kafka/consumer.service'
import { KafkaProducerService } from '../services/kafka/producer.service'
import { MessageService } from '../services/message.service'

@Module({
  imports: [ChatModule],
  providers: [KafkaConsumerService, KafkaProducerService, MessageService],
})
export class KafkaModule {}

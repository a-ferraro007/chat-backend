import { Module } from '@nestjs/common'
import { ChatModule } from './chat.module'
import { KafkaConsumerService } from 'src/services/kafka/consumer.service'
import { KafkaProducerService } from 'src/services/kafka/producer.service'
import { MessageService } from 'src/services/message.service'

@Module({
  imports: [ChatModule],
  providers: [KafkaConsumerService, KafkaProducerService, MessageService],
})
export class KafkaModule {}

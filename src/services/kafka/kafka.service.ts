import { Consumer, Kafka, Producer } from 'kafkajs'

export class KafkaService {
  private static instance: KafkaService
  private client: Kafka
  consumer: Consumer
  producer: Producer

  constructor() {
    if (KafkaService.instance) {
      throw new Error('do not use constructor')
    }
    KafkaService.instance = this
  }

  static get singleton() {
    if (KafkaService.instance) return KafkaService.instance
    KafkaService.instance = new KafkaService()
    KafkaService.instance.client = new Kafka({
      clientId: 'chat-backend',
      brokers: ['localhost:9092'],
    })

    KafkaService.instance.producer = KafkaService.instance.client.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    })
    KafkaService.instance.consumer = KafkaService.instance.client.consumer({
      groupId: 'chat-group',
    })
    return KafkaService.instance
  }
}

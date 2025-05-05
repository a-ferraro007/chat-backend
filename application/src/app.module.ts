import { Module } from '@nestjs/common'
import { UsersModule } from './modules/user.module'
import { AuthModule } from './modules/auth.module'
import { RoomModule } from './modules/room.module'
import { ChatModule } from './modules/chat.module'
import { KafkaModule } from './modules/kafka.module'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChatModule,
    UsersModule,
    AuthModule,
    RoomModule,
    KafkaModule,
  ],
})
export class AppModule {}

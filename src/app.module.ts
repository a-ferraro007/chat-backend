import { Module } from '@nestjs/common'
import { UsersModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { RoomModule } from './rooms/room.module'

@Module({
  imports: [UsersModule, AuthModule, RoomModule],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { RoomController } from '../controllers/room.controller'
import { RoomService } from '../services/room.service'

@Module({
  imports: [],
  controllers: [RoomController],
  exports: [RoomService],
  providers: [RoomService],
})
export class RoomModule {}

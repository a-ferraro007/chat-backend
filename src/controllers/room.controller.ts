import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common'
import { RoomService } from '../services/room.service'
import { CreateRoomDto, JoinRoomDto } from '../dtos/rooms.dto'

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/getAll')
  async getAll() {
    return this.roomService.getAllRooms()
  }

  @HttpCode(HttpStatus.OK)
  @Get('/getById')
  async getById(@Query('id') id: string) {
    return this.roomService.getRoomById({ roomId: id } as JoinRoomDto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/createRoom')
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/addUser')
  async addUserToRoom(@Body() addUserToRoomDto: JoinRoomDto) {
    return this.roomService.addUserToRoom('', addUserToRoomDto)
  }

  // @HttpCode(HttpStatus.OK)
  // @Get('/getAllUsers')
  // async getAllUsersInRoom(@Query('id') id: string) {
  //   // return this.roomService.getAllUsersInRoom(id)
  // }
}

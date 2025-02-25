import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common'
import { RoomService } from './room.service'
import { CreateRoomDto, AddUserToRoomDto } from './rooms.dto'

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
    return this.roomService.getRoomById(id)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/createRoom')
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/addUser')
  async addUserToRoom(@Body() addUserToRoomDto: AddUserToRoomDto) {
    return this.roomService.addUserToRoom(addUserToRoomDto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('/getAllUsers')
  async getAllUsersInRoom(@Query('id') id: string) {
    return this.roomService.getAllUsersInRoom(id)
  }
}

import { Injectable } from '@nestjs/common'
import { AddUserToRoomDto, CreateRoomDto } from './rooms.dto'
import {
  findAllRooms,
  findAllUsersInRoom,
  findRoomById,
  insertIntoRoom,
  insertUserIntoRoom,
} from 'src/db/queries'

@Injectable()
export class RoomService {
  async getAllRooms() {
    return await findAllRooms()
  }

  async getRoomById(id: string) {
    return await findRoomById(id)
  }

  async createRoom(createRoomDto: CreateRoomDto) {
    const { name } = createRoomDto
    return await insertIntoRoom(name)
  }

  async addUserToRoom(addUserToRoomDto: AddUserToRoomDto) {
    const { roomId, user } = addUserToRoomDto
    return await insertUserIntoRoom(roomId, user.id)
  }

  async getAllUsersInRoom(roomId: string) {
    return await findAllUsersInRoom(roomId)
  }
}

import { Injectable } from '@nestjs/common'
import { JoinRoomDto, CreateRoomDto } from '../dtos/rooms.dto'
import {
  findAllRooms,
  findAllUsersInRoom,
  findRoomById,
  insertIntoRoom,
  insertUserIntoRoom,
} from 'src/db/queries'
import { WsException } from '@nestjs/websockets'

@Injectable()
export class RoomService {
  async getAllRooms() {
    return (await findAllRooms()).rows
  }

  async getRoomById(joinRoomDto: JoinRoomDto) {
    const { roomId } = joinRoomDto

    return (await findRoomById(roomId)).rows
  }

  async getRoomByName(name: string) {
    return (await findRoomById(name)).rows
  }

  async createRoom(createRoomDto: CreateRoomDto) {
    const { name, type } = createRoomDto
    return (await insertIntoRoom(name, type)).rows
  }

  async addUserToRoom(userId: string, joinRoomDto: JoinRoomDto) {
    const { roomId } = joinRoomDto
    return (await insertUserIntoRoom(roomId, userId)).rows
  }

  async getAllUsersInRoom({
    userId,
    roomId,
  }: {
    userId: string
    roomId: string
  }) {
    const res = await findAllUsersInRoom(roomId)
    const isInRoom = res.rows.some(({ id }) => id === userId)
    if (!isInRoom) throw new WsException('user is not in room')
    return (await findAllUsersInRoom(roomId)).rows
  }
}

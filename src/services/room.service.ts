import { Injectable } from '@nestjs/common'
import {
  JoinRoomDto,
  CreateRoomDto,
  RemoveFromRoomDto,
} from '../dtos/rooms.dto'
import {
  deleteUsersFromRoom,
  findAllRooms,
  findAllUsersInRoom,
  findRoomById,
  insertIntoRoom,
  insertUserIntoRoom,
} from '../db/queries'
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

  async removeUsersFromRoom(removeFromRoomDto: RemoveFromRoomDto) {
    const { users, roomId } = removeFromRoomDto
    return await deleteUsersFromRoom(users, roomId)
  }

  async getAllUsersInRoom({
    userId,
    roomId,
  }: {
    userId: string
    roomId: string
  }) {
    const res = (await findAllUsersInRoom(roomId)).rows
    const isInRoom = res.some(({ id }) => id === userId)
    if (!isInRoom) {
      console.error(`User ${userId} not found in Room ${roomId}`)
      throw new WsException({ message: 'User is not room' })
    }
    return res
  }
}

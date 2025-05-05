import { Injectable } from '@nestjs/common'
import {
  deleteConnectedUser,
  insertConnectedUser,
  deleteAllConnectedUsers,
  getAllConnectedUsersInRoom,
} from '../db/queries'

@Injectable()
export class ConnectedUserService {
  async create(userId: string, socketId: string) {
    await insertConnectedUser(userId, socketId)
  }
  async delete(socketId: string) {
    await deleteConnectedUser(socketId)
  }
  async deleteAll() {
    await deleteAllConnectedUsers()
  }

  async getConnectedUsersInRoom({ roomId }: { roomId: string }) {
    return (await getAllConnectedUsersInRoom(roomId)).rows
  }
}

import { User } from 'src/db/queries'

export class CreateRoomDto {
  name: string
}

export class AddUserToRoomDto {
  roomId: string
  user: User
}

export class CreateRoomDto {
  type: 'PRIVATE' | 'GROUP'
  name: string
  users: string[] // User[]
}

export class JoinRoomDto {
  roomId: string
  users?: string[] // User[]
}

export class RemoveFromRoomDto {
  roomId: string
  users: string[]
}

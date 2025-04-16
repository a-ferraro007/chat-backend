import {
  IsString,
  IsAlphanumeric,
  IsNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsEmpty,
  IsUUID,
} from 'class-validator'
import { User } from 'src/db/queries'

export class CreateRoomDto {
  @IsIn(['PRIVATE', 'GROUP'])
  type: 'PRIVATE' | 'GROUP'

  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsAlphanumeric(undefined, { each: true })
  users?: string[] // User[]

  // Refactor this Dto to internal kafka event dto
  @IsEmpty()
  action?: string

  @IsEmpty()
  currentUser?: User
}

export class JoinRoomDto {
  @IsUUID()
  roomId: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsAlphanumeric(undefined, { each: true })
  users?: string[] // User[]
}

export class RemoveFromRoomDto {
  @IsUUID()
  roomId: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsAlphanumeric(undefined, { each: true })
  users?: string[]
}

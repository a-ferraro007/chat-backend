import {
  IsString,
  IsAlphanumeric,
  IsNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsEmpty,
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
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  roomId: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsAlphanumeric(undefined, { each: true })
  users?: string[] // User[]
}

export class RemoveFromRoomDto {
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  roomId: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsAlphanumeric(undefined, { each: true })
  users?: string[]
}

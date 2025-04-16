import {
  IsString,
  IsAlphanumeric,
  IsNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
} from 'class-validator'

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

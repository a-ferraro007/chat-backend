import { IsString, IsAlphanumeric, IsNotEmpty, IsUUID } from 'class-validator'

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string

  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  text: string

  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  created_by: string

  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  created_on: string
}

import { IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator'

export class SignUpDto {
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  password: string
}

export class SignInDto {
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  password: string
}

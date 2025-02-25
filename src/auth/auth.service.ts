import { SignInDto, SignUpDto } from './auth.dto'
import { validatePwd } from 'src/db/utils'
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from 'src/user/user.service'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto) {
    try {
      const { id, username, passhash } =
        await this.userService.findUser(signInDto)
      if (!(await validatePwd(signInDto.password, passhash))) {
        throw new UnauthorizedException()
      }
      const payload = { sub: id, username }

      return {
        accessToken: await this.jwtService.signAsync(payload),
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
      } else throw error
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      // const user =
      await this.userService.createUser(signUpDto)
      return true
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error
      }
    }
  }
}

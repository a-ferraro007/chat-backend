import { SignInDto, SignUpDto } from '../dtos/auth.dto'
import { validatePwd } from 'src/db/utils'
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from 'src/services/user.service'
import { JwtService } from '@nestjs/jwt'
import { jwtConstants } from 'src/constants'

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

      return {
        accessToken: await this.jwtService.signAsync({ id, username }),
        refreshToken: await this.jwtService.signAsync(
          { id, username },
          {
            secret: jwtConstants.refreshSecret,
            expiresIn: '30d',
          },
        ),
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
      } else throw error
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const { id, username } = await this.userService.createUser(signUpDto)
      return {
        accessToken: await this.jwtService.signAsync({ id, username }),
        refreshToken: await this.jwtService.signAsync(
          { id, username },
          {
            secret: jwtConstants.refreshSecret,
            expiresIn: '30d',
          },
        ),
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error
      }
    }
  }
}

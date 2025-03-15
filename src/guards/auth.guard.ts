import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { jwtConstants } from '../constants'
import { Request } from 'express'
import { SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export type Payload = {
  id: string
  username: string
  iat: number
  exp: number
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    const req: Request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(req)

    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      const payload: Payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      })
      console.log({ payload })
      req['user'] = payload
    } catch {
      throw new UnauthorizedException()
    }

    return true
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const headers = req.headers
    const [type, token] = headers.authorization?.split(' ') ?? [
      undefined,
      undefined,
    ]
    return type === 'Bearer' ? token : undefined
  }
}

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

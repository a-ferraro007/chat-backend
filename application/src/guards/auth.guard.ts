import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { jwtConstants } from '../constants'
import { Request, Response } from 'express'
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

    const req = context.switchToHttp().getRequest<Request>()
    const { accessToken, refreshToken } = this.extractTokensFromHeaders(req)

    if (!accessToken) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync<Payload>(accessToken, {
        secret: jwtConstants.accessSecret,
      })
      req['user'] = payload
    } catch (error) {
      if (refreshToken) {
        try {
          const res = context.switchToHttp().getResponse<Response>()
          await this.handleRefreshToken(refreshToken, req, res)
        } catch (error) {
          console.error(error)
          throw new UnauthorizedException(error)
        }
      } else throw new UnauthorizedException(error)
    }

    return true
  }

  private extractTokensFromHeaders(req: Request): {
    accessToken?: string
    refreshToken?: string
  } {
    const tokens: {
      accessToken?: string
      refreshToken?: string
    } = { accessToken: undefined, refreshToken: undefined }

    const headers = req.headers
    const [type, token] = headers.authorization?.split(' ') ?? [
      undefined,
      undefined,
    ]
    if (type === 'Bearer') tokens.accessToken = token

    const { refreshToken } = req.cookies
    if (refreshToken) tokens.refreshToken = refreshToken as string

    return tokens
  }

  private async handleRefreshToken(
    refreshToken: string,
    req: Request,
    res: Response,
  ) {
    try {
      const { id, username } = await this.jwtService.verifyAsync<Payload>(
        refreshToken,
        {
          secret: jwtConstants.refreshSecret,
        },
      )

      const newAccessToken = await this.jwtService.signAsync({ id, username })
      const newRefreshToken = await this.jwtService.signAsync(
        { id, username },
        {
          secret: jwtConstants.refreshSecret,
        },
      )

      req['user'] = await this.jwtService.verifyAsync<Payload>(newAccessToken)
      res.setHeader('Authorization', `Bearer ${newAccessToken}`)
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })
    } catch (error) {
      console.log(error)
      throw new Error('Error refreshing tokens')
    }
  }
}

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

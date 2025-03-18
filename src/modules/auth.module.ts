import { Module } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { AuthController } from '../controllers/auth.controller'
import { UsersModule } from 'src/modules/user.module'
import { JwtModule } from '@nestjs/jwt'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '../guards/auth.guard'
import { jwtConstants } from '../constants'

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.accessSecret,
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

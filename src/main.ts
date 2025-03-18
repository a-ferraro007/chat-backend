import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { IoAdapter } from '@nestjs/platform-socket.io'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api/v1')
  app.enableCors()
  app.useWebSocketAdapter(new IoAdapter(app))
  app.use(cookieParser())
  await app.listen(3000, '0.0.0.0')
  console.log(`Application is running on: ${await app.getUrl()}`)
}
bootstrap()

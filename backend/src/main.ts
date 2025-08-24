import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3001', // фронтенд
    credentials: true, // чтобы сработал withCredentials
  });

  await app.listen(3000);
}
bootstrap();

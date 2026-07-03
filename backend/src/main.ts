import 'reflect-metadata';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyStatic from '@fastify/static';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: ['log', 'error', 'warn'],
  });

  app.register(fastifyStatic, {
    root: join(__dirname, '..', '..'),
    prefix: '/static/',
    index: false,
    wildcard: false,
  });

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  const url = await app.getUrl();
  console.log(`Server lokal berjalan di: ${url}`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import express from 'express';
import { initI18n, getI18nMiddleware } from '../src/i18n/i18n.config';

const server = express();

export default async (req: any, res: any) => {
  if (!global.nestApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger: ['error', 'warn', 'log'],
      }
    );

    const configService = app.get(ConfigService);

    // Initialize i18n
    await initI18n();
    app.use(getI18nMiddleware());

    // CORS 설정
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-auth'],
    });

    // 전역 파이프
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // 전역 예외 필터
    app.useGlobalFilters(new HttpExceptionFilter());

    // API 프리픽스 설정
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'docs'],
    });

    await app.init();
    global.nestApp = app;
  }

  server(req, res);
};
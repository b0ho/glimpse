import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import express from 'express';

const server = express();
let app: any = null;

const initializeApp = async () => {
  if (app) return;
  
  try {
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger: process.env.NODE_ENV === 'production' 
          ? ['error', 'warn'] 
          : ['error', 'warn', 'log'],
      }
    );

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
    exclude: ['health', 'health/db', 'docs'],
  });

  await app.init();
  } catch (error) {
    console.error('Failed to initialize NestJS app:', error);
    throw error;
  }
};

export default async (req: any, res: any) => {
  try {
    await initializeApp();
    return server(req, res);
  } catch (error) {
    console.error('Request handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
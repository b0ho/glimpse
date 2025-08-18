import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// import { initI18n, getI18nMiddleware } from '../src/i18n/i18n.config';

let app: any;

async function createNestApp() {
  if (app) {
    return app;
  }

  app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  // 보안 헤더 설정 (Vercel에 최적화)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 응답 압축
  app.use(compression());

  // CORS 설정
  app.enableCors({
    origin: [
      'https://glimpse-mobile.vercel.app',
      'https://glimpse-web.vercel.app', 
      'https://glimpse-admin.vercel.app',
      'https://glimpse.vercel.app',
      // Development origins
      'http://localhost:8081',
      'http://localhost:19000',
      'http://localhost:3000',
      // Expo production URLs
      'exp://u.expo.dev',
      'https://u.expo.dev',
    ],
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

  // Swagger 설정 (프로덕션에서도 활성화)
  const config = new DocumentBuilder()
    .setTitle('Glimpse API')
    .setDescription('글림프스 데이팅 앱 API 문서')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.init();
  return app;
}

// Vercel 서버리스 함수 핸들러
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const nestApp = await createNestApp();
    const server = nestApp.getHttpAdapter().getInstance();
    
    return server(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
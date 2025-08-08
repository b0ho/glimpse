import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';

/**
 * NestJS 애플리케이션 부트스트랩
 *
 * 서버를 초기화하고 필요한 미들웨어를 설정합니다.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // 보안 헤더 설정
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // CSS는 unsafe-inline 필요 (React Native)
          scriptSrc: ["'self'"], // unsafe-inline과 unsafe-eval 제거
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:'], // WebSocket 연결 허용
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // 모바일 앱 호환성
    }),
  );

  // 응답 압축
  app.use(compression());

  // CORS 설정
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:19000',
      'http://localhost:3001',
      'exp://192.168.0.2:8081',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // Swagger 설정
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
    .addTag('auth', '인증 관련 API')
    .addTag('users', '사용자 관리 API')
    .addTag('groups', '그룹 관리 API')
    .addTag('likes', '좋아요 및 매칭 API')
    .addTag('chat', '채팅 API')
    .addTag('payment', '결제 API')
    .addTag('notification', '알림 API')
    .addTag('admin', '관리자 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`🚀 NestJS server is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();

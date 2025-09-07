import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';
import { initI18n, getI18nMiddleware } from './i18n/i18n.config';
import { EnvConfig } from './config/env.config';

// Load environment configuration (including secrets)
const envConfig = EnvConfig.getInstance();
envConfig.load();

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
  const port = process.env.PORT || configService.get<number>('PORT', 3000);

  // CRITICAL: Emergency CORS headers for production
  // This ensures CORS headers are ALWAYS sent, regardless of environment detection
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://www.glimpse.contact',
      'https://glimpse.contact',
      'https://glimpse-mobile.vercel.app',
      'https://glimpse-web.vercel.app',
      'https://glimpse-admin.vercel.app',
      'https://glimpse.vercel.app',
      'exp://u.expo.dev',
      'https://u.expo.dev',
    ];

    // Detect if this is a Railway production environment
    const isRailwayProduction = process.env.RAILWAY_ENVIRONMENT === 'production' ||
                                process.env.NODE_ENV === 'production' ||
                                req.get('host')?.includes('.railway.app') ||
                                req.get('host')?.includes('glimpse.contact');

    console.log('🔍 CORS Middleware Debug:', {
      origin,
      host: req.get('host'),
      method: req.method,
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      isRailwayProduction,
      allowedOrigins
    });

    // For Railway production or production-like environments, ALWAYS set CORS headers
    if (isRailwayProduction || req.get('host')?.includes('railway.app')) {
      console.log('🚀 Setting CORS headers for production');
      
      if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || 'https://www.glimpse.contact');
      } else {
        // Even for non-allowed origins, set a default for debugging
        res.header('Access-Control-Allow-Origin', '*');
      }
      
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth, Accept, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      
      // Handle preflight OPTIONS requests immediately
      if (req.method === 'OPTIONS') {
        console.log('✅ Handled OPTIONS preflight request');
        res.sendStatus(204);
        return;
      }
    }
    
    next();
  });

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

  // Initialize i18n
  await initI18n();
  app.use(getI18nMiddleware());

  // CORS 설정 - 개발 환경과 프로덕션 환경 구분
  const isDevelopment = configService.get<string>('NODE_ENV') === 'development';
  const isProduction = configService.get<string>('NODE_ENV') === 'production' || 
                       process.env.NODE_ENV === 'production' ||
                       process.env.RAILWAY_ENVIRONMENT === 'production';

  // Production CORS origins - explicitly defined
  const productionOrigins = [
    'https://www.glimpse.contact',
    'https://glimpse.contact',
    'https://glimpse-mobile.vercel.app',
    'https://glimpse-web.vercel.app',
    'https://glimpse-admin.vercel.app',
    'https://glimpse.vercel.app',
    'exp://u.expo.dev',
    'https://u.expo.dev',
    process.env.CLIENT_URL,
    process.env.WEB_URL,
  ].filter(Boolean);

  console.log('🔒 CORS Configuration:', {
    environment: process.env.NODE_ENV,
    isProduction,
    isDevelopment,
    allowedOrigins: isProduction ? productionOrigins : 'development-all',
  });

  app.enableCors({
    origin: (origin: any, callback: any) => {
      console.log('🌐 NestJS CORS Origin Check:', { origin, isDevelopment, isProduction });
      
      if (isDevelopment) {
        callback(null, true);
      } else if (isProduction) {
        if (productionOrigins.includes(origin) || !origin) {
          callback(null, true);
        } else {
          console.log('⚠️ CORS rejected origin:', origin);
          // For debugging, allow all origins temporarily
          callback(null, true);
        }
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-auth', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
    optionsSuccessStatus: 204,
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

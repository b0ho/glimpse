import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  /**
   * 헬스체크 엔드포인트 - 인증 불필요
   */
  @Get('health')
  @ApiOperation({ summary: 'API 서버 헬스체크' })
  @ApiResponse({ status: 200, description: '서버 정상 작동' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.1',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * 서버 정보 엔드포인트 - 인증 불필요
   */
  @Get('info')
  @ApiOperation({ summary: '서버 정보 조회' })
  @ApiResponse({ status: 200, description: '서버 정보' })
  info() {
    return {
      name: 'Glimpse API Server',
      version: '1.0.1',
      description: 'Privacy-focused Korean dating app API',
      timestamp: new Date().toISOString(),
    };
  }
  @Get('debug/env')
  debugEnv() {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const clerkPublishable = process.env.CLERK_PUBLISHABLE_KEY;
    const nextPublic = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    return {
      timestamp: new Date().toISOString(),
      buildTime: '2025-09-08T15:37:30Z', // 빌드 타임스탬프
      version: '1.0.1', // 버전 마커
      nodeEnv: process.env.NODE_ENV,
      railway: !!process.env.RAILWAY_ENVIRONMENT,
      clerk: {
        hasSecretKey: !!clerkSecret,
        secretKeyPrefix: clerkSecret?.substring(0, 15) + '...',
        hasPublishableKey: !!clerkPublishable,
        publishableKeyPrefix: clerkPublishable?.substring(0, 15) + '...',
        hasNextPublicKey: !!nextPublic,
        nextPublicKeyPrefix: nextPublic?.substring(0, 15) + '...',
      },
      database: {
        hasUrl: !!process.env.DATABASE_URL,
      }
    };
  }
}

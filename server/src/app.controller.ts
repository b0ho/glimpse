import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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

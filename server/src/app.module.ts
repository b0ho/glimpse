import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { LikeModule } from './like/like.module';
import { MatchModule } from './match/match.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { FileModule } from './file/file.module';

/**
 * 애플리케이션 루트 모듈
 * 
 * 모든 기능 모듈을 통합하고 전역 설정을 관리합니다.
 */
@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // 요청 속도 제한
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분
        limit: 60, // 60회
      },
    ]),
    
    // 스케줄링
    ScheduleModule.forRoot(),
    
    // 코어 모듈
    PrismaModule,
    
    // 기능 모듈
    AuthModule,
    
    UserModule,
    
    GroupModule,
    
    LikeModule,
    
    MatchModule,
    
    ChatModule,
    
    PaymentModule,
    
    NotificationModule,
    
    FileModule,
  ],
})
export class AppModule {}

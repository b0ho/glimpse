import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { MatchingModule } from './matching/matching.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { FileModule } from './file/file.module';
import { EncryptionModule } from './core/encryption/encryption.module';
import { CacheModule } from './core/cache/cache.module';
import { EmailModule } from './core/email/email.module';
import { SmsModule } from './core/sms/sms.module';
import { FirebaseModule } from './core/firebase/firebase.module';
import { MessageQueueModule } from './core/message-queue/message-queue.module';
import { CronModule } from './core/cron/cron.module';
import { OcrModule } from './core/ocr/ocr.module';
import { CompanyVerificationModule } from './core/company-verification/company-verification.module';
import { AdminModule } from './admin/admin.module';
import { ContentFilterModule } from './content-filter/content-filter.module';
import { LocationModule } from './location/location.module';
import { VideoCallModule } from './video-call/video-call.module';
import { CompanyDomainModule } from './company-domain/company-domain.module';
import { FriendModule } from './friend/friend.module';
import { StoryModule } from './story/story.module';
import { ContentModule } from './content/content.module';

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

    // 요청 속도 제한 - 다층 보호
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1초
        limit: 10, // 10회 - 단기 버스트 방지
      },
      {
        name: 'medium',
        ttl: 60000, // 1분
        limit: 100, // 100회 - 일반적인 사용 패턴
      },
      {
        name: 'long',
        ttl: 900000, // 15분
        limit: 1000, // 1000회 - 장기 제한
      },
    ]),

    // 스케줄링
    ScheduleModule.forRoot(),

    // 이벤트 이미터
    EventEmitterModule.forRoot(),

    // 코어 모듈
    PrismaModule,

    // 기능 모듈
    AuthModule,

    UserModule,

    GroupModule,

    MatchingModule,

    ChatModule,

    PaymentModule,

    NotificationModule,

    FileModule,

    EncryptionModule,

    CacheModule,

    EmailModule,

    SmsModule,

    FirebaseModule,

    MessageQueueModule,

    CronModule,

    OcrModule,

    CompanyVerificationModule,

    AdminModule,

    ContentFilterModule,

    LocationModule,

    VideoCallModule,

    CompanyDomainModule,

    FriendModule,

    StoryModule,

    ContentModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

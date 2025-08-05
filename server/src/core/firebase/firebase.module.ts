import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Firebase 모듈
 *
 * Firebase Cloud Messaging을 통한 푸시 알림 기능을 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}

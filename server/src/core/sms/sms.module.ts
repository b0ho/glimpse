import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';

/**
 * SMS 모듈
 *
 * SMS 발송 기능을 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}

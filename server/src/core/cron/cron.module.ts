import { Global, Module } from '@nestjs/common';
import { CronService } from './cron.service';

/**
 * 크론 작업 모듈
 *
 * 주기적으로 실행되는 시스템 작업을 관리합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}

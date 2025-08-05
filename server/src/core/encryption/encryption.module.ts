import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * 암호화 모듈
 *
 * 애플리케이션 전반에서 사용되는 암호화 서비스를 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}

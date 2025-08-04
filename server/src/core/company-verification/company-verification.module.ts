import { Global, Module } from '@nestjs/common';
import { CompanyVerificationService } from './company-verification.service';

/**
 * 회사 인증 모듈
 * 
 * 회사 이메일 도메인 및 OCR 기반 인증 기능을 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  providers: [CompanyVerificationService],
  exports: [CompanyVerificationService],
})
export class CompanyVerificationModule {}
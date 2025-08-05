import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRetryService } from './payment-retry.service';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../core/cache/cache.module';

/**
 * 결제 모듈
 *
 * 결제 관련 기능을 제공하는 모듈입니다.
 * TossPay, KakaoPay 통합, 구독 관리, 환불 처리 등의 기능을 포함합니다.
 */
@Module({
  imports: [AuthModule, CacheModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRetryService],
  exports: [PaymentService, PaymentRetryService],
})
export class PaymentModule {}

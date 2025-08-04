import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AuthModule } from '../auth/auth.module';

/**
 * 결제 모듈
 * 
 * 결제 관련 기능을 제공하는 모듈입니다.
 * TossPay, KakaoPay 통합, 구독 관리, 환불 처리 등의 기능을 포함합니다.
 */
@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  RefundPaymentDto,
  CreateCreditPurchaseDto,
  CreateSubscriptionDto,
} from './dto/create-payment.dto';
import { Request } from 'express';

/**
 * 결제 컨트롤러
 *
 * 결제 생성, 처리, 환불, 구독 관리 등의 엔드포인트를 제공합니다.
 */
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 결제 플랜 조회 (테스트용)
   */
  @Get('plans')
  @UseGuards(AuthGuard)
  async getPaymentPlans() {
    return {
      success: true,
      data: [
        { id: '1', name: 'Basic', price: 9900 },
        { id: '2', name: 'Premium', price: 19900 },
      ],
    };
  }

  /**
   * 결제 생성
   */
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @CurrentUserId() userId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(userId, createPaymentDto);
  }

  /**
   * 결제 처리
   */
  @Post(':id/process')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Param('id') paymentId: string,
    @CurrentUserId() userId: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.paymentService.processPayment(
      paymentId,
      userId,
      processPaymentDto,
    );
  }

  /**
   * 결제 검증
   */
  @Get(':id/verify')
  @UseGuards(AuthGuard)
  async verifyPayment(@Param('id') paymentId: string) {
    return this.paymentService.verifyPayment(paymentId);
  }

  /**
   * 결제 환불
   */
  @Post(':id/refund')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment(
      paymentId,
      refundPaymentDto.reason,
    );
  }

  /**
   * 크레딧 구매
   */
  @Post('credits')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCreditPurchase(
    @CurrentUserId() userId: string,
    @Body() createCreditPurchaseDto: CreateCreditPurchaseDto,
  ) {
    return this.paymentService.createCreditPurchase(
      userId,
      createCreditPurchaseDto,
    );
  }

  /**
   * 프리미엄 구독 생성
   */
  @Post('subscription')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @CurrentUserId() userId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.paymentService.createSubscription(
      userId,
      createSubscriptionDto,
    );
  }

  /**
   * 구독 취소
   */
  @Post('subscription/cancel')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUserId() userId: string) {
    return this.paymentService.cancelSubscription(userId);
  }

  /**
   * 활성 구독 조회
   */
  @Get('subscription/active')
  @UseGuards(AuthGuard)
  async getActiveSubscription(@CurrentUserId() userId: string) {
    return this.paymentService.getActiveSubscription(userId);
  }

  /**
   * 사용자 결제 내역
   */
  @Get('history')
  @UseGuards(AuthGuard)
  async getUserPayments(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.paymentService.getUserPayments(userId, pageNum, limitNum);
  }

  /**
   * Stripe 웹훅
   */
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    // TODO: Stripe 서명 검증 추가
    return this.paymentService.handleStripeWebhook(body);
  }

  /**
   * 토스 웹훅
   */
  @Post('webhook/toss')
  @HttpCode(HttpStatus.OK)
  async handleTossWebhook(
    @Body() body: any,
    @Headers('x-toss-signature') signature: string,
  ) {
    // 서명 검증
    const isValid = this.paymentService.verifyTossWebhook(signature, body);
    if (!isValid) {
      return { success: false, message: 'Invalid signature' };
    }

    await this.paymentService.handleTossWebhook(body);
    return { success: true };
  }

  /**
   * 카카오 웹훅
   */
  @Post('webhook/kakao')
  @HttpCode(HttpStatus.OK)
  async handleKakaoWebhook(
    @Body() body: any,
    @Headers('x-kakao-signature') signature: string,
  ) {
    // 서명 검증
    const isValid = this.paymentService.verifyKakaoWebhook(signature, body);
    if (!isValid) {
      return { success: false, message: 'Invalid signature' };
    }

    await this.paymentService.handleKakaoWebhook(body);
    return { success: true };
  }

  /**
   * 토스 결제 성공 콜백
   */
  @Get('success')
  async paymentSuccess(@Query() query: any) {
    // 결제 성공 처리 후 앱으로 리다이렉트
    return {
      success: true,
      paymentKey: query.paymentKey,
      orderId: query.orderId,
      amount: query.amount,
    };
  }

  /**
   * 토스 결제 실패 콜백
   */
  @Get('fail')
  async paymentFail(@Query() query: any) {
    // 결제 실패 처리 후 앱으로 리다이렉트
    return {
      success: false,
      code: query.code,
      message: query.message,
      orderId: query.orderId,
    };
  }

  /**
   * 카카오 결제 성공 콜백
   */
  @Get('kakao/success')
  async kakaoPaymentSuccess(@Query() query: any) {
    // 카카오 결제 성공 처리
    return {
      success: true,
      pg_token: query.pg_token,
    };
  }

  /**
   * 카카오 결제 취소 콜백
   */
  @Get('kakao/cancel')
  async kakaoPaymentCancel(@Query() query: any) {
    // 카카오 결제 취소 처리
    return {
      success: false,
      status: 'cancelled',
    };
  }

  /**
   * 카카오 결제 실패 콜백
   */
  @Get('kakao/fail')
  async kakaoPaymentFail(@Query() query: any) {
    // 카카오 결제 실패 처리
    return {
      success: false,
      status: 'failed',
    };
  }
}

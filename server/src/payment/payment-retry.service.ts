import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { PaymentService } from './payment.service';
import { CacheService } from '../core/cache/cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * 재시도 설정 인터페이스
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * 재시도 상태 인터페이스
 */
interface RetryState {
  attempts: number;
  lastAttemptAt: Date;
  nextRetryAt: Date;
  errorHistory: Array<{
    timestamp: Date;
    error: string;
    provider: string;
  }>;
}

/**
 * 서킷 브레이커 상태 인터페이스
 */
interface CircuitBreakerState {
  failures: number;
  isOpen: boolean;
  openedAt: number;
}

/**
 * 결제 재시도 서비스 - 자동 재시도 및 서킷 브레이커 관리
 */
@Injectable()
export class PaymentRetryService {
  private readonly logger = new Logger(PaymentRetryService.name);

  private readonly defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 5000, // 5 seconds
    maxDelay: 300000, // 5 minutes
    backoffFactor: 2,
  };

  private circuitBreaker: Map<string, CircuitBreakerState> = new Map();
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 300000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 실패 시 자동 재시도로 결제 처리
   */
  async processPaymentWithRetry(
    paymentId: string,
    userId: string,
    paymentData: any,
    config?: Partial<RetryConfig>,
  ): Promise<any> {
    const retryConfig = { ...this.defaultConfig, ...config };

    // Get or initialize retry state
    let retryState = await this.getRetryState(paymentId);
    if (!retryState) {
      retryState = {
        attempts: 0,
        lastAttemptAt: new Date(),
        nextRetryAt: new Date(),
        errorHistory: [],
      };
    }

    // Check if max retries exceeded
    if (retryState.attempts >= retryConfig.maxRetries) {
      await this.markPaymentAsFailed(paymentId, 'Max retries exceeded');
      throw new Error('결제 재시도 횟수를 초과했습니다');
    }

    // Check circuit breaker
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { method: true },
    });

    if (!payment) {
      throw new Error('결제를 찾을 수 없습니다');
    }

    if (this.isCircuitOpen(payment.method)) {
      this.logger.warn(`Circuit breaker open for ${payment.method}`);
      throw new Error('결제 시스템이 일시적으로 사용할 수 없습니다');
    }

    try {
      // Attempt payment processing
      retryState.attempts++;
      retryState.lastAttemptAt = new Date();
      await this.saveRetryState(paymentId, retryState);

      const result = await this.paymentService.processPayment(
        paymentId,
        userId,
        paymentData,
      );

      // Success - clean up retry state
      await this.clearRetryState(paymentId);
      this.recordSuccess(payment.method);

      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Record failure
      retryState.errorHistory.push({
        timestamp: new Date(),
        error: errorMessage,
        provider: payment.method,
      });

      this.recordFailure(payment.method);

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        await this.markPaymentAsFailed(paymentId, errorMessage);
        throw error;
      }

      // Calculate next retry time
      const delay = this.calculateBackoff(retryState.attempts, retryConfig);
      retryState.nextRetryAt = new Date(Date.now() + delay);

      await this.saveRetryState(paymentId, retryState);

      // Schedule retry
      if (retryState.attempts < retryConfig.maxRetries) {
        await this.scheduleRetry(
          paymentId,
          userId,
          paymentData,
          delay,
          retryConfig,
        );

        this.logger.log(
          `Payment ${paymentId} scheduled for retry #${retryState.attempts} in ${delay}ms`,
        );

        throw new Error(
          `결제가 실패했습니다. ${Math.ceil(delay / 1000)}초 후 자동으로 재시도됩니다`,
        );
      } else {
        await this.markPaymentAsFailed(
          paymentId,
          'Max retries exceeded after failures',
        );
        throw new Error(
          '결제 처리에 실패했습니다. 다른 결제 수단을 이용해주세요',
        );
      }
    }
  }

  /**
   * 재시도 대기 중인 모든 결제 조회
   */
  async getPendingRetries(): Promise<any[]> {
    const pattern = 'payment:retry:*';
    const keys = await this.cacheService.keys(pattern);
    const pendingRetries = [];

    for (const key of keys) {
      const paymentId = key.replace('payment:retry:', '');
      const retryState = await this.cacheService.get<RetryState>(key);

      if (retryState && new Date() >= retryState.nextRetryAt) {
        const payment = await this.prisma.payment.findUnique({
          where: { id: paymentId },
          select: {
            id: true,
            userId: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        });

        if (payment && payment.status === 'PENDING') {
          pendingRetries.push({
            payment,
            retryState,
          });
        }
      }
    }

    return pendingRetries;
  }

  /**
   * 모든 대기 중인 재시도 처리 (cron job에서 호출)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingRetries(): Promise<void> {
    const pendingRetries = await this.getPendingRetries();

    this.logger.log(
      `Processing ${pendingRetries.length} pending payment retries`,
    );

    for (const { payment, retryState } of pendingRetries) {
      try {
        await this.processPaymentWithRetry(
          payment.id,
          payment.userId,
          {}, // Payment data should be stored in payment metadata
          { maxRetries: this.defaultConfig.maxRetries - retryState.attempts },
        );
      } catch (error) {
        this.logger.error(`Failed to retry payment ${payment.id}:`, error);
      }
    }
  }

  // Helper methods

  /**
   * 재시도 상태 조회
   */
  private async getRetryState(paymentId: string): Promise<RetryState | null> {
    return this.cacheService.get<RetryState>(`payment:retry:${paymentId}`);
  }

  /**
   * 재시도 상태 저장
   */
  private async saveRetryState(
    paymentId: string,
    state: RetryState,
  ): Promise<void> {
    await this.cacheService.set(`payment:retry:${paymentId}`, state, {
      ttl: 86400,
    }); // 24 hours
  }

  /**
   * 재시도 상태 삭제
   */
  private async clearRetryState(paymentId: string): Promise<void> {
    await this.cacheService.del(`payment:retry:${paymentId}`);
  }

  /**
   * 백오프 지연 시간 계산
   */
  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay,
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * delay * 0.1;
  }

  /**
   * 재시도 가능한 오류인지 확인
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error.message || '';
    const statusCode = error.statusCode || error.status;

    // Don't retry client errors (4xx)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    // Retry on network errors and server errors
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'network',
      'timeout',
      'server error',
      '502',
      '503',
      '504',
    ];

    return retryableErrors.some((err) =>
      errorMessage.toLowerCase().includes(err.toLowerCase()),
    );
  }

  /**
   * 재시도 스케줄링
   */
  private async scheduleRetry(
    paymentId: string,
    userId: string,
    paymentData: any,
    delay: number,
    config: RetryConfig,
  ): Promise<void> {
    setTimeout(async () => {
      try {
        await this.processPaymentWithRetry(
          paymentId,
          userId,
          paymentData,
          config,
        );
      } catch (error) {
        this.logger.error(
          `Scheduled retry failed for payment ${paymentId}:`,
          error,
        );
      }
    }, delay);
  }

  /**
   * 결제를 실패로 표시
   */
  private async markPaymentAsFailed(
    paymentId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        metadata: {
          failureReason: reason,
          failedAt: new Date().toISOString(),
        },
      },
    });
  }

  // Circuit breaker implementation

  /**
   * 서킷 브레이커 오픈 상태 확인
   */
  private isCircuitOpen(provider: string): boolean {
    const state = this.circuitBreaker.get(provider);
    if (!state) return false;

    if (
      state.isOpen &&
      Date.now() - state.openedAt > this.circuitBreakerTimeout
    ) {
      // Try to close the circuit
      state.isOpen = false;
      state.failures = 0;
    }

    return state.isOpen;
  }

  /**
   * 성공 기록
   */
  private recordSuccess(provider: string): void {
    const state = this.circuitBreaker.get(provider);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * 실패 기록
   */
  private recordFailure(provider: string): void {
    let state = this.circuitBreaker.get(provider);
    if (!state) {
      state = {
        failures: 0,
        isOpen: false,
        openedAt: 0,
      };
      this.circuitBreaker.set(provider, state);
    }

    state.failures++;

    if (state.failures >= this.circuitBreakerThreshold) {
      state.isOpen = true;
      state.openedAt = Date.now();
      this.logger.warn(
        `Circuit breaker opened for ${provider} after ${state.failures} failures`,
      );
    }
  }
}

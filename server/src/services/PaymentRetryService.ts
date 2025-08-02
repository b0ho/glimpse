import { prisma } from '../config/database';
import { PaymentStatus } from '@prisma/client';
import { logger } from '../middleware/logging';
import { metrics } from '../utils/monitoring';
import { PaymentService } from './PaymentService';
import { cacheService } from './CacheService';
import { createError } from '../middleware/errorHandler';

/**
 * 재시도 설정 인터페이스
 * @interface RetryConfig
 */
interface RetryConfig {
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 초기 지연 시간 (ms) */
  initialDelay: number;
  /** 최대 지연 시간 (ms) */
  maxDelay: number;
  /** 백오프 계수 */
  backoffFactor: number;
}

/**
 * 재시도 상태 인터페이스
 * @interface RetryState
 */
interface RetryState {
  /** 시도 횟수 */
  attempts: number;
  /** 마지막 시도 시간 */
  lastAttemptAt: Date;
  /** 다음 재시도 시간 */
  nextRetryAt: Date;
  /** 오류 이력 */
  errorHistory: Array<{
    timestamp: Date;
    error: string;
    provider: string;
  }>;
}

/**
 * 결제 재시도 서비스 - 자동 재시도 및 서킷 브레이커 관리
 * @class PaymentRetryService
 */
export class PaymentRetryService {
  private readonly defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 5000, // 5 seconds
    maxDelay: 300000,  // 5 minutes
    backoffFactor: 2
  };
  
  private paymentService: PaymentService;
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map();
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 300000; // 5 minutes
  
  constructor() {
    this.paymentService = new PaymentService();
  }
  
  /**
   * 실패 시 자동 재시도로 결제 처리
   * @param {string} paymentId - 결제 ID
   * @param {string} userId - 사용자 ID
   * @param {any} paymentData - 결제 데이터
   * @param {Partial<RetryConfig>} [config] - 재시도 설정
   * @returns {Promise<any>} 결제 결과
   * @throws {Error} 최대 재시도 초과 또는 서킷 오픈
   */
  async processPaymentWithRetry(
    paymentId: string,
    userId: string,
    paymentData: any,
    config?: Partial<RetryConfig>
  ): Promise<any> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const stateKey = `payment:retry:${paymentId}`;
    
    // Get or initialize retry state
    let retryState = await this.getRetryState(paymentId);
    if (!retryState) {
      retryState = {
        attempts: 0,
        lastAttemptAt: new Date(),
        nextRetryAt: new Date(),
        errorHistory: []
      };
    }
    
    // Check if max retries exceeded
    if (retryState.attempts >= retryConfig.maxRetries) {
      await this.markPaymentAsFailed(paymentId, 'Max retries exceeded');
      throw createError(400, '결제 재시도 횟수를 초과했습니다');
    }
    
    // Check circuit breaker
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { method: true }
    });
    
    if (!payment) {
      throw createError(404, '결제를 찾을 수 없습니다');
    }
    
    if (this.isCircuitOpen(payment.method)) {
      logger.warn(`Circuit breaker open for ${payment.method}`);
      throw createError(503, '결제 시스템이 일시적으로 사용할 수 없습니다');
    }
    
    try {
      // Attempt payment processing
      retryState.attempts++;
      retryState.lastAttemptAt = new Date();
      await this.saveRetryState(paymentId, retryState);
      
      metrics.paymentAttemptsTotal.labels(payment.method, 'retry').inc();
      
      const result = await this.paymentService.processPayment(paymentId, userId, paymentData);
      
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
        provider: payment.method
      });
      
      this.recordFailure(payment.method);
      metrics.paymentFailuresTotal.labels(payment.method, 'retry_failed').inc();
      
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
        await this.scheduleRetry(paymentId, userId, paymentData, delay, retryConfig);
        
        logger.info(`Payment ${paymentId} scheduled for retry #${retryState.attempts} in ${delay}ms`);
        
        throw createError(202, `결제가 실패했습니다. ${Math.ceil(delay / 1000)}초 후 자동으로 재시도됩니다`);
      } else {
        await this.markPaymentAsFailed(paymentId, 'Max retries exceeded after failures');
        throw createError(400, '결제 처리에 실패했습니다. 다른 결제 수단을 이용해주세요');
      }
    }
  }
  
  /**
   * 실패한 웹훅 전송 재시도 처리
   * @param {string} webhookId - 웹훅 ID
   * @param {string} url - 웹훅 URL
   * @param {any} payload - 웹훅 페이로드
   * @param {Record<string, string>} headers - HTTP 헤더
   * @returns {Promise<void>}
   */
  async retryWebhook(
    webhookId: string,
    url: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<void> {
    const stateKey = `webhook:retry:${webhookId}`;
    let retryState = await cacheService.get<RetryState>(stateKey) || {
      attempts: 0,
      lastAttemptAt: new Date(),
      nextRetryAt: new Date(),
      errorHistory: []
    };
    
    if (retryState.attempts >= this.defaultConfig.maxRetries) {
      logger.error(`Webhook ${webhookId} exceeded max retries`);
      return;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Success - clean up
      await cacheService.delete(stateKey);
      logger.info(`Webhook ${webhookId} delivered successfully`);
    } catch (error) {
      retryState.attempts++;
      retryState.lastAttemptAt = new Date();
      retryState.errorHistory.push({
        timestamp: new Date(),
        error: (error as Error).message,
        provider: 'webhook'
      });
      
      const delay = this.calculateBackoff(retryState.attempts, this.defaultConfig);
      retryState.nextRetryAt = new Date(Date.now() + delay);
      
      await cacheService.set(stateKey, retryState, { ttl: 86400 }); // 24 hours
      
      if (retryState.attempts < this.defaultConfig.maxRetries) {
        setTimeout(() => {
          this.retryWebhook(webhookId, url, payload, headers).catch(err => {
            logger.error('Webhook retry error:', err);
          });
        }, delay);
      }
    }
  }
  
  /**
   * 재시도 대기 중인 모든 결제 조회
   * @returns {Promise<any[]>} 대기 중인 결제 목록
   */
  async getPendingRetries(): Promise<any[]> {
    const pattern = 'payment:retry:*';
    const keys = await cacheService.keys(pattern);
    const pendingRetries = [];
    
    for (const key of keys) {
      const paymentId = key.replace('payment:retry:', '');
      const retryState = await cacheService.get<RetryState>(key);
      
      if (retryState && new Date() >= retryState.nextRetryAt) {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          select: {
            id: true,
            userId: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true
          }
        });
        
        if (payment && payment.status === 'PENDING') {
          pendingRetries.push({
            payment,
            retryState
          });
        }
      }
    }
    
    return pendingRetries;
  }
  
  /**
   * 모든 대기 중인 재시도 처리 (cron job에서 호출)
   * @returns {Promise<void>}
   */
  async processPendingRetries(): Promise<void> {
    const pendingRetries = await this.getPendingRetries();
    
    logger.info(`Processing ${pendingRetries.length} pending payment retries`);
    
    for (const { payment, retryState } of pendingRetries) {
      try {
        await this.processPaymentWithRetry(
          payment.id,
          payment.userId,
          {}, // Payment data should be stored in payment metadata
          { maxRetries: this.defaultConfig.maxRetries - retryState.attempts }
        );
      } catch (error) {
        logger.error(`Failed to retry payment ${payment.id}:`, error);
      }
    }
  }
  
  // Helper methods
  
  /**
   * 재시도 상태 조회
   * @private
   * @param {string} paymentId - 결제 ID
   * @returns {Promise<RetryState | null>} 재시도 상태
   */
  private async getRetryState(paymentId: string): Promise<RetryState | null> {
    return cacheService.get<RetryState>(`payment:retry:${paymentId}`);
  }
  
  /**
   * 재시도 상태 저장
   * @private
   * @param {string} paymentId - 결제 ID
   * @param {RetryState} state - 재시도 상태
   * @returns {Promise<void>}
   */
  private async saveRetryState(paymentId: string, state: RetryState): Promise<void> {
    await cacheService.set(`payment:retry:${paymentId}`, state, { ttl: 86400 }); // 24 hours
  }
  
  /**
   * 재시도 상태 삭제
   * @private
   * @param {string} paymentId - 결제 ID
   * @returns {Promise<void>}
   */
  private async clearRetryState(paymentId: string): Promise<void> {
    await cacheService.delete(`payment:retry:${paymentId}`);
  }
  
  /**
   * 백오프 지연 시간 계산
   * @private
   * @param {number} attempt - 시도 횟수
   * @param {RetryConfig} config - 재시도 설정
   * @returns {number} 지연 시간 (ms)
   */
  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * delay * 0.1;
  }
  
  /**
   * 재시도 가능한 오류인지 확인
   * @private
   * @param {any} error - 오류 객체
   * @returns {boolean} 재시도 가능 여부
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
      '504'
    ];
    
    return retryableErrors.some(err => 
      errorMessage.toLowerCase().includes(err.toLowerCase())
    );
  }
  
  /**
   * 재시도 스케줄링
   * @private
   * @param {string} paymentId - 결제 ID
   * @param {string} userId - 사용자 ID
   * @param {any} paymentData - 결제 데이터
   * @param {number} delay - 지연 시간 (ms)
   * @param {RetryConfig} config - 재시도 설정
   * @returns {Promise<void>}
   */
  private async scheduleRetry(
    paymentId: string,
    userId: string,
    paymentData: any,
    delay: number,
    config: RetryConfig
  ): Promise<void> {
    setTimeout(async () => {
      try {
        await this.processPaymentWithRetry(paymentId, userId, paymentData, config);
      } catch (error) {
        logger.error(`Scheduled retry failed for payment ${paymentId}:`, error);
      }
    }, delay);
  }
  
  /**
   * 결제를 실패로 표시
   * @private
   * @param {string} paymentId - 결제 ID
   * @param {string} reason - 실패 사유
   * @returns {Promise<void>}
   */
  private async markPaymentAsFailed(paymentId: string, reason: string): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        metadata: {
          failureReason: reason,
          failedAt: new Date().toISOString()
        }
      }
    });
  }
  
  // Circuit breaker implementation
  
  /**
   * 서킷 브레이커 오픈 상태 확인
   * @private
   * @param {string} provider - 결제 제공자
   * @returns {boolean} 서킷 오픈 여부
   */
  private isCircuitOpen(provider: string): boolean {
    const state = this.circuitBreaker.get(provider);
    if (!state) return false;
    
    if (state.isOpen && Date.now() - state.openedAt > this.circuitBreakerTimeout) {
      // Try to close the circuit
      state.isOpen = false;
      state.failures = 0;
    }
    
    return state.isOpen;
  }
  
  /**
   * 성공 기록
   * @private
   * @param {string} provider - 결제 제공자
   * @returns {void}
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
   * @private
   * @param {string} provider - 결제 제공자
   * @returns {void}
   */
  private recordFailure(provider: string): void {
    let state = this.circuitBreaker.get(provider);
    if (!state) {
      state = {
        failures: 0,
        isOpen: false,
        openedAt: 0
      };
      this.circuitBreaker.set(provider, state);
    }
    
    state.failures++;
    
    if (state.failures >= this.circuitBreakerThreshold) {
      state.isOpen = true;
      state.openedAt = Date.now();
      logger.warn(`Circuit breaker opened for ${provider} after ${state.failures} failures`);
    }
  }
}

/**
 * 서킷 브레이커 상태 인터페이스
 * @interface CircuitBreakerState
 */
interface CircuitBreakerState {
  /** 실패 횟수 */
  failures: number;
  /** 오픈 상태 */
  isOpen: boolean;
  /** 오픈 시간 */
  openedAt: number;
}

export const paymentRetryService = new PaymentRetryService();
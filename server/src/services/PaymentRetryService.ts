import { prisma } from '../config/database';
import { PaymentStatus } from '@prisma/client';
import { logger } from '../middleware/logging';
import { metrics } from '../utils/monitoring';
import { PaymentService } from './PaymentService';
import { cacheService } from './CacheService';
import { createError } from '../middleware/errorHandler';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

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
   * Process a payment with automatic retry on failure
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
   * Handle webhook retry for failed webhook deliveries
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
   * Get all payments pending retry
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
   * Process all pending retries (called by cron job)
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
  
  private async getRetryState(paymentId: string): Promise<RetryState | null> {
    return cacheService.get<RetryState>(`payment:retry:${paymentId}`);
  }
  
  private async saveRetryState(paymentId: string, state: RetryState): Promise<void> {
    await cacheService.set(`payment:retry:${paymentId}`, state, { ttl: 86400 }); // 24 hours
  }
  
  private async clearRetryState(paymentId: string): Promise<void> {
    await cacheService.delete(`payment:retry:${paymentId}`);
  }
  
  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * delay * 0.1;
  }
  
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
  
  private recordSuccess(provider: string): void {
    const state = this.circuitBreaker.get(provider);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }
  
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

interface CircuitBreakerState {
  failures: number;
  isOpen: boolean;
  openedAt: number;
}

export const paymentRetryService = new PaymentRetryService();
import { logger } from './logger';
import { cacheService } from '../services/CacheService';

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

interface RetryTask<T> {
  id: string;
  fn: () => Promise<T>;
  attempts: number;
  lastError?: Error;
  nextRetryAt: Date;
}

/**
 * Exponential backoff retry utility for payment operations
 */
export class PaymentRetryManager {
  private readonly defaultOptions: Required<RetryOptions> = {
    maxAttempts: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    jitter: true,
    onRetry: () => {}
  };

  private retryQueue: Map<string, RetryTask<any>> = new Map();
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startProcessing();
  }

  /**
   * Execute a function with exponential backoff retry
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        logger.error(`Payment operation failed (attempt ${attempt}/${opts.maxAttempts}):`, error);

        if (attempt === opts.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, opts);
        opts.onRetry(lastError, attempt);

        logger.info(`Retrying payment operation in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Schedule a payment operation for retry
   */
  async scheduleRetry<T>(
    taskId: string,
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    const existingTask = this.retryQueue.get(taskId);
    if (existingTask && existingTask.attempts >= opts.maxAttempts) {
      logger.warn(`Task ${taskId} has exceeded max retry attempts`);
      return;
    }

    const attempts = existingTask ? existingTask.attempts + 1 : 1;
    const delay = this.calculateDelay(attempts, opts);
    const nextRetryAt = new Date(Date.now() + delay);

    const task: RetryTask<T> = {
      id: taskId,
      fn,
      attempts,
      nextRetryAt
    };

    this.retryQueue.set(taskId, task);

    // Persist to cache for recovery after restart
    await cacheService.set(
      `payment:retry:${taskId}`,
      {
        taskId,
        attempts,
        nextRetryAt,
        options: opts
      },
      { ttl: 86400 } // 24 hours
    );

    logger.info(`Scheduled payment retry for task ${taskId} at ${nextRetryAt.toISOString()}`);
  }

  /**
   * Process pending retry tasks
   */
  private async processPendingRetries(): Promise<void> {
    const now = new Date();
    const tasksToProcess: RetryTask<any>[] = [];

    // Find tasks ready for retry
    for (const [taskId, task] of this.retryQueue.entries()) {
      if (task.nextRetryAt <= now) {
        tasksToProcess.push(task);
        this.retryQueue.delete(taskId);
      }
    }

    // Process tasks concurrently with limit
    const concurrencyLimit = 5;
    for (let i = 0; i < tasksToProcess.length; i += concurrencyLimit) {
      const batch = tasksToProcess.slice(i, i + concurrencyLimit);
      await Promise.all(
        batch.map(task => this.processRetryTask(task))
      );
    }
  }

  /**
   * Process a single retry task
   */
  private async processRetryTask<T>(task: RetryTask<T>): Promise<void> {
    logger.info(`Processing retry for task ${task.id} (attempt ${task.attempts})`);

    try {
      await task.fn();
      logger.info(`Retry successful for task ${task.id}`);
      
      // Clean up cache
      await cacheService.delete(`payment:retry:${task.id}`);
    } catch (error) {
      logger.error(`Retry failed for task ${task.id}:`, error);
      task.lastError = error as Error;

      // Schedule next retry if not exceeded max attempts
      if (task.attempts < this.defaultOptions.maxAttempts) {
        await this.scheduleRetry(task.id, task.fn);
      } else {
        logger.error(`Task ${task.id} exceeded max retry attempts. Manual intervention required.`);
        
        // Store failed task for manual review
        await this.storeFailedTask(task);
      }
    }
  }

  /**
   * Store permanently failed tasks for manual intervention
   */
  private async storeFailedTask(task: RetryTask<any>): Promise<void> {
    await cacheService.set(
      `payment:failed:${task.id}`,
      {
        taskId: task.id,
        attempts: task.attempts,
        lastError: task.lastError?.message,
        failedAt: new Date()
      },
      { ttl: 2592000 } // 30 days
    );
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, options.maxDelayMs);

    if (options.jitter) {
      // Add random jitter (±25% of delay)
      const jitterRange = delay * 0.25;
      delay += (Math.random() * 2 - 1) * jitterRange;
    }

    return Math.round(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Start processing retry queue
   */
  private startProcessing(): void {
    if (this.processingInterval) return;

    // Process every 10 seconds
    this.processingInterval = setInterval(() => {
      this.processPendingRetries().catch(error => {
        logger.error('Error processing payment retries:', error);
      });
    }, 10000);

    // Load pending retries from cache on startup
    this.loadPendingRetries();
  }

  /**
   * Load pending retries from cache after restart
   */
  private async loadPendingRetries(): Promise<void> {
    try {
      // This would need to scan Redis keys with pattern matching
      // For now, just log that we're ready
      logger.info('Payment retry manager initialized');
    } catch (error) {
      logger.error('Failed to load pending retries:', error);
    }
  }

  /**
   * Stop processing (for graceful shutdown)
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Singleton instance
export const paymentRetryManager = new PaymentRetryManager();

/**
 * Decorator for automatic retry on payment methods
 */
export function RetryablePayment(options?: RetryOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const taskId = `${target.constructor.name}.${propertyName}:${Date.now()}`;
      
      return paymentRetryManager.executeWithRetry(
        () => originalMethod.apply(this, args),
        {
          ...options,
          onRetry: (error, attempt) => {
            logger.warn(`Payment method ${propertyName} failed, attempt ${attempt}:`, error);
            options?.onRetry?.(error, attempt);
          }
        }
      );
    };

    return descriptor;
  };
}

/**
 * Idempotency manager for payment operations
 */
export class IdempotencyManager {
  private readonly ttl = 86400; // 24 hours

  async checkAndSet(key: string, value: any): Promise<boolean> {
    const existingValue = await cacheService.get(`idempotency:${key}`);
    
    if (existingValue !== null) {
      // Operation already processed
      return false;
    }

    await cacheService.set(`idempotency:${key}`, value, { ttl: this.ttl });
    return true;
  }

  async get(key: string): Promise<any> {
    return cacheService.get(`idempotency:${key}`);
  }

  async delete(key: string): Promise<void> {
    await cacheService.delete(`idempotency:${key}`);
  }
}

export const idempotencyManager = new IdempotencyManager();

/**
 * Circuit breaker for payment providers
 */
export class PaymentCircuitBreaker {
  private failures = new Map<string, number>();
  private lastFailureTime = new Map<string, number>();
  private state = new Map<string, 'CLOSED' | 'OPEN' | 'HALF_OPEN'>();

  private readonly threshold = 5; // failures before opening
  private readonly timeout = 60000; // 1 minute
  private readonly successThreshold = 3; // successes to close

  async execute<T>(
    provider: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const currentState = this.state.get(provider) || 'CLOSED';

    if (currentState === 'OPEN') {
      const lastFailure = this.lastFailureTime.get(provider) || 0;
      if (Date.now() - lastFailure > this.timeout) {
        this.state.set(provider, 'HALF_OPEN');
        logger.info(`Circuit breaker for ${provider} is now HALF_OPEN`);
      } else {
        throw new Error(`Payment provider ${provider} is temporarily unavailable`);
      }
    }

    try {
      const result = await fn();
      
      if (currentState === 'HALF_OPEN') {
        const failures = this.failures.get(provider) || 0;
        if (failures <= this.successThreshold) {
          this.state.set(provider, 'CLOSED');
          this.failures.delete(provider);
          logger.info(`Circuit breaker for ${provider} is now CLOSED`);
        }
      }

      return result;
    } catch (error) {
      this.recordFailure(provider);
      throw error;
    }
  }

  private recordFailure(provider: string): void {
    const failures = (this.failures.get(provider) || 0) + 1;
    this.failures.set(provider, failures);
    this.lastFailureTime.set(provider, Date.now());

    if (failures >= this.threshold) {
      this.state.set(provider, 'OPEN');
      logger.error(`Circuit breaker for ${provider} is now OPEN after ${failures} failures`);
    }
  }

  getState(provider: string): string {
    return this.state.get(provider) || 'CLOSED';
  }
}

export const paymentCircuitBreaker = new PaymentCircuitBreaker();
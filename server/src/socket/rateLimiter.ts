import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  warned: boolean;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDuration?: number; // Block duration in ms after limit exceeded
}

class SocketRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private blocked: Map<string, number> = new Map();
  
  private defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 30, // 30 messages per minute
    blockDuration: 300000 // 5 minutes block
  };

  constructor() {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a user is rate limited
   * @param userId - User ID to check
   * @param config - Optional rate limit configuration
   * @returns true if allowed, false if rate limited
   */
  checkLimit(userId: string, config?: Partial<RateLimitConfig>): boolean {
    const now = Date.now();
    const limitConfig = { ...this.defaultConfig, ...config };

    // Check if user is blocked
    const blockExpiry = this.blocked.get(userId);
    if (blockExpiry && now < blockExpiry) {
      return false;
    } else if (blockExpiry) {
      this.blocked.delete(userId);
    }

    const userLimit = this.limits.get(userId);

    // First request or window expired
    if (!userLimit || now > userLimit.resetTime) {
      this.limits.set(userId, {
        count: 1,
        resetTime: now + limitConfig.windowMs,
        warned: false
      });
      return true;
    }

    // Check if limit exceeded
    if (userLimit.count >= limitConfig.maxRequests) {
      // Block user if configured
      if (limitConfig.blockDuration) {
        this.blocked.set(userId, now + limitConfig.blockDuration);
        logger.warn(`User ${userId} blocked for ${limitConfig.blockDuration}ms due to rate limit`);
      }
      return false;
    }

    // Warn at 80% of limit
    if (!userLimit.warned && userLimit.count >= limitConfig.maxRequests * 0.8) {
      userLimit.warned = true;
      logger.info(`User ${userId} approaching rate limit: ${userLimit.count}/${limitConfig.maxRequests}`);
    }

    userLimit.count++;
    return true;
  }

  /**
   * Get remaining requests for a user
   */
  getRemaining(userId: string, config?: Partial<RateLimitConfig>): number {
    const limitConfig = { ...this.defaultConfig, ...config };
    const userLimit = this.limits.get(userId);
    
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return limitConfig.maxRequests;
    }
    
    return Math.max(0, limitConfig.maxRequests - userLimit.count);
  }

  /**
   * Reset rate limit for a user
   */
  reset(userId: string): void {
    this.limits.delete(userId);
    this.blocked.delete(userId);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Clean up expired rate limits
    for (const [userId, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(userId);
      }
    }

    // Clean up expired blocks
    for (const [userId, expiry] of this.blocked.entries()) {
      if (now > expiry) {
        this.blocked.delete(userId);
      }
    }
  }

  /**
   * Get rate limit stats for monitoring
   */
  getStats(): { activeUsers: number; blockedUsers: number } {
    return {
      activeUsers: this.limits.size,
      blockedUsers: this.blocked.size
    };
  }
}

// Export singleton instance
export const socketRateLimiter = new SocketRateLimiter();

// Different rate limit configurations for different message types
export const RATE_LIMIT_CONFIGS = {
  CHAT_MESSAGE: {
    windowMs: 60000,
    maxRequests: 30
  },
  TYPING_INDICATOR: {
    windowMs: 10000,
    maxRequests: 10
  },
  FILE_UPLOAD: {
    windowMs: 60000,
    maxRequests: 5
  },
  VOICE_CALL: {
    windowMs: 300000, // 5 minutes
    maxRequests: 3
  },
  VIDEO_CALL: {
    windowMs: 300000, // 5 minutes
    maxRequests: 3
  },
  STORY_REACTION: {
    windowMs: 60000,
    maxRequests: 20
  }
};

// Message size limiter
export class MessageSizeLimiter {
  private static readonly MAX_TEXT_LENGTH = 1000;
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MAX_TOTAL_FILES = 10;

  static validateTextMessage(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: '메시지가 비어있습니다.' };
    }

    if (text.length > this.MAX_TEXT_LENGTH) {
      return { 
        valid: false, 
        error: `메시지가 너무 깁니다. 최대 ${this.MAX_TEXT_LENGTH}자까지 가능합니다.` 
      };
    }

    return { valid: true };
  }

  static validateFileMessage(fileSize: number, totalFiles: number = 1): { valid: boolean; error?: string } {
    if (fileSize > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `파일 크기가 너무 큽니다. 최대 ${this.MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.` 
      };
    }

    if (totalFiles > this.MAX_TOTAL_FILES) {
      return { 
        valid: false, 
        error: `파일 개수가 너무 많습니다. 최대 ${this.MAX_TOTAL_FILES}개까지 가능합니다.` 
      };
    }

    return { valid: true };
  }
}

// Connection limiter per user
export class ConnectionLimiter {
  private connections: Map<string, Set<string>> = new Map();
  private readonly MAX_CONNECTIONS_PER_USER = 3;

  addConnection(userId: string, socketId: string): boolean {
    const userConnections = this.connections.get(userId) || new Set();
    
    if (userConnections.size >= this.MAX_CONNECTIONS_PER_USER) {
      logger.warn(`User ${userId} exceeded max connections limit`);
      return false;
    }

    userConnections.add(socketId);
    this.connections.set(userId, userConnections);
    return true;
  }

  removeConnection(userId: string, socketId: string): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socketId);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  isConnectionAllowed(userId: string): boolean {
    const count = this.getConnectionCount(userId);
    return count < this.MAX_CONNECTIONS_PER_USER;
  }
}

export const connectionLimiter = new ConnectionLimiter();
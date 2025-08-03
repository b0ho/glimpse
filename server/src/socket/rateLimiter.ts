/**
 * WebSocket Rate Limiter
 * @module socket/rateLimiter
 * @description 실시간 채팅 및 WebSocket 연결에 대한 속도 제한, 메시지 크기 제한
 */

import { logger } from '../utils/logger';

/**
 * 속도 제한 항목 인터페이스
 * @interface RateLimitEntry
 * @description 사용자별 속도 제한 상태 추적
 */
interface RateLimitEntry {
  /** 요청 횟수 */
  count: number;
  /** 제한 초기화 시간 */
  resetTime: number;
  /** 경고 표시 여부 */
  warned: boolean;
}

/**
 * 속도 제한 설정 인터페이스
 * @interface RateLimitConfig
 * @description 속도 제한 정책 설정
 */
interface RateLimitConfig {
  /** 시간 창 (밀리초) */
  windowMs: number;
  /** 시간 창당 최대 요청 수 */
  maxRequests: number;
  /** 제한 초과 시 차단 기간 (밀리초) */
  blockDuration?: number;
}

/**
 * WebSocket 속도 제한기 클래스
 * @class SocketRateLimiter
 * @description 사용자별 메시지 전송 속도 제한 및 차단 관리
 */
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
   * 사용자 속도 제한 확인
   * @method checkLimit
   * @param {string} userId - 확인할 사용자 ID
   * @param {Partial<RateLimitConfig>} [config] - 선택적 속도 제한 설정
   * @returns {boolean} 허용 여부 (true: 허용, false: 제한)
   * @description 사용자의 요청이 속도 제한에 걸렸는지 확인
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
   * 남은 요청 횟수 조회
   * @method getRemaining
   * @param {string} userId - 사용자 ID
   * @param {Partial<RateLimitConfig>} [config] - 선택적 속도 제한 설정
   * @returns {number} 남은 요청 횟수
   * @description 현재 시간 창에서 남은 요청 횟수 반환
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
   * 사용자 속도 제한 초기화
   * @method reset
   * @param {string} userId - 사용자 ID
   * @returns {void}
   * @description 특정 사용자의 속도 제한 및 차단 상태 초기화
   */
  reset(userId: string): void {
    this.limits.delete(userId);
    this.blocked.delete(userId);
  }

  /**
   * 만료된 항목 정리
   * @private
   * @method cleanup
   * @returns {void}
   * @description 만료된 속도 제한 및 차단 항목 제거
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
   * 속도 제한 통계 조회
   * @method getStats
   * @returns {{ activeUsers: number; blockedUsers: number }} 통계 정보
   * @description 모니터링을 위한 현재 활성 및 차단 사용자 수
   */
  getStats(): { activeUsers: number; blockedUsers: number } {
    return {
      activeUsers: this.limits.size,
      blockedUsers: this.blocked.size
    };
  }
}

/**
 * 소켓 속도 제한기 싱글톤 인스턴스
 * @constant socketRateLimiter
 * @type {SocketRateLimiter}
 * @description 애플리케이션 전체에서 사용하는 WebSocket 속도 제한기
 */
export const socketRateLimiter = new SocketRateLimiter();

/**
 * 메시지 타입별 속도 제한 설정
 * @constant RATE_LIMIT_CONFIGS
 * @description 각 기능별로 다른 속도 제한 정책 적용
 */
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

/**
 * 메시지 크기 제한기
 * @class MessageSizeLimiter
 * @description 텍스트 메시지와 파일 크기 제한 검증
 */
export class MessageSizeLimiter {
  private static readonly MAX_TEXT_LENGTH = 1000;
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MAX_TOTAL_FILES = 10;

  /**
   * 텍스트 메시지 유효성 검사
   * @static
   * @method validateTextMessage
   * @param {string} text - 검사할 텍스트
   * @returns {{ valid: boolean; error?: string }} 유효성 결과
   * @description 텍스트 메시지의 길이와 내용 검증
   */
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

  /**
   * 파일 메시지 유효성 검사
   * @static
   * @method validateFileMessage
   * @param {number} fileSize - 파일 크기 (바이트)
   * @param {number} [totalFiles=1] - 총 파일 개수
   * @returns {{ valid: boolean; error?: string }} 유효성 결과
   * @description 파일 크기와 개수 제한 검증
   */
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

/**
 * 사용자별 연결 제한기
 * @class ConnectionLimiter
 * @description 사용자당 동시 WebSocket 연결 수 제한
 */
export class ConnectionLimiter {
  private connections: Map<string, Set<string>> = new Map();
  private readonly MAX_CONNECTIONS_PER_USER = 3;

  /**
   * 연결 추가
   * @method addConnection
   * @param {string} userId - 사용자 ID
   * @param {string} socketId - 소켓 ID
   * @returns {boolean} 연결 허용 여부
   * @description 사용자의 새 연결 추가 및 제한 확인
   */
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

  /**
   * 연결 제거
   * @method removeConnection
   * @param {string} userId - 사용자 ID
   * @param {string} socketId - 소켓 ID
   * @returns {void}
   * @description 사용자의 연결 제거
   */
  removeConnection(userId: string, socketId: string): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socketId);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * 연결 수 조회
   * @method getConnectionCount
   * @param {string} userId - 사용자 ID
   * @returns {number} 현재 연결 수
   * @description 사용자의 현재 활성 연결 수 반환
   */
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * 연결 허용 여부 확인
   * @method isConnectionAllowed
   * @param {string} userId - 사용자 ID
   * @returns {boolean} 연결 허용 여부
   * @description 사용자가 추가 연결을 만들 수 있는지 확인
   */
  isConnectionAllowed(userId: string): boolean {
    const count = this.getConnectionCount(userId);
    return count < this.MAX_CONNECTIONS_PER_USER;
  }
}

/**
 * 연결 제한기 싱글톤 인스턴스
 * @constant connectionLimiter
 * @type {ConnectionLimiter}
 * @description 애플리케이션 전체에서 사용하는 연결 제한기
 */
export const connectionLimiter = new ConnectionLimiter();
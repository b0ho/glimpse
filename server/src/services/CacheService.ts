import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

/**
 * 캐시 옵션 인터페이스
 * @interface CacheOptions
 */
interface CacheOptions {
  /** 캐시 유효 시간 (초 단위) */
  ttl?: number;
  /** 네임스페이싱을 위한 키 접두사 */
  prefix?: string;
}

/**
 * Redis 기반 캐시 서비스
 * @class CacheService
 * @description 애플리케이션 성능 향상을 위한 캐싱 기능 제공
 */
class CacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private defaultTTL: number = 300; // 5 minutes

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis Client Ready');
      this.isConnected = true;
    });

    this.connect();
  }

  /**
   * Redis 서버에 연결
   * @private
   * @returns {Promise<void>}
   */
  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Redis 연결 상태 확인
   * @private
   * @throws {Error} Redis 클라이언트가 연결되지 않은 경우
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
  }

  /**
   * 접두사를 포함한 전체 키 생성
   * @private
   * @param {string} key - 기본 키
   * @param {string} [prefix] - 선택적 접두사
   * @returns {string} 전체 키
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * 캐시에서 값 조회
   * @template T
   * @param {string} key - 조회할 키
   * @param {CacheOptions} [options] - 캐시 옵션
   * @returns {Promise<T | null>} 캐시된 값 또는 null
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      this.ensureConnected();
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  /**
   * 캐시에 값 저장
   * @template T
   * @param {string} key - 저장할 키
   * @param {T} value - 저장할 값
   * @param {CacheOptions} [options] - 캐시 옵션
   * @returns {Promise<void>}
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      this.ensureConnected();
      const fullKey = this.buildKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      await this.client.setEx(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      // Don't throw - allow operation to continue without cache
    }
  }

  /**
   * 캐시에서 값 삭제
   * @param {string} key - 삭제할 키
   * @param {CacheOptions} [options] - 캐시 옵션
   * @returns {Promise<void>}
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      this.ensureConnected();
      const fullKey = this.buildKey(key, options?.prefix);
      await this.client.del(fullKey);
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
    }
  }

  /**
   * 패턴에 맞는 모든 캐시 무효화
   * @param {string} pattern - 삭제할 키 패턴 (예: 'user:*')
   * @returns {Promise<void>}
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      this.ensureConnected();
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error(`Redis invalidate error for pattern ${pattern}:`, error);
    }
  }
  
  /**
   * 패턴에 맞는 모든 키 조회
   * @param {string} pattern - 검색할 키 패턴
   * @returns {Promise<string[]>} 매칭되는 키 목록
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      this.ensureConnected();
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * 키 존재 여부 확인
   * @param {string} key - 확인할 키
   * @param {CacheOptions} [options] - 캐시 옵션
   * @returns {Promise<boolean>} 키 존재 여부
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      this.ensureConnected();
      const fullKey = this.buildKey(key, options?.prefix);
      return (await this.client.exists(fullKey)) === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 캐시 조회 또는 새로 가져와서 저장
   * @template T
   * @param {string} key - 캐시 키
   * @param {() => Promise<T>} fetchFn - 캐시 미스 시 실행할 함수
   * @param {CacheOptions} [options] - 캐시 옵션
   * @returns {Promise<T>} 캐시된 값 또는 새로 가져온 값
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, options);
    return fresh;
  }

  /**
   * 사용자별 캐시 조회
   * @template T
   * @param {string} userId - 사용자 ID
   * @param {string} key - 캐시 키
   * @returns {Promise<T | null>} 캐시된 값 또는 null
   */
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(`user:${userId}:${key}`);
  }

  /**
   * 사용자별 캐시 저장
   * @template T
   * @param {string} userId - 사용자 ID
   * @param {string} key - 캐시 키
   * @param {T} value - 저장할 값
   * @param {number} [ttl] - 캐시 유효 시간 (초)
   * @returns {Promise<void>}
   */
  async setUserCache<T>(userId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`user:${userId}:${key}`, value, { ttl });
  }

  /**
   * 사용자의 모든 캐시 무효화
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async invalidateUserCache(userId: string): Promise<void> {
    return this.invalidate(`user:${userId}:*`);
  }

  /**
   * 그룹별 캐시 조회
   * @template T
   * @param {string} groupId - 그룹 ID
   * @param {string} key - 캐시 키
   * @returns {Promise<T | null>} 캐시된 값 또는 null
   */
  async getGroupCache<T>(groupId: string, key: string): Promise<T | null> {
    return this.get<T>(`group:${groupId}:${key}`);
  }

  /**
   * 그룹별 캐시 저장
   * @template T
   * @param {string} groupId - 그룹 ID
   * @param {string} key - 캐시 키
   * @param {T} value - 저장할 값
   * @param {number} [ttl] - 캐시 유효 시간 (초)
   * @returns {Promise<void>}
   */
  async setGroupCache<T>(groupId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`group:${groupId}:${key}`, value, { ttl });
  }

  /**
   * 그룹의 모든 캐시 무효화
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   */
  async invalidateGroupCache(groupId: string): Promise<void> {
    return this.invalidate(`group:${groupId}:*`);
  }

  /**
   * 매칭별 캐시 조회
   * @template T
   * @param {string} matchId - 매칭 ID
   * @param {string} key - 캐시 키
   * @returns {Promise<T | null>} 캐시된 값 또는 null
   */
  async getMatchCache<T>(matchId: string, key: string): Promise<T | null> {
    return this.get<T>(`match:${matchId}:${key}`);
  }

  /**
   * 매칭별 캐시 저장
   * @template T
   * @param {string} matchId - 매칭 ID
   * @param {string} key - 캐시 키
   * @param {T} value - 저장할 값
   * @param {number} [ttl] - 캐시 유효 시간 (초)
   * @returns {Promise<void>}
   */
  async setMatchCache<T>(matchId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`match:${matchId}:${key}`, value, { ttl });
  }

  /**
   * 매칭의 모든 캐시 무효화
   * @param {string} matchId - 매칭 ID
   * @returns {Promise<void>}
   */
  async invalidateMatchCache(matchId: string): Promise<void> {
    return this.invalidate(`match:${matchId}:*`);
  }

  /**
   * 프리미엄 상태 캐시 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<boolean | null>} 프리미엄 상태 또는 null
   */
  async getPremiumStatus(userId: string): Promise<boolean | null> {
    const cached = await this.getUserCache<boolean>(userId, 'premium');
    return cached;
  }

  /**
   * 프리미엄 상태 캐시 저장
   * @param {string} userId - 사용자 ID
   * @param {boolean} isPremium - 프리미엄 상태
   * @returns {Promise<void>}
   */
  async setPremiumStatus(userId: string, isPremium: boolean): Promise<void> {
    await this.setUserCache(userId, 'premium', isPremium, 600); // 10 minutes
  }

  /**
   * Redis 연결 종료
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * 메서드 결과를 캐시하는 데코레이터
 * @param {string} keyPrefix - 캐시 키 접두사
 * @param {number} [ttl=300] - 캐시 유효 시간 (초)
 * @returns {MethodDecorator} 메서드 데코레이터
 * @example
 * @Cacheable('user-profile', 600)
 * async getUserProfile(userId: string) { ... }
 */
export function Cacheable(keyPrefix: string, ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${keyPrefix}:${propertyName}:${JSON.stringify(args)}`;
      
      const cached = await cacheService.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      await cacheService.set(key, result, { ttl });
      
      return result;
    };

    return descriptor;
  };
}

/**
 * 메서드 실행 후 캐시를 무효화하는 데코레이터
 * @param {string[]} patterns - 무효화할 캐시 키 패턴들
 * @returns {MethodDecorator} 메서드 데코레이터
 * @example
 * @InvalidateCache(['user:*', 'group:*'])
 * async updateUser(userId: string, data: any) { ... }
 */
export function InvalidateCache(patterns: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // Invalidate cache patterns after method execution
      for (const pattern of patterns) {
        await cacheService.invalidate(pattern);
      }
      
      return result;
    };

    return descriptor;
  };
}
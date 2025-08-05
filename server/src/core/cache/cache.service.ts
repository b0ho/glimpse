import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * 캐시 옵션 인터페이스
 */
interface CacheOptions {
  /** 캐시 유효 시간 (초 단위) */
  ttl?: number;
  /** 네임스페이싱을 위한 키 접두사 */
  prefix?: string;
}

/**
 * Redis 기반 캐시 서비스
 *
 * 애플리케이션 성능 향상을 위한 캐싱 기능을 제공합니다.
 */
@Injectable()
export class CacheService {
  private defaultTTL: number = 300; // 5 minutes

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * 접두사를 포함한 전체 키 생성
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * 캐시에서 값 조회
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.cacheManager.get<T>(fullKey);
      return value || null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  /**
   * 캐시에 값 저장
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      await this.cacheManager.set(fullKey, value, ttl * 1000); // Convert to milliseconds
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Don't throw - allow operation to continue without cache
    }
  }

  /**
   * 캐시에서 값 삭제
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.cacheManager.del(fullKey);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * 캐시에서 값 삭제 (del 별칭)
   */
  async del(key: string, options?: CacheOptions): Promise<void> {
    return this.delete(key, options);
  }

  /**
   * 패턴에 맞는 모든 캐시 무효화
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      // Note: This requires access to the underlying Redis client
      // For now, we'll use a workaround
      const store = (this.cacheManager as any).store;
      if (store.keys) {
        const keys = await store.keys(pattern);
        if (keys.length > 0) {
          await Promise.all(
            keys.map((key: string) => this.cacheManager.del(key)),
          );
        }
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  /**
   * 패턴에 맞는 모든 키 조회
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const store = (this.cacheManager as any).store;
      if (store.keys) {
        return await store.keys(pattern);
      }
      return [];
    } catch (error) {
      console.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * 키 존재 여부 확인
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== null;
  }

  /**
   * 캐시 조회 또는 새로 가져와서 저장
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions,
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
   */
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(`user:${userId}:${key}`);
  }

  /**
   * 사용자별 캐시 저장
   */
  async setUserCache<T>(
    userId: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    return this.set(`user:${userId}:${key}`, value, { ttl });
  }

  /**
   * 사용자의 모든 캐시 무효화
   */
  async invalidateUserCache(userId: string): Promise<void> {
    return this.invalidate(`user:${userId}:*`);
  }

  /**
   * 그룹별 캐시 조회
   */
  async getGroupCache<T>(groupId: string, key: string): Promise<T | null> {
    return this.get<T>(`group:${groupId}:${key}`);
  }

  /**
   * 그룹별 캐시 저장
   */
  async setGroupCache<T>(
    groupId: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    return this.set(`group:${groupId}:${key}`, value, { ttl });
  }

  /**
   * 그룹의 모든 캐시 무효화
   */
  async invalidateGroupCache(groupId: string): Promise<void> {
    return this.invalidate(`group:${groupId}:*`);
  }

  /**
   * 매칭별 캐시 조회
   */
  async getMatchCache<T>(matchId: string, key: string): Promise<T | null> {
    return this.get<T>(`match:${matchId}:${key}`);
  }

  /**
   * 매칭별 캐시 저장
   */
  async setMatchCache<T>(
    matchId: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    return this.set(`match:${matchId}:${key}`, value, { ttl });
  }

  /**
   * 매칭의 모든 캐시 무효화
   */
  async invalidateMatchCache(matchId: string): Promise<void> {
    return this.invalidate(`match:${matchId}:*`);
  }

  /**
   * 프리미엄 상태 캐시 조회
   */
  async getPremiumStatus(userId: string): Promise<boolean | null> {
    const cached = await this.getUserCache<boolean>(userId, 'premium');
    return cached;
  }

  /**
   * 프리미엄 상태 캐시 저장
   */
  async setPremiumStatus(userId: string, isPremium: boolean): Promise<void> {
    await this.setUserCache(userId, 'premium', isPremium, 600); // 10 minutes
  }
}

/**
 * 메서드 결과를 캐시하는 데코레이터
 * @example
 * @Cacheable('user-profile', 600)
 * async getUserProfile(userId: string) { ... }
 */
export function Cacheable(keyPrefix: string, ttl: number = 300) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get cache service from NestJS DI container
      const cacheService = this.cacheService;
      if (!cacheService) {
        console.warn(
          'CacheService not injected, executing method without cache',
        );
        return method.apply(this, args);
      }

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
 * @example
 * @InvalidateCache(['user:*', 'group:*'])
 * async updateUser(userId: string, data: any) { ... }
 */
export function InvalidateCache(patterns: string[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);

      // Get cache service from NestJS DI container
      const cacheService = this.cacheService;
      if (!cacheService) {
        console.warn('CacheService not injected, skipping cache invalidation');
        return result;
      }

      // Invalidate cache patterns after method execution
      for (const pattern of patterns) {
        await cacheService.invalidate(pattern);
      }

      return result;
    };

    return descriptor;
  };
}

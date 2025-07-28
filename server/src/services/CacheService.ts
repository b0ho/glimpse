import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

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

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
    }
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
  }

  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

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

  async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      this.ensureConnected();
      const fullKey = this.buildKey(key, options?.prefix);
      await this.client.del(fullKey);
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
    }
  }

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
  
  async keys(pattern: string): Promise<string[]> {
    try {
      this.ensureConnected();
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

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

  // Cache with refresh function
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

  // User-specific caching helpers
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(`user:${userId}:${key}`);
  }

  async setUserCache<T>(userId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`user:${userId}:${key}`, value, { ttl });
  }

  async invalidateUserCache(userId: string): Promise<void> {
    return this.invalidate(`user:${userId}:*`);
  }

  // Group-specific caching helpers
  async getGroupCache<T>(groupId: string, key: string): Promise<T | null> {
    return this.get<T>(`group:${groupId}:${key}`);
  }

  async setGroupCache<T>(groupId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`group:${groupId}:${key}`, value, { ttl });
  }

  async invalidateGroupCache(groupId: string): Promise<void> {
    return this.invalidate(`group:${groupId}:*`);
  }

  // Match-specific caching helpers
  async getMatchCache<T>(matchId: string, key: string): Promise<T | null> {
    return this.get<T>(`match:${matchId}:${key}`);
  }

  async setMatchCache<T>(matchId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`match:${matchId}:${key}`, value, { ttl });
  }

  async invalidateMatchCache(matchId: string): Promise<void> {
    return this.invalidate(`match:${matchId}:*`);
  }

  // Premium status caching
  async getPremiumStatus(userId: string): Promise<boolean | null> {
    const cached = await this.getUserCache<boolean>(userId, 'premium');
    return cached;
  }

  async setPremiumStatus(userId: string, isPremium: boolean): Promise<void> {
    await this.setUserCache(userId, 'premium', isPremium, 600); // 10 minutes
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export cache decorators
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
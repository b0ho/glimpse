import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
const CACHE_LIMIT = 100 * 1024 * 1024; // 100MB
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_INDEX_KEY = '@image_cache_index';

interface CacheEntry {
  uri: string;
  localUri: string;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheIndex {
  entries: Record<string, CacheEntry>;
  totalSize: number;
}

class ImageCacheService {
  private cacheIndex: CacheIndex = {
    entries: {},
    totalSize: 0,
  };
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Ensure cache directory exists
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        
        // Load cache index
        await this.loadCacheIndex();
        
        // Clean up expired entries
        await this.cleanupExpiredEntries();
      } catch (error) {
        console.error('Failed to initialize image cache:', error);
      }
    })();

    return this.initPromise;
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexData) {
        this.cacheIndex = JSON.parse(indexData);
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(this.cacheIndex));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  private async getCacheKey(uri: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      uri
    );
    return digest;
  }

  async getCachedImage(uri: string): Promise<string | null> {
    await this.init();

    const cacheKey = await this.getCacheKey(uri);
    const entry = this.cacheIndex.entries[cacheKey];

    if (!entry) return null;

    // Check if file still exists
    const fileInfo = await FileSystem.getInfoAsync(entry.localUri);
    if (!fileInfo.exists) {
      delete this.cacheIndex.entries[cacheKey];
      await this.saveCacheIndex();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      await this.removeFromCache(cacheKey);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    await this.saveCacheIndex();

    return entry.localUri;
  }

  async cacheImage(uri: string): Promise<string> {
    await this.init();

    const cacheKey = await this.getCacheKey(uri);
    
    // Check if already cached
    const existing = await this.getCachedImage(uri);
    if (existing) return existing;

    const localUri = `${CACHE_DIR}${cacheKey}.jpg`;

    try {
      // Download the image
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      const size = (fileInfo as any).size || 0;

      // Check if we need to make space
      if (this.cacheIndex.totalSize + size > CACHE_LIMIT) {
        await this.evictOldEntries(size);
      }

      // Add to cache index
      const entry: CacheEntry = {
        uri,
        localUri: downloadResult.uri,
        size,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      this.cacheIndex.entries[cacheKey] = entry;
      this.cacheIndex.totalSize += size;
      await this.saveCacheIndex();

      return downloadResult.uri;
    } catch (error) {
      console.error('Failed to cache image:', error);
      throw error;
    }
  }

  async preloadImages(uris: string[]): Promise<void> {
    await this.init();

    const promises = uris.map(uri => 
      this.cacheImage(uri).catch(error => 
        console.error(`Failed to preload image ${uri}:`, error)
      )
    );

    await Promise.all(promises);
  }

  private async removeFromCache(cacheKey: string): Promise<void> {
    const entry = this.cacheIndex.entries[cacheKey];
    if (!entry) return;

    try {
      await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
      this.cacheIndex.totalSize -= entry.size;
      delete this.cacheIndex.entries[cacheKey];
      await this.saveCacheIndex();
    } catch (error) {
      console.error('Failed to remove cache entry:', error);
    }
  }

  private async evictOldEntries(requiredSpace: number): Promise<void> {
    // Sort entries by last accessed time (LRU)
    const entries = Object.entries(this.cacheIndex.entries)
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      freedSpace += entry.size;
      await this.removeFromCache(key);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of Object.entries(this.cacheIndex.entries)) {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.removeFromCache(key);
    }
  }

  async clearCache(): Promise<void> {
    await this.init();

    try {
      // Delete all cached files
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      
      // Clear index
      this.cacheIndex = {
        entries: {},
        totalSize: 0,
      };
      await this.saveCacheIndex();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalSize: number;
    fileCount: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    await this.init();

    const entries = Object.values(this.cacheIndex.entries);
    const timestamps = entries.map(e => e.timestamp);

    return {
      totalSize: this.cacheIndex.totalSize,
      fileCount: entries.length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  // Get optimal cache strategy based on network conditions
  async getOptimalCacheStrategy(): Promise<{
    preloadThumbnails: boolean;
    preloadFullImages: boolean;
    cacheExpiry: number;
  }> {
    try {
      const { getNetworkStateAsync } = await import('expo-network');
      const networkState = await getNetworkStateAsync();

      if (networkState.type === 'WIFI') {
        return {
          preloadThumbnails: true,
          preloadFullImages: true,
          cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        };
      } else if (networkState.type === 'CELLULAR') {
        return {
          preloadThumbnails: true,
          preloadFullImages: false,
          cacheExpiry: 3 * 24 * 60 * 60 * 1000, // 3 days
        };
      } else {
        return {
          preloadThumbnails: false,
          preloadFullImages: false,
          cacheExpiry: 24 * 60 * 60 * 1000, // 1 day
        };
      }
    } catch (error) {
      // Default strategy
      return {
        preloadThumbnails: true,
        preloadFullImages: false,
        cacheExpiry: 3 * 24 * 60 * 60 * 1000,
      };
    }
  }
}

export const imageCacheService = new ImageCacheService();
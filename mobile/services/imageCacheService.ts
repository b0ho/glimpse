import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** 캐시 디렉토리 경로 */
const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
/** 캐시 크기 제한 (100MB) */
const CACHE_LIMIT = 100 * 1024 * 1024;
/** 캐시 만료 시간 (7일) */
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
/** 캐시 인덱스 저장 키 */
const CACHE_INDEX_KEY = '@image_cache_index';

/**
 * 캐시 항목 인터페이스
 * @interface CacheEntry
 * @description 개별 캐시된 이미지 정보
 */
interface CacheEntry {
  /** 원본 이미지 URI */
  uri: string;
  /** 로컬 캐시 URI */
  localUri: string;
  /** 파일 크기 (바이트) */
  size: number;
  /** 캐시 생성 시간 */
  timestamp: number;
  /** 접근 횟수 */
  accessCount: number;
  /** 마지막 접근 시간 */
  lastAccessed: number;
}

/**
 * 캐시 인덱스 인터페이스
 * @interface CacheIndex
 * @description 전체 캐시 상태 관리
 */
interface CacheIndex {
  /** 캐시 항목 목록 */
  entries: Record<string, CacheEntry>;
  /** 전체 캐시 크기 */
  totalSize: number;
}

/**
 * 이미지 캐시 서비스 클래스
 * @class ImageCacheService
 * @description 이미지 캐싱, LRU 제거, 네트워크 최적화 기능 제공
 */
class ImageCacheService {
  /** 캐시 인덱스 */
  private cacheIndex: CacheIndex = {
    entries: {},
    totalSize: 0,
  };
  /** 초기화 프로미스 */
  private initPromise: Promise<void> | null = null;

  /**
   * ImageCacheService 생성자
   * @constructor
   * @description 서비스 초기화 시작
   */
  constructor() {
    this.init();
  }

  /**
   * 캐시 서비스 초기화
   * @private
   * @async
   * @returns {Promise<void>}
   * @description 캐시 디렉토리 생성, 인덱스 로드, 만료 항목 정리
   */
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

  /**
   * 캐시 인덱스 로드
   * @private
   * @async
   * @returns {Promise<void>}
   * @description AsyncStorage에서 캐시 인덱스 정보 로드
   */
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

  /**
   * 캐시 인덱스 저장
   * @private
   * @async
   * @returns {Promise<void>}
   * @description 현재 캐시 인덱스를 AsyncStorage에 저장
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(this.cacheIndex));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * 캐시 키 생성
   * @private
   * @async
   * @param {string} uri - 이미지 URI
   * @returns {Promise<string>} SHA256 해시 키
   * @description URI를 SHA256으로 해싱하여 고유 키 생성
   */
  private async getCacheKey(uri: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      uri
    );
    return digest;
  }

  /**
   * 캐시된 이미지 가져오기
   * @async
   * @param {string} uri - 이미지 URI
   * @returns {Promise<string | null>} 로컬 캐시 URI 또는 null
   * @description 캐시에서 이미지를 찾고 유효성 검사 후 반환
   */
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

  /**
   * 이미지 캐싱
   * @async
   * @param {string} uri - 캐시할 이미지 URI
   * @returns {Promise<string>} 로컬 캐시 URI
   * @throws {Error} 다운로드 실패 시
   * @description 이미지를 다운로드하여 로컬에 캐싱
   */
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

  /**
   * 이미지 미리 로드
   * @async
   * @param {string[]} uris - 미리 로드할 이미지 URI 배열
   * @returns {Promise<void>}
   * @description 여러 이미지를 비동기로 미리 캐싱
   */
  async preloadImages(uris: string[]): Promise<void> {
    await this.init();

    const promises = uris.map(uri => 
      this.cacheImage(uri).catch(error => 
        console.error(`Failed to preload image ${uri}:`, error)
      )
    );

    await Promise.all(promises);
  }

  /**
   * 캐시에서 제거
   * @private
   * @async
   * @param {string} cacheKey - 제거할 캐시 키
   * @returns {Promise<void>}
   * @description 특정 캐시 항목을 파일과 인덱스에서 제거
   */
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

  /**
   * 오래된 항목 제거 (LRU)
   * @private
   * @async
   * @param {number} requiredSpace - 필요한 공간 (바이트)
   * @returns {Promise<void>}
   * @description LRU 알고리즘으로 오래된 항목부터 제거
   */
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

  /**
   * 만료된 항목 정리
   * @private
   * @async
   * @returns {Promise<void>}
   * @description 캐시 만료 시간이 지난 항목들을 제거
   */
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

  /**
   * 캐시 전체 삭제
   * @async
   * @returns {Promise<void>}
   * @description 모든 캐시된 파일과 인덱스를 삭제
   */
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

  /**
   * 캐시 통계 조회
   * @async
   * @returns {Promise<Object>} 캐시 통계 정보
   * @returns {number} totalSize - 전체 캐시 크기
   * @returns {number} fileCount - 캐시된 파일 수
   * @returns {number | null} oldestEntry - 가장 오래된 항목 시간
   * @returns {number | null} newestEntry - 가장 최근 항목 시간
   * @description 현재 캐시 상태에 대한 통계 정보 반환
   */
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

  /**
   * 최적 캐시 전략 결정
   * @async
   * @returns {Promise<Object>} 캐시 전략
   * @returns {boolean} preloadThumbnails - 썸네일 미리 로드 여부
   * @returns {boolean} preloadFullImages - 전체 이미지 미리 로드 여부
   * @returns {number} cacheExpiry - 캐시 만료 시간
   * @description 네트워크 상태에 따라 최적의 캐시 전략 결정
   */
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

/**
 * 이미지 캐시 서비스 싱글톤 인스턴스
 * @constant {ImageCacheService}
 * @description 앱 전체에서 사용할 이미지 캐시 서비스 인스턴스
 */
export const imageCacheService = new ImageCacheService();
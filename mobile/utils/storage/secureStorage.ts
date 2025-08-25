/**
 * 크로스 플랫폼 보안 스토리지 래퍼
 * Web, iOS, Android에서 모두 작동하는 통합 스토리지 인터페이스
 * 
 * @module secureStorage
 * @description 플랫폼별 스토리지를 추상화하여 통일된 API 제공
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 플랫폼별 조건부 import
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (error) {
    console.warn('SecureStore not available, falling back to AsyncStorage');
  }
}

/**
 * 보안 스토리지 인터페이스
 */
interface ISecureStorage {
  /**
   * 값 저장
   * @param {string} key - 저장할 키
   * @param {string} value - 저장할 값
   * @returns {Promise<void>}
   */
  setItem(key: string, value: string): Promise<void>;
  
  /**
   * 값 조회
   * @param {string} key - 조회할 키
   * @returns {Promise<string | null>}
   */
  getItem(key: string): Promise<string | null>;
  
  /**
   * 값 삭제
   * @param {string} key - 삭제할 키
   * @returns {Promise<void>}
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * 모든 값 삭제
   * @returns {Promise<void>}
   */
  clear(): Promise<void>;
}

/**
 * 웹 스토리지 구현 (localStorage 사용)
 */
class WebSecureStorage implements ISecureStorage {
  private prefix = 'glimpse_secure_';

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.prefix + key, value);
      }
    } catch (error) {
      console.error('WebSecureStorage setItem error:', error);
      // Fallback to sessionStorage if localStorage is not available
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(this.prefix + key, value);
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(this.prefix + key);
      }
    } catch (error) {
      console.error('WebSecureStorage getItem error:', error);
      // Fallback to sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(this.prefix + key);
      }
    }
    return null;
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.prefix + key);
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(this.prefix + key);
      }
    } catch (error) {
      console.error('WebSecureStorage removeItem error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            window.localStorage.removeItem(key);
          }
        });
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keys = Object.keys(window.sessionStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            window.sessionStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('WebSecureStorage clear error:', error);
    }
  }
}

/**
 * 네이티브 스토리지 구현 (SecureStore 또는 AsyncStorage 사용)
 */
class NativeSecureStorage implements ISecureStorage {
  private useSecureStore: boolean;

  constructor() {
    this.useSecureStore = SecureStore !== null && Platform.OS !== 'web';
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.useSecureStore) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('NativeSecureStorage setItem error:', error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.useSecureStore) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('NativeSecureStorage getItem error:', error);
      // Fallback to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.useSecureStore) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('NativeSecureStorage removeItem error:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    try {
      // SecureStore doesn't have a clear method, so we use AsyncStorage clear
      await AsyncStorage.clear();
    } catch (error) {
      console.error('NativeSecureStorage clear error:', error);
    }
  }
}

/**
 * 플랫폼별 스토리지 인스턴스 생성
 */
const createSecureStorage = (): ISecureStorage => {
  if (Platform.OS === 'web') {
    return new WebSecureStorage();
  } else {
    return new NativeSecureStorage();
  }
};

/**
 * 싱글톤 보안 스토리지 인스턴스
 * @constant
 * @description 앱 전체에서 사용할 통합 스토리지 인터페이스
 */
export const secureStorage = createSecureStorage();

/**
 * 호환성을 위한 SecureStore 스타일 API
 * @deprecated 직접 secureStorage 사용 권장
 */
export const SecureStoreCompat = {
  setItemAsync: (key: string, value: string) => secureStorage.setItem(key, value),
  getItemAsync: (key: string) => secureStorage.getItem(key),
  deleteItemAsync: (key: string) => secureStorage.removeItem(key),
  getValueWithKeyAsync: (key: string) => secureStorage.getItem(key), // Clerk 호환성
};

export default secureStorage;
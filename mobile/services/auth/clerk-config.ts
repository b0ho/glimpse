// import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

/**
 * Clerk 토큰 캐시 인터페이스
 * @interface TokenCache
 * @description Clerk 인증 토큰을 안전하게 저장하고 관리하는 캐시 인터페이스
 */
interface TokenCache {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, value: string) => Promise<void>;
  deleteToken: (key: string) => Promise<void>;
}

/**
 * Clerk 토큰 캐시 구현체
 * @constant tokenCache
 * @type {TokenCache}
 * @description Expo SecureStore를 사용하여 토큰을 안전하게 저장
 */
const tokenCache: TokenCache = {
  /**
   * 토큰 가져오기
   * @async
   * @param {string} key - 토큰 키
   * @returns {Promise<string | null>} 저장된 토큰 또는 null
   */
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('Error getting token from secure store:', err);
      return null;
    }
  },
  /**
   * 토큰 저장하기
   * @async
   * @param {string} key - 토큰 키
   * @param {string} value - 토큰 값
   * @returns {Promise<void>}
   */
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token to secure store:', err);
    }
  },
  /**
   * 토큰 삭제하기
   * @async
   * @param {string} key - 토큰 키
   * @returns {Promise<void>}
   */
  async deleteToken(key: string) {
    try {
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error('Error deleting token from secure store:', err);
    }
  },
};

export { tokenCache };

/**
 * Clerk 설정 객체
 * @constant CLERK_CONFIG
 * @description Clerk SDK 초기화에 필요한 설정
 * @property {string} publishableKey - Clerk 공개 키
 * @property {TokenCache} tokenCache - 토큰 캐시 구현체
 */
export const CLERK_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  tokenCache,
} as const;

/**
 * 전화번호 포맷팅 유틸리티
 * @function formatPhoneNumber
 * @param {string} phone - 포맷팅할 전화번호
 * @returns {string} 국제 전화번호 형식으로 포맷팅된 번호
 * @description 한국 전화번호를 국제 형식(+82)으로 변환
 * @example
 * formatPhoneNumber('01012345678') // '+821012345678'
 * formatPhoneNumber('821012345678') // '+821012345678'
 */
export const formatPhoneNumber = (phone: string): string => {
  // 한국 전화번호 형식으로 포맷팅
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('82')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+82${cleaned.slice(1)}`;
  }
  return `+82${cleaned}`;
};

/**
 * 전화번호 유효성 검사
 * @function validatePhoneNumber
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} 유효한 전화번호 여부
 * @description 한국 전화번호 형식 유효성 검사
 * @example
 * validatePhoneNumber('01012345678') // true
 * validatePhoneNumber('+821012345678') // true
 * validatePhoneNumber('12345') // false
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+82|82)?[1-9]\d{7,8}$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned);
};
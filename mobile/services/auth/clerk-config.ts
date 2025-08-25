// import { ClerkProvider } from '@clerk/clerk-expo';
import { secureStorage } from '@/utils/storage';

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
      return await secureStorage.getItem(key);
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
      return await secureStorage.setItem(key, value);
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
      return await secureStorage.removeItem(key);
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
  publishableKey: 'pk_test_xxx',
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
  const cleaned = phone.replace(/\D/g, '');
  
  // 이미 국가 코드가 있는 경우
  if (cleaned.startsWith('82')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  // 한국 전화번호 (0으로 시작)
  if (cleaned.startsWith('0')) {
    return `+82${cleaned.slice(1)}`;
  }
  
  // 미국 전화번호로 추정 (10자리)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // 한국 전화번호로 기본 처리
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
  const cleaned = phone.replace(/\D/g, '');
  
  // 한국 전화번호 패턴: 010, 011, 016, 017, 018, 019로 시작하는 11자리
  if (cleaned.startsWith('010') || cleaned.startsWith('011') || 
      cleaned.startsWith('016') || cleaned.startsWith('017') || 
      cleaned.startsWith('018') || cleaned.startsWith('019')) {
    return cleaned.length === 11;
  }
  
  // +82로 시작하는 국제 형식: +821012345678 (13자리)
  if (cleaned.startsWith('82')) {
    const withoutCountryCode = cleaned.slice(2);
    return withoutCountryCode.startsWith('10') && cleaned.length === 13;
  }
  
  // 미국 전화번호 패턴: +1로 시작하는 11자리 (1-555-123-4567)
  if (cleaned.startsWith('1')) {
    return cleaned.length === 11;
  }
  
  // 테스트용 일반 전화번호 (10자리)
  if (cleaned.length === 10) {
    return true;
  }
  
  return false;
};
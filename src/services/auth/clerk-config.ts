import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Clerk 토큰 캐시 설정
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('Error getting token from secure store:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token to secure store:', err);
    }
  },
  async deleteToken(key: string) {
    try {
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error('Error deleting token from secure store:', err);
    }
  },
};

export { tokenCache };

// Clerk 설정
export const CLERK_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  tokenCache,
} as const;

// 전화번호 포맷팅 유틸리티
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

// 전화번호 유효성 검사
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+82|82)?[1-9]\d{7,8}$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned);
};
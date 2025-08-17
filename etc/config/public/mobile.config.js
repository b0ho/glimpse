/**
 * 모바일 앱 설정
 * @description React Native/Expo 앱용 공개 설정
 */

import { getCurrentApiConfig } from './api.config.js';

const apiConfig = getCurrentApiConfig();

export const mobileConfig = {
  // Expo 공개 변수 (클라이언트에서 접근 가능)
  expo: {
    development: {
      EXPO_PUBLIC_API_BASE_URL: apiConfig.baseURL,
      EXPO_PUBLIC_WEBSOCKET_URL: apiConfig.websocketURL,
      EXPO_PUBLIC_ENV: 'development',
      EXPO_PUBLIC_DEBUG_MODE: 'true',
    },
    
    test: {
      EXPO_PUBLIC_API_BASE_URL: apiConfig.baseURL,
      EXPO_PUBLIC_WEBSOCKET_URL: apiConfig.websocketURL,
      EXPO_PUBLIC_ENV: 'test',
      EXPO_PUBLIC_DEBUG_MODE: 'true',
    },
    
    staging: {
      EXPO_PUBLIC_API_BASE_URL: apiConfig.baseURL,
      EXPO_PUBLIC_WEBSOCKET_URL: apiConfig.websocketURL,
      EXPO_PUBLIC_ENV: 'staging',
      EXPO_PUBLIC_DEBUG_MODE: 'false',
    },
    
    production: {
      EXPO_PUBLIC_API_BASE_URL: apiConfig.baseURL,
      EXPO_PUBLIC_WEBSOCKET_URL: apiConfig.websocketURL,
      EXPO_PUBLIC_ENV: 'production',
      EXPO_PUBLIC_DEBUG_MODE: 'false',
    },
  },
  
  // 앱 버전 관리
  versions: {
    minSupportedVersion: '1.0.0',
    recommendedVersion: '1.0.0',
    forceUpdateBelow: '0.9.0',
  },
  
  // 푸시 알림 설정
  notifications: {
    categories: {
      MATCH: 'match',
      MESSAGE: 'message',
      LIKE: 'like',
      GROUP: 'group',
      SYSTEM: 'system',
    },
  },
};

// 현재 환경 설정 반환
export const getCurrentMobileConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...mobileConfig,
    currentExpoConfig: mobileConfig.expo[env] || mobileConfig.expo.development,
  };
};

export default getCurrentMobileConfig();
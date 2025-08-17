/**
 * API 설정
 * @description 공개 가능한 API 엔드포인트 및 URL 설정
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const apiConfig = {
  // 기본 API 설정
  development: {
    baseURL: 'http://localhost:3001/api/v1',
    websocketURL: 'ws://localhost:3001',
    frontendURL: 'http://localhost:3000',
    serverPort: 3001,
  },
  
  test: {
    baseURL: 'http://localhost:3001/api/v1',
    websocketURL: 'ws://localhost:3001',
    frontendURL: 'http://localhost:3000',
    serverPort: 3001,
  },
  
  staging: {
    baseURL: 'https://api-staging.glimpse.app/api/v1',
    websocketURL: 'wss://api-staging.glimpse.app',
    frontendURL: 'https://staging.glimpse.app',
    serverPort: 3001,
  },
  
  production: {
    baseURL: 'https://api.glimpse.app/api/v1',
    websocketURL: 'wss://api.glimpse.app',
    frontendURL: 'https://glimpse.app',
    serverPort: 3001,
  },
};

// 현재 환경에 따른 설정 반환
export const getCurrentApiConfig = () => {
  if (isTest) return apiConfig.test;
  if (isDevelopment) return apiConfig.development;
  if (process.env.NODE_ENV === 'staging') return apiConfig.staging;
  return apiConfig.production;
};

export default getCurrentApiConfig();
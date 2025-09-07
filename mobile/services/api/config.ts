import { Platform } from 'react-native';

/**
 * API 기본 URL
 * @constant {string}
 */
// 환경 감지: Vercel 환경에서는 production으로 간주
const isProduction = process.env.NODE_ENV === 'production' || 
                     (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname?.includes('.vercel.app'));

// Web에서는 localhost 사용, Native에서는 IP 주소 사용
const getBaseURL = () => {
  if (isProduction) {
    return 'https://glimpse-server.up.railway.app/api/v1';
  }
  
  // Web 환경에서는 항상 localhost 사용
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api/v1';
  }
  
  // Native 환경에서는 실제 로컬 IP 주소 사용 (localhost는 시뮬레이터에서 작동하지 않음)
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.25.45:3001/api/v1';
};

export const API_BASE_URL = getBaseURL();

// 디버깅용 로그
console.log('[API Config] Environment Detection:', {
  isProduction,
  platform: Platform.OS,
  hostname: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location?.hostname : 'native-app',
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
});

/**
 * WebSocket URL
 * @constant {string}
 */
const getSocketURL = () => {
  if (isProduction) {
    return 'wss://glimpse-server.up.railway.app';
  }
  
  // Web 환경에서는 항상 localhost 사용
  if (Platform.OS === 'web') {
    return 'ws://localhost:3001';
  }
  
  // Native 환경에서는 실제 로컬 IP 주소 사용 (localhost는 시뮬레이터에서 작동하지 않음)
  return process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://192.168.25.45:3001';
};

export const SOCKET_URL = getSocketURL();

/**
 * Development Auth Token
 * @constant {string | undefined}
 */
export const DEV_AUTH_TOKEN = process.env.DEV_AUTH_TOKEN;

/**
 * API 설정 객체
 * @constant
 * @property {string} baseURL - API 기본 URL
 * @property {string} socketURL - WebSocket URL
 * @property {number} timeout - 요청 타임아웃 (ms)
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  socketURL: SOCKET_URL,
  timeout: 30000,
};

/**
 * 요청 옵션 인터페이스
 * @interface RequestOptions
 * @extends {RequestInit}
 * @property {Record<string, any>} [params] - URL 쿼리 파라미터
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

/**
 * 서비스 간 공유를 위한 토큰 저장소
 * @type {string | null}
 * @private
 */
let currentAuthToken: string | null = null;

/**
 * 인증 토큰 설정
 * @param {string | null} token - 설정할 인증 토큰
 * @description 앱 전역에서 사용할 인증 토큰을 설정
 */
export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

/**
 * 인증 토큰 조회
 * @returns {string | null} 현재 인증 토큰
 * @description 현재 설정된 인증 토큰을 반환
 */
export const getAuthToken = () => currentAuthToken;

/**
 * API 클라이언트 클래스
 * @class ApiClient
 * @description REST API 요청을 처리하는 HTTP 클라이언트
 */
class ApiClient {
  /**
   * API 기본 URL
   * @private
   * @type {string}
   */
  private baseURL: string;

  /**
   * ApiClient 생성자
   * @constructor
   */
  constructor() {
    this.baseURL = apiConfig.baseURL;
  }

  /**
   * 인증 토큰 가져오기
   * @private
   * @async
   * @returns {Promise<string | null>} 인증 토큰
   * @description 저장된 인증 토큰을 안전하게 가져오기
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // 개발 모드에서는 DEV_AUTH_TOKEN 사용
      if (DEV_AUTH_TOKEN && process.env.ENV === 'development') {
        return DEV_AUTH_TOKEN;
      }
      return currentAuthToken;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * HTTP 요청 실행
   * @private
   * @async
   * @template T
   * @param {string} endpoint - API 엔드포인트
   * @param {RequestOptions} [options={}] - 요청 옵션
   * @returns {Promise<T>} 응답 데이터
   * @throws {Error} 요청 실패 시 에러
   * @description 인증 토큰과 헤더를 포함한 HTTP 요청 실행
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...requestOptions } = options;
    
    // Build URL with query params if any
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    // Check if we're in dev mode first
    const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) ||
                  process.env.NODE_ENV === 'development' || 
                  process.env.ENV === 'development' ||
                  url.includes('localhost') ||
                  url.includes('127.0.0.1') ||
                  url.includes('192.168') ||
                  url.includes('10.') ||
                  url.includes('172.');

    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // In dev mode, use x-dev-auth header and skip token
    // In production mode, use token authentication
    if (isDev) {
      headers['x-dev-auth'] = 'true';
      console.log('[ApiClient] Development mode detected, adding x-dev-auth header');
    } else {
      // Only use token in production
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      if (isDev) {
        console.log('[ApiClient] Request:', {
          url,
          method: requestOptions.method || 'GET',
          headers,
        });
      }
      
      const response = await fetch(url, {
        ...requestOptions,
        headers,
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Parse JSON response
      const data = await response.json();
      if (isDev) {
        console.log('[ApiClient] Response received from:', endpoint);
      }
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET 요청
   * @async
   * @template T
   * @param {string} endpoint - API 엔드포인트
   * @param {Record<string, any>} [params] - 쿼리 파라미터
   * @returns {Promise<T>} 응답 데이터
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST 요청
   * @async
   * @template T
   * @param {string} endpoint - API 엔드포인트
   * @param {any} [data] - 요청 본문 데이터
   * @returns {Promise<T>} 응답 데이터
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 요청
   * @async
   * @template T
   * @param {string} endpoint - API 엔드포인트
   * @param {any} [data] - 요청 본문 데이터
   * @returns {Promise<T>} 응답 데이터
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH 요청
   * @async
   * @template T
   * @param {string} endpoint - API 엔드포인트
   * @param {any} [data] - 요청 본문 데이터
   * @returns {Promise<T>} 응답 데이터
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 요청
   * @async
   * @template T
   * @param {string} endpoint - API 엔드포인트
   * @returns {Promise<T>} 응답 데이터
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * API 클라이언트 싱글톤 인스턴스
 * @constant {ApiClient}
 * @description 앱 전체에서 사용할 API 클라이언트 인스턴스
 */
export const apiClient = new ApiClient();
export default apiClient;
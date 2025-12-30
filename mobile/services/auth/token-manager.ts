/**
 * 토큰 관리자
 * 
 * JWT 토큰의 저장, 조회, 갱신을 담당합니다.
 * 
 * @module services/auth/token-manager
 */

import { secureStorage } from '@/utils/storage';
import { Platform } from 'react-native';

// 저장 키
const ACCESS_TOKEN_KEY = 'glimpse_access_token';
const REFRESH_TOKEN_KEY = 'glimpse_refresh_token';
const TOKEN_EXPIRY_KEY = 'glimpse_token_expiry';
const USER_ID_KEY = 'glimpse_user_id';

// 토큰 갱신 임계값 (만료 5분 전)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 초 단위
}

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userId: string | null;
}

/**
 * 토큰 관리자 클래스
 */
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;
  private userId: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * 초기화 - 저장된 토큰 로드
   */
  async initialize(): Promise<boolean> {
    try {
      const [accessToken, refreshToken, expiresAtStr, userId] = await Promise.all([
        secureStorage.getItem(ACCESS_TOKEN_KEY),
        secureStorage.getItem(REFRESH_TOKEN_KEY),
        secureStorage.getItem(TOKEN_EXPIRY_KEY),
        secureStorage.getItem(USER_ID_KEY),
      ]);

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;
      this.userId = userId;

      console.log('[TokenManager] 초기화 완료:', {
        hasAccessToken: !!this.accessToken,
        hasRefreshToken: !!this.refreshToken,
        userId: this.userId,
      });

      return !!this.accessToken;
    } catch (error) {
      console.error('[TokenManager] 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 토큰 저장
   */
  async saveTokens(tokens: TokenPair, userId?: string): Promise<void> {
    try {
      const expiresAt = Date.now() + tokens.expiresIn * 1000;

      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiresAt = expiresAt;
      if (userId) {
        this.userId = userId;
      }

      await Promise.all([
        secureStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
        secureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
        secureStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString()),
        userId ? secureStorage.setItem(USER_ID_KEY, userId) : Promise.resolve(),
      ]);

      console.log('[TokenManager] 토큰 저장 완료');
    } catch (error) {
      console.error('[TokenManager] 토큰 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 토큰 삭제 (로그아웃)
   */
  async clearTokens(): Promise<void> {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      this.userId = null;

      await Promise.all([
        secureStorage.removeItem(ACCESS_TOKEN_KEY),
        secureStorage.removeItem(REFRESH_TOKEN_KEY),
        secureStorage.removeItem(TOKEN_EXPIRY_KEY),
        secureStorage.removeItem(USER_ID_KEY),
      ]);

      console.log('[TokenManager] 토큰 삭제 완료');
    } catch (error) {
      console.error('[TokenManager] 토큰 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * Access Token 조회 (필요시 갱신)
   */
  async getAccessToken(): Promise<string | null> {
    // 토큰이 없으면 null 반환
    if (!this.accessToken) {
      return null;
    }

    // 토큰 만료 확인 및 갱신
    if (this.isTokenExpiringSoon()) {
      const refreshed = await this.refreshTokens();
      if (!refreshed) {
        return null;
      }
    }

    return this.accessToken;
  }

  /**
   * Refresh Token 조회
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * 사용자 ID 조회
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * 저장된 토큰 정보 조회
   */
  getStoredTokens(): StoredTokens {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
      userId: this.userId,
    };
  }

  /**
   * 토큰 만료 임박 확인
   */
  isTokenExpiringSoon(): boolean {
    if (!this.expiresAt) {
      return true;
    }
    return Date.now() > this.expiresAt - TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * 토큰 만료 확인
   */
  isTokenExpired(): boolean {
    if (!this.expiresAt) {
      return true;
    }
    return Date.now() > this.expiresAt;
  }

  /**
   * 인증 상태 확인
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired();
  }

  /**
   * 토큰 갱신
   */
  async refreshTokens(): Promise<boolean> {
    // 이미 갱신 중이면 기존 Promise 반환
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      console.warn('[TokenManager] Refresh Token이 없습니다');
      return false;
    }

    this.refreshPromise = this.doRefreshTokens();
    
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 실제 토큰 갱신 로직
   */
  private async doRefreshTokens(): Promise<boolean> {
    try {
      console.log('[TokenManager] 토큰 갱신 시작');

      // API 베이스 URL
      const baseUrl = this.getApiBaseUrl();

      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        console.error('[TokenManager] 토큰 갱신 실패:', response.status);
        // 401이면 토큰 만료 - 로그아웃 처리
        if (response.status === 401) {
          await this.clearTokens();
        }
        return false;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        await this.saveTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        });
        console.log('[TokenManager] 토큰 갱신 성공');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[TokenManager] 토큰 갱신 중 오류:', error);
      return false;
    }
  }

  /**
   * API 베이스 URL 조회
   */
  private getApiBaseUrl(): string {
    if (Platform.OS === 'web') {
      return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    }
    // 네이티브에서는 실제 IP 사용
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.25.45:3001';
  }
}

// 싱글톤 인스턴스
export const tokenManager = new TokenManager();


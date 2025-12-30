/**
 * 인증 서비스
 * 
 * 자체 JWT 인증 시스템 기반의 인증 서비스를 제공합니다.
 * AuthProvider에 의존하지 않고 직접 API를 호출합니다.
 * 
 * @module services/auth/auth-service
 */

import { Platform } from 'react-native';
import { ApiResponse } from '@/types';
import { tokenManager } from './token-manager';
import { setAuthToken } from '../api/config';

// API 베이스 URL
const getApiBaseUrl = () => {
  // 웹에서는 항상 localhost 사용 (CORS 및 호환성)
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api/v1';
  }
  // Native에서는 환경변수 또는 로컬 네트워크 IP 사용
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.25.45:3001/api/v1';
};

// 개발 환경인지 확인
const isDev = __DEV__ || process.env.NODE_ENV === 'development';

// 기본 요청 헤더
const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 개발 환경에서는 x-dev-auth 헤더 추가
  if (isDev) {
    headers['x-dev-auth'] = 'true';
  }
  
  return headers;
};

/**
 * 전화번호 형식 변환 (한국 형식)
 * 
 * @param phone 전화번호
 * @returns 포맷된 전화번호
 */
export const formatPhoneNumber = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 이미 +82 형식이면 그대로 반환
  if (phone.startsWith('+82')) {
    return phone.replace(/[^0-9+]/g, '');
  }
  
  // 010-xxxx-xxxx 형식을 +8210xxxxxxxx로 변환
  if (numbers.startsWith('010')) {
    return '+82' + numbers.substring(1);
  }
  
  // 10으로 시작하면 +8210으로 변환
  if (numbers.startsWith('10')) {
    return '+82' + numbers;
  }
  
  return '+82' + numbers;
};

/**
 * 전화번호 유효성 검증
 * 
 * @param phone 전화번호
 * @returns 유효 여부
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 한국 전화번호: 10-11자리
  if (numbers.length < 10 || numbers.length > 11) {
    return false;
  }
  
  // 010, +82 형식 확인
  if (phone.startsWith('+82')) {
    return numbers.length === 11 || numbers.length === 12;
  }
  
  return numbers.startsWith('010') || numbers.startsWith('10');
};

/**
 * 인증 서비스 인터페이스
 */
export interface AuthService {
  /** 인증 코드 발송 */
  sendVerificationCode: (phoneNumber: string) => Promise<ApiResponse<{ sent: boolean }>>;
  /** 전화번호로 로그인 */
  signInWithPhone: (phoneNumber: string, code: string) => Promise<ApiResponse<{ user: any }>>;
  /** 전화번호로 회원가입 */
  signUpWithPhone: (phoneNumber: string, code: string, userData?: any) => Promise<ApiResponse<{ user: any }>>;
  /** 인증 코드 확인 (로그인) */
  verifyPhoneCode: (phoneNumber: string, code: string) => Promise<ApiResponse<{ user: object }>>;
  /** 로그아웃 */
  signOut: () => Promise<void>;
  /** 현재 사용자 ID 가져오기 */
  getCurrentUserId: () => string | null;
  /** 인증 상태 확인 */
  isAuthenticated: () => boolean;
  /** OAuth 로그인 */
  signInWithOAuth: (provider: string, token: string) => Promise<ApiResponse<{ user: object }>>;
}

/**
 * 인증 서비스 훅
 * 
 * @returns {AuthService} 인증 서비스 인스턴스
 * @description 자체 JWT 인증 시스템 기반의 인증 서비스
 */
export const useAuthService = (): AuthService => {
  const baseUrl = getApiBaseUrl();

  /**
   * 인증 코드 발송
   */
  const sendVerificationCode = async (phoneNumber: string): Promise<ApiResponse<{ sent: boolean }>> => {
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: '올바른 전화번호 형식이 아닙니다',
        };
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${baseUrl}/auth/verify/send`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: { sent: true },
        };
      }

      return {
        success: false,
        error: data.message || '인증 코드 발송에 실패했습니다',
      };
    } catch (error) {
      console.error('Send verification code error:', error);
      return {
        success: false,
        error: '인증 코드 발송에 실패했습니다',
      };
    }
  };

  /**
   * 전화번호로 로그인
   */
  const signInWithPhone = async (
    phoneNumber: string, 
    code: string
  ): Promise<ApiResponse<{ user: any }>> => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ 
          phoneNumber: formattedPhone, 
          verificationCode: code 
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 토큰 저장
        await tokenManager.saveTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        }, data.data.user?.id);

        // API 클라이언트에 토큰 설정
        setAuthToken(data.data.accessToken);

        return {
          success: true,
          data: { user: data.data.user },
        };
      }

      return {
        success: false,
        error: data.message || '로그인에 실패했습니다',
      };
    } catch (error) {
      console.error('Sign in with phone error:', error);
      return {
        success: false,
        error: '로그인 중 오류가 발생했습니다',
      };
    }
  };

  /**
   * 전화번호로 회원가입
   */
  const signUpWithPhone = async (
    phoneNumber: string,
    code: string,
    userData?: any
  ): Promise<ApiResponse<{ user: any }>> => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          verificationCode: code,
          nickname: userData?.nickname,
          age: userData?.age,
          gender: userData?.gender,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 토큰 저장
        await tokenManager.saveTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        }, data.data.user?.id);

        // API 클라이언트에 토큰 설정
        setAuthToken(data.data.accessToken);

        return {
          success: true,
          data: { user: data.data.user },
        };
      }

      return {
        success: false,
        error: data.message || '회원가입에 실패했습니다',
      };
    } catch (error) {
      console.error('Sign up with phone error:', error);
      return {
        success: false,
        error: '회원가입 중 오류가 발생했습니다',
      };
    }
  };

  /**
   * 인증 코드 확인 및 로그인 (레거시 호환)
   */
  const verifyPhoneCode = async (
    phoneNumber: string, 
    code: string
  ): Promise<ApiResponse<{ user: object }>> => {
    // signInWithPhone과 동일
    return signInWithPhone(phoneNumber, code);
  };

  /**
   * OAuth 로그인
   */
  const signInWithOAuth = async (
    provider: string, 
    token: string
  ): Promise<ApiResponse<{ user: object }>> => {
    try {
      const response = await fetch(`${baseUrl}/auth/oauth/${provider}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 토큰 저장
        await tokenManager.saveTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        }, data.data.user?.id);

        // API 클라이언트에 토큰 설정
        setAuthToken(data.data.accessToken);

        return {
          success: true,
          data: { user: data.data.user },
        };
      }

      return {
        success: false,
        error: data.message || `${provider} 로그인에 실패했습니다`,
      };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return {
        success: false,
        error: `${provider} 로그인 중 오류가 발생했습니다`,
      };
    }
  };

  /**
   * 로그아웃
   */
  const signOut = async (): Promise<void> => {
    try {
      const token = await tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();
      
      if (token) {
        // 서버에 로그아웃 요청
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            ...getDefaultHeaders(),
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {}); // 실패해도 진행
      }

      // 로컬 토큰 삭제
      await tokenManager.clearTokens();
      
      // API 클라이언트 토큰 삭제
      setAuthToken(null);

      console.log('[AuthService] 로그아웃 완료');
    } catch (error) {
      console.error('[AuthService] 로그아웃 실패:', error);
      // 실패해도 로컬 상태는 초기화
      await tokenManager.clearTokens();
      setAuthToken(null);
    }
  };

  /**
   * 현재 사용자 ID 가져오기
   */
  const getCurrentUserId = (): string | null => {
    return tokenManager.getUserId();
  };

  /**
   * 인증 상태 확인
   */
  const isAuthenticated = (): boolean => {
    return tokenManager.isAuthenticated();
  };

  return {
    sendVerificationCode,
    signInWithPhone,
    signUpWithPhone,
    verifyPhoneCode,
    signOut,
    getCurrentUserId,
    isAuthenticated,
    signInWithOAuth,
  };
};

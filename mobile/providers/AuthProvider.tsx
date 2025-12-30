/**
 * 자체 인증 Provider
 * 
 * Clerk를 대체하는 자체 인증 시스템입니다.
 * 
 * @module providers/AuthProvider
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { tokenManager, TokenPair } from '@/services/auth/token-manager';
import { useAuthStore } from '@/store/slices/authSlice';
import { setAuthToken } from '@/services/api/config';
import { Platform } from 'react-native';
import { formatPhoneNumber, validatePhoneNumber } from '@/services/auth/auth-service';

// API 베이스 URL
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.25.45:3001';
};

/**
 * OAuth 제공자
 */
type OAuthProvider = 'google' | 'kakao' | 'naver';

/**
 * 인증 컨텍스트 타입
 */
interface AuthContextType {
  // 상태
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  
  // 액션
  signInWithPhone: (phoneNumber: string, code: string) => Promise<AuthResult>;
  signUpWithPhone: (phoneNumber: string, code: string, userData: SignUpData) => Promise<AuthResult>;
  sendVerificationCode: (phoneNumber: string) => Promise<boolean>;
  signInWithOAuth: (provider: OAuthProvider, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshSession: () => Promise<boolean>;
}

interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface SignUpData {
  nickname?: string;
  age?: number;
  gender?: string;
}

// 기본값
const defaultContext: AuthContextType = {
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  signInWithPhone: async () => ({ success: false, error: '초기화 중' }),
  signUpWithPhone: async () => ({ success: false, error: '초기화 중' }),
  sendVerificationCode: async () => false,
  signInWithOAuth: async () => ({ success: false, error: '초기화 중' }),
  signOut: async () => {},
  signOutAllDevices: async () => {},
  getToken: async () => null,
  refreshSession: async () => false,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 인증 Provider 컴포넌트
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { setUser } = useAuthStore();
  
  // 사용자 정보 초기화
  const clearUser = () => setUser(null);

  /**
   * 초기화
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[AuthProvider] 초기화 시작');
        
        // 토큰 매니저 초기화
        const hasToken = await tokenManager.initialize();
        
        if (hasToken && !tokenManager.isTokenExpired()) {
          // 유효한 토큰이 있으면 사용자 정보 로드
          const storedUserId = tokenManager.getUserId();
          if (storedUserId) {
            setUserId(storedUserId);
            setIsSignedIn(true);
            
            // API 클라이언트에 토큰 설정
            const token = await tokenManager.getAccessToken();
            if (token) {
              setAuthToken(token);
              
              // 사용자 정보 로드
              await loadUserInfo(token);
            }
          }
        } else if (hasToken) {
          // 토큰이 만료되었으면 갱신 시도
          const refreshed = await tokenManager.refreshTokens();
          if (refreshed) {
            const storedUserId = tokenManager.getUserId();
            setUserId(storedUserId);
            setIsSignedIn(true);
            
            const token = await tokenManager.getAccessToken();
            if (token) {
              setAuthToken(token);
              await loadUserInfo(token);
            }
          } else {
            // 갱신 실패 시 인증 상태 초기화
            clearUser();
          }
        } else {
          // 토큰이 없으면 인증 상태 초기화 (persist에서 복원된 데이터 정리)
          clearUser();
        }
        
        setIsLoaded(true);
        console.log('[AuthProvider] 초기화 완료:', { isSignedIn });
      } catch (error) {
        console.error('[AuthProvider] 초기화 실패:', error);
        setIsLoaded(true);
      }
    };

    initialize();
  }, []);

  /**
   * 사용자 정보 로드
   */
  const loadUserInfo = async (token: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch (error) {
      console.error('[AuthProvider] 사용자 정보 로드 실패:', error);
    }
  };

  /**
   * 인증 코드 발송
   */
  const sendVerificationCode = useCallback(async (phoneNumber: string): Promise<boolean> => {
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        return false;
      }
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/verify/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('[AuthProvider] 인증 코드 발송 실패:', error);
      return false;
    }
  }, []);

  /**
   * 전화번호 로그인
   */
  const signInWithPhone = useCallback(async (
    phoneNumber: string, 
    code: string
  ): Promise<AuthResult> => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        // 상태 업데이트
        setUserId(data.data.user?.id || null);
        setIsSignedIn(true);
        
        if (data.data.user) {
          setUser(data.data.user);
        }

        return { success: true, userId: data.data.user?.id };
      }

      return { success: false, error: data.message || '로그인 실패' };
    } catch (error) {
      console.error('[AuthProvider] 로그인 실패:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다' };
    }
  }, [setUser]);

  /**
   * 전화번호 회원가입
   */
  const signUpWithPhone = useCallback(async (
    phoneNumber: string,
    code: string,
    userData: SignUpData
  ): Promise<AuthResult> => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          verificationCode: code,
          nickname: userData.nickname,
          age: userData.age,
          gender: userData.gender,
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

        // 상태 업데이트
        setUserId(data.data.user?.id || null);
        setIsSignedIn(true);
        
        if (data.data.user) {
          setUser(data.data.user);
        }

        return { success: true, userId: data.data.user?.id };
      }

      return { success: false, error: data.message || '회원가입 실패' };
    } catch (error) {
      console.error('[AuthProvider] 회원가입 실패:', error);
      return { success: false, error: '회원가입 중 오류가 발생했습니다' };
    }
  }, [setUser]);

  /**
   * OAuth 로그인
   */
  const signInWithOAuth = useCallback(async (
    provider: OAuthProvider,
    token: string
  ): Promise<AuthResult> => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/oauth/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        // 상태 업데이트
        setUserId(data.data.user?.id || null);
        setIsSignedIn(true);
        
        if (data.data.user) {
          setUser(data.data.user);
        }

        return { success: true, userId: data.data.user?.id };
      }

      return { success: false, error: data.message || `${provider} 로그인 실패` };
    } catch (error) {
      console.error(`[AuthProvider] ${provider} 로그인 실패:`, error);
      return { success: false, error: `${provider} 로그인 중 오류가 발생했습니다` };
    }
  }, [setUser]);

  /**
   * 로그아웃
   */
  const signOut = useCallback(async () => {
    try {
      const token = await tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();
      
      if (token) {
        const baseUrl = getApiBaseUrl();
        // 서버에 로그아웃 요청
        await fetch(`${baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {}); // 실패해도 진행
      }

      // 로컬 토큰 삭제
      await tokenManager.clearTokens();
      
      // API 클라이언트 토큰 삭제
      setAuthToken(null);
      
      // 상태 초기화
      setUserId(null);
      setIsSignedIn(false);
      clearUser();

      console.log('[AuthProvider] 로그아웃 완료');
    } catch (error) {
      console.error('[AuthProvider] 로그아웃 실패:', error);
      // 실패해도 로컬 상태는 초기화
      await tokenManager.clearTokens();
      setAuthToken(null);
      setUserId(null);
      setIsSignedIn(false);
      clearUser();
    }
  }, [clearUser]);

  /**
   * 모든 기기 로그아웃
   */
  const signOutAllDevices = useCallback(async () => {
    try {
      const token = await tokenManager.getAccessToken();
      
      if (token) {
        const baseUrl = getApiBaseUrl();
        await fetch(`${baseUrl}/api/v1/auth/logout/all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {});
      }

      // 로컬 로그아웃
      await signOut();
    } catch (error) {
      console.error('[AuthProvider] 모든 기기 로그아웃 실패:', error);
      await signOut();
    }
  }, [signOut]);

  /**
   * 토큰 조회
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    return tokenManager.getAccessToken();
  }, []);

  /**
   * 세션 갱신
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const success = await tokenManager.refreshTokens();
    if (success) {
      const token = await tokenManager.getAccessToken();
      if (token) {
        setAuthToken(token);
      }
    }
    return success;
  }, []);

  const value: AuthContextType = {
    isLoaded,
    isSignedIn,
    userId,
    signInWithPhone,
    signUpWithPhone,
    sendVerificationCode,
    signInWithOAuth,
    signOut,
    signOutAllDevices,
    getToken,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 인증 컨텍스트 훅
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthLoaded 컴포넌트 (ClerkLoaded 대체)
 */
export const AuthLoaded: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoaded } = useAuth();
  
  if (!isLoaded) {
    return null;
  }
  
  return <>{children}</>;
};

export default AuthProvider;

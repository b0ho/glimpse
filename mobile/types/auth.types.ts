/**
 * 인증 화면 관련 타입 정의
 */

/**
 * 인증 단계
 */
export type AuthStep = 'welcome' | 'phone' | 'sms' | 'nickname' | 'company' | 'completed';

/**
 * 인증 모드
 */
export type AuthMode = 'signin' | 'signup';

/**
 * 인증 화면 Props
 */
export interface AuthScreenProps {
  onAuthCompleted: () => void;
}

/**
 * 빠른 개발 로그인 사용자 정보
 */
export interface QuickDevUser {
  id: string;
  nickname: string;
  profileImageUrl?: string;
  isPremium: boolean;
  phoneNumber?: string;
}

/**
 * OAuth 사용자 정보
 */
export interface OAuthUserInfo {
  id?: string;
  email?: string;
  nickname?: string;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * 인증 상태
 */
export interface AuthScreenState {
  currentStep: AuthStep;
  phoneNumber: string;
  authMode: AuthMode;
  isGoogleLoading: boolean;
  isKakaoLoading: boolean;
  isNaverLoading: boolean;
}
/**
 * AWS Cognito 인증 서비스
 * 
 * Amplify Gen 2 방식으로 Cognito 인증을 처리합니다.
 * 
 * @module services/auth/cognito-service
 */

import {
  signUp,
  confirmSignUp,
  signIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  SignUpInput,
  ConfirmSignUpInput,
  SignInInput,
} from 'aws-amplify/auth';
import { formatPhoneNumber } from './auth-service';

/**
 * Cognito 회원가입 결과
 */
export interface CognitoSignUpResult {
  success: boolean;
  userId?: string;
  needsConfirmation?: boolean;
  error?: string;
}

/**
 * Cognito 로그인 결과
 */
export interface CognitoSignInResult {
  success: boolean;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * AWS Cognito 인증 서비스
 */
export const cognitoService = {
  /**
   * 전화번호로 회원가입 (SMS 인증 코드 발송)
   * 
   * @param phoneNumber 전화번호
   * @param password 비밀번호 (Cognito 요구사항)
   * @returns 회원가입 결과
   */
  async signUp(phoneNumber: string, password: string): Promise<CognitoSignUpResult> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const signUpInput: SignUpInput = {
        username: formattedPhone,
        password,
        options: {
          userAttributes: {
            phone_number: formattedPhone,
          },
        },
      };

      const { userId, nextStep } = await signUp(signUpInput);
      
      console.log('[Cognito Service] 회원가입 성공:', {
        userId,
        nextStep: nextStep.signUpStep,
      });

      return {
        success: true,
        userId,
        needsConfirmation: nextStep.signUpStep === 'CONFIRM_SIGN_UP',
      };
    } catch (error: any) {
      console.error('[Cognito Service] 회원가입 실패:', error);
      return {
        success: false,
        error: error.message || '회원가입에 실패했습니다',
      };
    }
  },

  /**
   * SMS 인증 코드 확인 (회원가입 완료)
   * 
   * @param phoneNumber 전화번호
   * @param code SMS 인증 코드
   * @returns 인증 결과
   */
  async confirmSignUp(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const confirmInput: ConfirmSignUpInput = {
        username: formattedPhone,
        confirmationCode: code,
      };

      await confirmSignUp(confirmInput);
      
      console.log('[Cognito Service] 인증 코드 확인 성공');

      return { success: true };
    } catch (error: any) {
      console.error('[Cognito Service] 인증 코드 확인 실패:', error);
      return {
        success: false,
        error: error.message || '인증 코드가 유효하지 않습니다',
      };
    }
  },

  /**
   * 인증 코드 재발송
   * 
   * @param phoneNumber 전화번호
   * @returns 재발송 결과
   */
  async resendSignUpCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      await resendSignUpCode({ username: formattedPhone });
      
      console.log('[Cognito Service] 인증 코드 재발송 성공');

      return { success: true };
    } catch (error: any) {
      console.error('[Cognito Service] 인증 코드 재발송 실패:', error);
      return {
        success: false,
        error: error.message || '인증 코드 재발송에 실패했습니다',
      };
    }
  },

  /**
   * 전화번호로 로그인
   * 
   * @param phoneNumber 전화번호
   * @param password 비밀번호
   * @returns 로그인 결과 (ID Token 포함)
   */
  async signIn(phoneNumber: string, password: string): Promise<CognitoSignInResult> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const signInInput: SignInInput = {
        username: formattedPhone,
        password,
      };

      const { isSignedIn, nextStep } = await signIn(signInInput);
      
      if (!isSignedIn) {
        console.warn('[Cognito Service] 로그인 추가 단계 필요:', nextStep.signInStep);
        return {
          success: false,
          error: '로그인에 추가 단계가 필요합니다',
        };
      }

      // 세션에서 토큰 가져오기
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      const accessToken = session.tokens?.accessToken?.toString();
      
      console.log('[Cognito Service] 로그인 성공');

      return {
        success: true,
        idToken,
        accessToken,
      };
    } catch (error: any) {
      console.error('[Cognito Service] 로그인 실패:', error);
      return {
        success: false,
        error: error.message || '로그인에 실패했습니다',
      };
    }
  },

  /**
   * 로그아웃
   */
  async signOut(): Promise<void> {
    try {
      await amplifySignOut();
      console.log('[Cognito Service] 로그아웃 완료');
    } catch (error) {
      console.error('[Cognito Service] 로그아웃 실패:', error);
      throw error;
    }
  },

  /**
   * 현재 Cognito ID Token 가져오기
   * 
   * @returns ID Token 또는 null
   */
  async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('[Cognito Service] ID Token 조회 실패:', error);
      return null;
    }
  },

  /**
   * 현재 Cognito Access Token 가져오기
   * 
   * @returns Access Token 또는 null
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.error('[Cognito Service] Access Token 조회 실패:', error);
      return null;
    }
  },

  /**
   * 현재 인증된 사용자 정보 가져오기
   * 
   * @returns 사용자 정보 또는 null
   */
  async getCurrentUser(): Promise<{ username: string; userId: string } | null> {
    try {
      const { username, userId } = await getCurrentUser();
      return { username, userId };
    } catch (error) {
      console.error('[Cognito Service] 현재 사용자 조회 실패:', error);
      return null;
    }
  },

  /**
   * Cognito 세션 유효성 확인
   * 
   * @returns 세션 유효 여부
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.idToken;
    } catch {
      return false;
    }
  },
};


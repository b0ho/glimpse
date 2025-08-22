import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { formatPhoneNumber, validatePhoneNumber } from './clerk-config';
import { ApiResponse } from '@/types';

/**
 * 인증 서비스 인터페이스
 * @interface AuthService
 * @description 사용자 인증 관련 기능을 제공하는 서비스 인터페이스
 */
export interface AuthService {
  /** 전화번호로 로그인 시작 */
  signInWithPhone: (phoneNumber: string) => Promise<ApiResponse<{ verificationId: string }>>;
  /** 전화번호로 회원가입 시작 */
  signUpWithPhone: (phoneNumber: string) => Promise<ApiResponse<{ verificationId: string }>>;
  /** 인증 코드 확인 */
  verifyPhoneCode: (code: string) => Promise<ApiResponse<{ user: object }>>;
  /** 로그아웃 */
  signOut: () => Promise<void>;
  /** 현재 사용자 정보 가져오기 */
  getCurrentUser: () => object | null | undefined;
  /** 인증 상태 확인 */
  isAuthenticated: () => boolean;
}

/**
 * 인증 서비스 훅
 * @function useAuthService
 * @returns {AuthService} 인증 서비스 인스턴스
 * @description Clerk를 사용한 전화번호 기반 인증 서비스 구현
 */
export const useAuthService = (): AuthService => {
  const { signOut: clerkSignOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  /**
   * 전화번호로 로그인 시작 (기존 사용자만)
   * @async
   * @param {string} phoneNumber - 사용자 전화번호
   * @returns {Promise<ApiResponse<{ verificationId: string }>>} 인증 ID를 포함한 응답
   * @description 기존 사용자의 전화번호로 SMS 인증 코드를 전송
   */
  const signInWithPhone = async (phoneNumber: string): Promise<ApiResponse<{ verificationId: string }>> => {
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: {
            message: 'Invalid phone number format',
          },
        };
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      if (!signInLoaded) {
        return {
          success: false,
          error: {
            message: 'Authentication service not ready',
          },
        };
      }

      const signInAttempt = await signIn?.create({
        identifier: formattedPhone,
      });

      if (signInAttempt?.status === 'needs_first_factor') {
        const phoneCodeFactor = signInAttempt.supportedFirstFactors?.find(
          factor => factor.strategy === 'phone_code'
        );

        if (phoneCodeFactor) {
          await signIn?.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneCodeFactor.phoneNumberId,
          });

          return {
            success: true,
            data: { verificationId: phoneCodeFactor.phoneNumberId || '' },
          };
        }
      }

      return {
        success: false,
        error: {
          message: 'User not found or unable to sign in',
        },
      };
    } catch (error) {
      console.error('Phone sign in error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to sign in with phone number',
        },
      };
    }
  };

  /**
   * 전화번호로 회원가입 시작 (새 사용자만)
   * @async
   * @param {string} phoneNumber - 사용자 전화번호
   * @returns {Promise<ApiResponse<{ verificationId: string }>>} 인증 ID를 포함한 응답
   * @description 새 사용자의 전화번호로 SMS 인증 코드를 전송
   */
  const signUpWithPhone = async (phoneNumber: string): Promise<ApiResponse<{ verificationId: string }>> => {
    try {
      console.log('📞 Input phone number:', phoneNumber);
      console.log('🔍 Validating phone number...');
      
      if (!validatePhoneNumber(phoneNumber)) {
        console.log('❌ Phone validation failed for:', phoneNumber);
        return {
          success: false,
          error: {
            message: 'Invalid phone number format',
          },
        };
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('📱 Formatted phone:', formattedPhone);

      if (!signUpLoaded) {
        return {
          success: false,
          error: {
            message: 'Authentication service not ready',
          },
        };
      }

      const signUpAttempt = await signUp?.create({
        phoneNumber: formattedPhone,
      });

      if (signUpAttempt?.status === 'missing_requirements') {
        await signUp?.preparePhoneNumberVerification({
          strategy: 'phone_code',
        });

        return {
          success: true,
          data: { verificationId: signUpAttempt.id || '' },
        };
      }

      return {
        success: false,
        error: {
          message: 'Unable to create account',
        },
      };
    } catch (error) {
      console.error('Phone sign up error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to create account with phone number',
        },
      };
    }
  };

  /**
   * 인증 코드 확인
   * @async
   * @param {string} code - SMS로 받은 인증 코드
   * @returns {Promise<ApiResponse<{ user: object }>>} 사용자 정보를 포함한 응답
   * @description SMS 인증 코드를 확인하고 사용자 세션 생성
   */
  const verifyPhoneCode = async (code: string): Promise<ApiResponse<{ user: object }>> => {
    try {
      if (!signInLoaded || !signUpLoaded) {
        return {
          success: false,
          error: {
            message: 'Authentication service not ready',
          },
        };
      }

      // 로그인 시도
      if (signIn?.status === 'needs_first_factor') {
        const result = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code,
        });

        if (result.status === 'complete') {
          return {
            success: true,
            data: { user: (result.createdSessionId as unknown as object) || {} },
          };
        }
      }

      // 회원가입 시도
      if (signUp?.status === 'missing_requirements') {
        const result = await signUp.attemptPhoneNumberVerification({
          code,
        });

        if (result.status === 'complete') {
          return {
            success: true,
            data: { user: (result.createdSessionId as unknown as object) || {} },
          };
        }
      }

      return {
        success: false,
        error: {
          message: 'Invalid verification code',
        },
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to verify phone code',
        },
      };
    }
  };

  /**
   * 로그아웃
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 로그아웃 실패 시
   * @description 현재 사용자 세션을 종료하고 로그아웃 처리
   */
  const signOut = async (): Promise<void> => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  /**
   * 현재 사용자 정보 가져오기
   * @returns {object | null | undefined} 현재 로그인된 사용자 정보
   * @description Clerk에서 현재 인증된 사용자 정보를 반환
   */
  const getCurrentUser = () => {
    return user;
  };

  /**
   * 인증 상태 확인
   * @returns {boolean} 인증 여부
   * @description 사용자가 현재 로그인되어 있는지 확인
   */
  const isAuthenticated = (): boolean => {
    return !!isSignedIn;
  };

  return {
    signInWithPhone,
    signUpWithPhone,
    verifyPhoneCode,
    signOut,
    getCurrentUser,
    isAuthenticated,
  };
};
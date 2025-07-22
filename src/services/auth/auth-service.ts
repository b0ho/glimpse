import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { formatPhoneNumber, validatePhoneNumber } from './clerk-config';
import { ApiResponse } from '@/types';

export interface AuthService {
  signInWithPhone: (phoneNumber: string) => Promise<ApiResponse<{ verificationId: string }>>;
  verifyPhoneCode: (code: string) => Promise<ApiResponse<{ user: any }>>;
  signOut: () => Promise<void>;
  getCurrentUser: () => any;
  isAuthenticated: () => boolean;
}

export const useAuthService = (): AuthService => {
  const { signOut: clerkSignOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const signInWithPhone = async (phoneNumber: string): Promise<ApiResponse<{ verificationId: string }>> => {
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      if (!signInLoaded || !signUpLoaded) {
        return {
          success: false,
          error: 'Authentication service not ready',
        };
      }

      // 먼저 기존 사용자 로그인 시도
      try {
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
              message: 'SMS verification code sent',
            };
          }
        }
      } catch (signInError) {
        console.log('Sign in failed, trying sign up:', signInError);
      }

      // 새 사용자 등록
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
          message: 'SMS verification code sent for new user',
        };
      }

      return {
        success: false,
        error: 'Unexpected authentication state',
      };
    } catch (error) {
      console.error('Phone authentication error:', error);
      return {
        success: false,
        error: 'Failed to send verification code',
      };
    }
  };

  const verifyPhoneCode = async (code: string): Promise<ApiResponse<{ user: any }>> => {
    try {
      if (!signInLoaded || !signUpLoaded) {
        return {
          success: false,
          error: 'Authentication service not ready',
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
            data: { user: result.createdSessionId },
            message: 'Successfully signed in',
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
            data: { user: result.createdSessionId },
            message: 'Successfully signed up',
          };
        }
      }

      return {
        success: false,
        error: 'Invalid verification code',
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        error: 'Failed to verify phone code',
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getCurrentUser = () => {
    return user;
  };

  const isAuthenticated = (): boolean => {
    return !!isSignedIn;
  };

  return {
    signInWithPhone,
    verifyPhoneCode,
    signOut,
    getCurrentUser,
    isAuthenticated,
  };
};
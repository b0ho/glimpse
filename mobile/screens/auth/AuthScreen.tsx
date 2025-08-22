import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { SMSVerificationScreen } from './SMSVerificationScreen';
import { NicknameSetupScreen } from './NicknameSetupScreen';
import { CompanyVerificationScreen } from './CompanyVerificationScreen';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useSignUp, useOAuth, useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { ClerkGoogleAuth } from '@/components/auth/ClerkGoogleAuth';

/**
 * 인증 단계 타입
 * @typedef {'welcome' | 'phone' | 'sms' | 'nickname' | 'company' | 'completed'} AuthStep
 */
type AuthStep = 'welcome' | 'phone' | 'sms' | 'nickname' | 'company' | 'completed';

/**
 * 인증 화면 컴포넌트 Props
 * @interface AuthScreenProps
 * @property {Function} onAuthCompleted - 인증 완료 콜백
 */
interface AuthScreenProps {
  onAuthCompleted: () => void;
}

/**
 * 인증 화면 컴포넌트 - 다단계 인증 프로세스 관리
 * @component
 * @param {AuthScreenProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 인증 화면 UI
 * @description 전화번호 인증, SMS 확인, 닉네임 설정, 회사 인증 단계를 관리하는 컴포넌트
 */
export const AuthScreen= ({ onAuthCompleted }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation('auth');
  const { signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { setUser, setToken } = useAuthStore();

  /**
   * 인증코드 발송 핸들러
   * @param {string} phone - 전화번호
   * @description SMS 인증 단계로 진행
   */
  const handleVerificationSent = (phone: string): void => {
    setPhoneNumber(phone);
    setCurrentStep('sms');
  };

  /**
   * 인증 성공 핸들러
   * @description 닉네임 설정 단계로 진행
   */
  const handleVerificationSuccess = (): void => {
    setCurrentStep('nickname');
  };

  /**
   * 닉네임 설정 완료 핸들러
   * @description 회사 인증 단계로 진행
   */
  const handleNicknameSet = (): void => {
    setCurrentStep('company');
  };

  /**
   * 회사 인증 제출 핸들러
   * @description 인증 프로세스 완료
   */
  const handleCompanyVerificationSubmitted = (): void => {
    setCurrentStep('completed');
    onAuthCompleted();
  };

  /**
   * 로그인 모드 선택 핸들러
   */
  const handleSignInMode = (): void => {
    setAuthMode('signin');
    setCurrentStep('phone');
  };

  /**
   * 가입 모드 선택 핸들러
   */
  const handleSignUpMode = (): void => {
    setAuthMode('signup');
    setCurrentStep('phone');
  };

  /**
   * 구글 로그인 핸들러 (Clerk OAuth 사용)
   * @description Clerk를 통한 구글 OAuth 소셜 로그인 처리
   */
  const handleGoogleLogin = async (): Promise<void> => {
    console.log('🟡 구글 로그인 버튼 클릭 (Clerk OAuth)');
    
    // 개발 환경에서는 OAuth 우회하고 바로 로그인
    if (__DEV__) {
      console.log('🔧 개발 모드 감지 - OAuth 우회하고 직접 로그인');
      return handleDevLogin();
    }
    
    setIsGoogleLoading(true);
    
    try {
      // OAuth 플로우 시작
      const result = await startOAuthFlow();
      
      console.log('🔍 OAuth 결과:', { 
        createdSessionId: !!result?.createdSessionId,
        hasSignIn: !!result?.signIn,
        hasSignUp: !!result?.signUp,
        hasSetActive: !!result?.setActive
      });
      
      // 결과가 없으면 사용자가 취소한 것
      if (!result) {
        console.log('❌ OAuth 플로우 취소됨');
        setIsGoogleLoading(false);
        return;
      }
      
      const { createdSessionId, signIn, signUp, setActive } = result;
      
      if (createdSessionId && setActive) {
        console.log('✅ Clerk OAuth 로그인 성공:', createdSessionId);
        
        // 세션 활성화
        await setActive({ session: createdSessionId });
        
        // 사용자 정보 가져오기 - signIn 우선, 없으면 signUp 사용
        const userInfo = signIn || signUp;
        if (userInfo) {
          console.log('👤 사용자 정보:', {
            id: userInfo.id,
            email: userInfo.emailAddress,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
          });
          
          // Zustand store에 사용자 정보 설정
          const userData = {
            id: userInfo.id || 'temp_user_id',
            email: userInfo.emailAddress || '',
            nickname: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || '구글 사용자',
            anonymousId: `anon_${userInfo.id || 'temp'}`,
            phoneNumber: '',
            isVerified: true,
            profileImageUrl: userInfo.imageUrl || undefined,
            credits: 0,
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(userData);
          
          Alert.alert(
            '로그인 성공',
            `안녕하세요, ${userData.nickname}님!`,
            [
              {
                text: '확인',
                onPress: () => onAuthCompleted(),
              }
            ]
          );
        } else {
          console.log('❌ 사용자 정보를 가져올 수 없음');
          
          // fallback: 기본 사용자 정보로 진행
          const fallbackUser = {
            id: createdSessionId,
            email: 'user@example.com',
            nickname: '구글 사용자',
            anonymousId: `anon_${createdSessionId}`,
            phoneNumber: '',
            isVerified: true,
            credits: 0,
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(fallbackUser);
          
          Alert.alert(
            '로그인 성공',
            '구글 계정으로 로그인되었습니다!',
            [
              {
                text: '확인',
                onPress: () => onAuthCompleted(),
              }
            ]
          );
        }
      } else {
        console.log('❌ 세션 생성 실패:', { createdSessionId, setActive: !!setActive });
        console.log('📝 OAuth 플로우 디버깅:', {
          signIn,
          signUp,
          setActive: !!setActive
        });
        
        Alert.alert(
          '로그인 실패', 
          'Google 인증은 완료되었지만 세션 생성에 실패했습니다.\n\n' +
          '이는 Clerk 개발 환경의 제한사항일 수 있습니다.\n' +
          'Clerk Dashboard에서 Google OAuth 설정을 확인해주세요.',
          [
            {
              text: '확인',
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('🔥 Clerk 구글 로그인 예외:', error);
      
      // Cloudflare 오류나 기타 네트워크 오류 처리
      if (error.message?.includes('401') || error.message?.includes('cloudflare')) {
        console.log('🔧 Cloudflare 오류 감지, 개발 환경 fallback 적용');
        
        if (process.env.NODE_ENV === 'development') {
          const fallbackUser = {
            id: 'fallback_google_user',
            email: 'fallback.user@gmail.com',
            nickname: 'Fallback 사용자',
            anonymousId: 'anon_fallback_google',
            phoneNumber: '',
            isVerified: true,
            credits: 0,
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(fallbackUser);
          
          Alert.alert(
            '개발 환경 우회 로그인',
            'Cloudflare 제한으로 인해 개발용 계정으로 진입합니다.',
            [
              {
                text: '확인',
                onPress: () => onAuthCompleted(),
              }
            ]
          );
        } else {
          Alert.alert('네트워크 오류', '인터넷 연결을 확인하고 다시 시도해주세요.');
        }
      } else {
        Alert.alert('로그인 오류', error.message || '구글 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * 개발자 직접 로그인 핸들러
   * @description 개발 환경에서 OAuth 우회하여 직접 로그인
   */
  const handleDevLogin = async (): Promise<void> => {
    console.log('🔧 개발자 직접 로그인 시작');
    
    try {
      // 개발용 임시 이메일로 Clerk 계정 생성/로그인
      const devEmail = 'developer@glimpse.app';
      
      if (signUp && setActive) {
        console.log('🔄 Clerk 개발 계정 생성 중...');
        
        // Clerk에서 임시 계정 생성
        await signUp.create({
          emailAddress: devEmail,
          password: 'dev123!@#', // 개발용 임시 패스워드
        });
        
        // 이메일 인증 건너뛰기 (개발 환경)
        if (signUp.status === 'missing_requirements') {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        }
        
        // 개발 환경에서는 자동으로 verified로 처리
        const sessionResponse = await signUp.attemptEmailAddressVerification({
          code: '424242' // Clerk 개발 환경 기본 코드
        });
        
        if (sessionResponse.status === 'complete' && sessionResponse.createdSessionId) {
          await setActive({ session: sessionResponse.createdSessionId });
          console.log('✅ Clerk 개발 세션 활성화 완료');
          
          const devUser = {
            id: sessionResponse.createdUserId || 'dev_user_direct',
            email: devEmail,
            nickname: '개발자',
            anonymousId: `anon_${sessionResponse.createdUserId || 'dev'}`,
            phoneNumber: '',
            isVerified: true,
            credits: 0,
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(devUser);
          console.log('✅ 개발자 로그인 완료, 홈화면으로 이동');
          onAuthCompleted();
          return;
        }
      }
      
      // Clerk 계정 생성이 실패한 경우 fallback
      console.log('⚠️ Clerk 계정 생성 실패, Zustand만 사용');
      const devUser = {
        id: 'dev_user_fallback',
        email: 'developer@glimpse.app',
        nickname: '개발자 (Fallback)',
        anonymousId: 'anon_dev_fallback',
        phoneNumber: '',
        isVerified: true,
        credits: 0,
        isPremium: false,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        currentMode: 'DATING' as any,
      };
      
      setUser(devUser);
      console.log('✅ 개발자 Fallback 로그인 완료');
      
      // AppNavigator에서 isSignedIn 상태를 체크하므로, 
      // 실제로는 Clerk 세션 없이는 메인화면으로 이동할 수 없음
      Alert.alert(
        '개발 환경 알림', 
        'Clerk 세션이 없어 인증 화면에 머물게 됩니다. Google OAuth 또는 실제 인증을 사용해주세요.',
        [{ text: '확인' }]
      );
      
    } catch (error) {
      console.error('🔥 개발자 로그인 오류:', error);
      Alert.alert('개발 로그인 실패', '개발자 로그인 중 오류가 발생했습니다.');
    }
  };

  /**
   * 전화번호 인증 선택 핸들러
   * @description 전화번호 인증 방식으로 전환
   */
  const handlePhoneAuthOption = (): void => {
    setCurrentStep('phone');
  };

  /**
   * 뒤로가기 핸들러
   * @description 이전 인증 단계로 돌아가기
   */
  const handleBack = (): void => {
    if (currentStep === 'phone') {
      setCurrentStep('welcome');
    } else if (currentStep === 'sms') {
      setCurrentStep('phone');
      setPhoneNumber('');
    } else if (currentStep === 'nickname') {
      setCurrentStep('sms');
    } else if (currentStep === 'company') {
      setCurrentStep('nickname');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {currentStep === 'welcome' && (
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, { color: colors.PRIMARY }]}>🌟 Glimpse</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.TEXT.SECONDARY }]}>
            익명 데이팅의 새로운 시작
          </Text>
          
          <View style={styles.buttonContainer}>
            {/* 구글 로그인 - Clerk OAuth 컴포넌트 사용 */}
            <ClerkGoogleAuth onSuccess={onAuthCompleted} />

            {/* 개발 환경 직접 로그인 옵션 */}
            {process.env.NODE_ENV === 'development' && (
              <TouchableOpacity
                style={[styles.devButton]}
                onPress={handleDevLogin}
              >
                <Text style={styles.devButtonText}>🔧 개발자 직접 로그인</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.termsText, { color: colors.TEXT.LIGHT }]}>
            로그인 시 개인정보처리방침과{'\n'}서비스 이용약관에 동의하게 됩니다.
          </Text>
        </View>
      )}

      {currentStep === 'phone' && (
        <View style={{ flex: 1 }}>
          <View style={styles.phoneStepContainer}>
            <Text style={[styles.phoneStepTitle, { color: colors.PRIMARY }]}>전화번호 인증</Text>
            <Text style={[styles.phoneStepSubtitle, { color: colors.TEXT.SECONDARY }]}>
              계정이 있나요?
            </Text>
            
            <View style={styles.authModeContainer}>
              <TouchableOpacity
                style={[
                  styles.authModeButton,
                  { 
                    backgroundColor: authMode === 'signin' ? colors.PRIMARY : colors.SURFACE,
                    borderColor: colors.PRIMARY 
                  }
                ]}
                onPress={() => setAuthMode('signin')}
              >
                <Text style={[
                  styles.authModeButtonText,
                  { color: authMode === 'signin' ? colors.TEXT.WHITE : colors.PRIMARY }
                ]}>
                  기존 계정으로 로그인
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.authModeButton,
                  { 
                    backgroundColor: authMode === 'signup' ? colors.PRIMARY : colors.SURFACE,
                    borderColor: colors.PRIMARY 
                  }
                ]}
                onPress={() => setAuthMode('signup')}
              >
                <Text style={[
                  styles.authModeButtonText,
                  { color: authMode === 'signup' ? colors.TEXT.WHITE : colors.PRIMARY }
                ]}>
                  새 계정 만들기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <PhoneVerificationScreen 
            onVerificationSent={handleVerificationSent} 
            authMode={authMode}
            onBack={handleBack}
          />
        </View>
      )}
      
      {currentStep === 'sms' && (
        <SMSVerificationScreen
          phoneNumber={phoneNumber}
          onVerificationSuccess={handleVerificationSuccess}
          onBack={handleBack}
        />
      )}
      
      {currentStep === 'nickname' && (
        <NicknameSetupScreen
          onNicknameSet={handleNicknameSet}
        />
      )}
      
      {currentStep === 'company' && (
        <CompanyVerificationScreen
          onVerificationSubmitted={handleCompanyVerificationSubmitted}
          onSkip={handleCompanyVerificationSubmitted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XXL,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SPACING.XL,
  },
  // 구글 로그인 버튼
  googleButton: {
    backgroundColor: '#FFFFFF', // 구글 브랜드 컬러 (흰색)
    borderWidth: 1,
    borderColor: '#DADCE0', // 구글 보더 컬러
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.LG,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 20,
    marginRight: SPACING.SM,
  },
  googleButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '500',
    color: '#1F1F1F', // 구글 텍스트 컬러 (어두운 회색)
  },
  // 구분선
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.BORDER,
  },
  dividerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
    paddingHorizontal: SPACING.MD,
  },
  // 전화번호 인증 버튼
  phoneButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: 12,
    alignItems: 'center',
  },
  phoneButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIcon: {
    fontSize: 18,
    marginRight: SPACING.SM,
  },
  phoneButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT.PRIMARY,
  },
  // 개발자 로그인 버튼
  devButton: {
    backgroundColor: '#4CAF50', // 개발자 전용 초록색
    borderWidth: 1,
    borderColor: '#45A049',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  devButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // 약관 텍스트
  termsText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: SPACING.LG,
  },
  // 기존 버튼 스타일들 (전화번호 인증 화면에서 사용)
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  secondaryButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  // 전화번호 인증 단계 스타일
  phoneStepContainer: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
  },
  phoneStepTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  phoneStepSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  authModeContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  authModeButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  authModeButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
});
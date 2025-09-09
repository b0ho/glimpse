/**
 * 인증 화면 컴포넌트 - 모듈화된 버전
 */

import React from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { SMSVerificationScreen } from './SMSVerificationScreen';
import { NicknameSetupScreen } from './NicknameSetupScreen';
import { CompanyVerificationScreen } from './CompanyVerificationScreen';
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useAuthSteps } from '@/hooks/auth/useAuthSteps';
import { useGoogleAuth } from '@/hooks/auth/useGoogleAuth';
import { useAuthStore } from '@/store/slices/authSlice';
import { AuthScreenProps, QuickDevUser } from '@/types/auth.types';

/**
 * 인증 화면 컴포넌트 - 다단계 인증 프로세스 관리
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthCompleted }) => {
  const { colors } = useTheme();
  const { setUser, setToken } = useAuthStore();
  const navigation = useNavigation<any>();
  
  // 인증 단계 관리
  const {
    currentStep,
    phoneNumber,
    authMode,
    handleVerificationSent,
    handleVerificationSuccess,
    handleNicknameSet,
    handleCompanyVerificationSubmitted,
    handleSignInMode,
    handleSignUpMode,
    handleBack,
  } = useAuthSteps();
  
  // 구글 인증
  const { isGoogleLoading, handleGoogleLogin, handleQuickDevLogin } = useGoogleAuth(onAuthCompleted);
  
  /**
   * 회사 인증 완료 핸들러
   */
  const handleCompanyVerificationComplete = (): void => {
    handleCompanyVerificationSubmitted();
    onAuthCompleted();
  };
  
  /**
   * 빠른 개발 로그인 핸들러
   */
  const handleQuickDevUserLogin = (user: QuickDevUser): void => {
    const mockUser = {
      id: user.id,
      nickname: user.nickname,
      email: `${user.id}@test.com`,
      anonymousId: `anon_${user.id}`,
      phoneNumber: user.phoneNumber || '',
      isVerified: true,
      profileImageUrl: user.profileImageUrl,
      credits: user.isPremium ? 999 : 5,
      isPremium: user.isPremium,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentMode: 'DATING' as any,
    };
    
    // 개발 환경에서 토큰도 설정
    const devToken = `dev-token-${user.id}`;
    setToken(devToken);
    setUser(mockUser);
    onAuthCompleted();
    
    // 명시적으로 Main 화면으로 네비게이션
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };
  
  /**
   * 온보딩 초기화 핸들러
   */
  const handleResetOnboarding = async (): Promise<void> => {
    try {
      console.log('🔄 온보딩 초기화 시작');
      
      // 온보딩 완료 상태 제거
      await AsyncStorage.removeItem('@glimpse_onboarding_completed');
      
      // 페이지 새로고침으로 앱 재시작
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        Alert.alert(
          '온보딩 초기화 완료',
          '앱을 재시작하면 온보딩을 다시 볼 수 있습니다.',
          [{ text: '확인' }]
        );
      }
    } catch (error) {
      console.error('온보딩 초기화 실패:', error);
      Alert.alert('오류', '온보딩 초기화에 실패했습니다.');
    }
  };
  
  /**
   * 현재 단계에 따른 화면 렌더링
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            onSignInMode={handleSignInMode}
            onSignUpMode={handleSignUpMode}
            onGoogleLogin={handleGoogleLogin}
            onQuickDevLogin={handleQuickDevUserLogin}
            onResetOnboarding={handleResetOnboarding}
            isGoogleLoading={isGoogleLoading}
          />
        );
      
      case 'phone':
        return (
          <PhoneVerificationScreen
            onVerificationSent={handleVerificationSent}
            onBack={handleBack}
            authMode={authMode}
          />
        );
      
      case 'sms':
        return (
          <SMSVerificationScreen
            phoneNumber={phoneNumber}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={handleBack}
          />
        );
      
      case 'nickname':
        return (
          <NicknameSetupScreen
            onNicknameSet={handleNicknameSet}
            onBack={handleBack}
          />
        );
      
      case 'company':
        return (
          <CompanyVerificationScreen
            onVerificationSubmitted={handleCompanyVerificationComplete}
            onSkip={onAuthCompleted}
            onBack={handleBack}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {renderCurrentStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
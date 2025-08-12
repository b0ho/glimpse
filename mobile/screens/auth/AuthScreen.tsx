import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { SMSVerificationScreen } from './SMSVerificationScreen';
import { NicknameSetupScreen } from './NicknameSetupScreen';
import { CompanyVerificationScreen } from './CompanyVerificationScreen';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/utils/constants';

/**
 * 인증 단계 타입
 * @typedef {'phone' | 'sms' | 'nickname' | 'company' | 'completed'} AuthStep
 */
type AuthStep = 'phone' | 'sms' | 'nickname' | 'company' | 'completed';

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
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { colors } = useTheme();

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
   * 뒤로가기 핸들러
   * @description 이전 인증 단계로 돌아가기
   */
  const handleBack = (): void => {
    if (currentStep === 'sms') {
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
      {currentStep === 'phone' && (
        <PhoneVerificationScreen onVerificationSent={handleVerificationSent} />
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
});
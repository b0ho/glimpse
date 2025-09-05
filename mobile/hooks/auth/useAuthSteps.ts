/**
 * 인증 단계 관리 커스텀 훅
 */

import { useState } from 'react';
import { AuthStep, AuthMode } from '@/types/auth.types';

export const useAuthSteps = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  
  /**
   * 인증코드 발송 핸들러
   */
  const handleVerificationSent = (phone: string): void => {
    setPhoneNumber(phone);
    setCurrentStep('sms');
  };
  
  /**
   * 인증 성공 핸들러
   */
  const handleVerificationSuccess = (): void => {
    setCurrentStep('nickname');
  };
  
  /**
   * 닉네임 설정 완료 핸들러
   */
  const handleNicknameSet = (): void => {
    setCurrentStep('company');
  };
  
  /**
   * 회사 인증 제출 핸들러
   */
  const handleCompanyVerificationSubmitted = (): void => {
    setCurrentStep('completed');
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
   * 이전 단계로 이동
   */
  const handleBack = (): void => {
    switch (currentStep) {
      case 'phone':
        setCurrentStep('welcome');
        break;
      case 'sms':
        setCurrentStep('phone');
        break;
      case 'nickname':
        setCurrentStep('sms');
        break;
      case 'company':
        setCurrentStep('nickname');
        break;
      default:
        break;
    }
  };
  
  return {
    // States
    currentStep,
    phoneNumber,
    authMode,
    
    // Actions
    setCurrentStep,
    handleVerificationSent,
    handleVerificationSuccess,
    handleNicknameSet,
    handleCompanyVerificationSubmitted,
    handleSignInMode,
    handleSignUpMode,
    handleBack,
  };
};
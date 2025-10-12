/**
 * Authentication Steps Management Hook
 *
 * @module hooks/auth/useAuthSteps
 * @description 다단계 인증 프로세스(회원가입/로그인)의 단계와 상태를 관리하는 훅입니다.
 */

import { useState } from 'react';
import { AuthStep, AuthMode } from '@/types/auth.types';

/**
 * 인증 단계 관리 훅
 *
 * @hook
 * @returns {Object} 인증 단계 관련 상태 및 함수들
 * @returns {AuthStep} returns.currentStep - 현재 인증 단계
 * @returns {string} returns.phoneNumber - 입력된 전화번호
 * @returns {AuthMode} returns.authMode - 인증 모드 ('signin' | 'signup')
 * @returns {Function} returns.setCurrentStep - 현재 단계 설정 함수
 * @returns {Function} returns.handleVerificationSent - 인증코드 발송 완료 핸들러
 * @returns {Function} returns.handleVerificationSuccess - 인증 성공 핸들러
 * @returns {Function} returns.handleNicknameSet - 닉네임 설정 완료 핸들러
 * @returns {Function} returns.handleCompanyVerificationSubmitted - 회사 인증 제출 핸들러
 * @returns {Function} returns.handleSignInMode - 로그인 모드 선택 핸들러
 * @returns {Function} returns.handleSignUpMode - 가입 모드 선택 핸들러
 * @returns {Function} returns.handleBack - 이전 단계로 이동 핸들러
 *
 * @description
 * 다단계 인증 플로우를 관리합니다.
 * - 단계: welcome → phone → sms → nickname → company → completed
 * - 로그인/가입 모드 관리
 * - 단계별 전환 로직
 * - 이전 단계로 돌아가기
 *
 * @example
 * ```tsx
 * const {
 *   currentStep,
 *   phoneNumber,
 *   authMode,
 *   handleVerificationSent,
 *   handleBack
 * } = useAuthSteps();
 *
 * // 인증코드 발송 완료 처리
 * handleVerificationSent('010-1234-5678');
 *
 * // 이전 단계로 이동
 * handleBack();
 * ```
 */
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
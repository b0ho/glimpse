/**
 * 회사 인증 화면 (Company Verification Screen)
 *
 * @screen
 * @description 회사/대학교 인증을 통한 소속 그룹 가입 화면
 * - 이메일 도메인 인증 또는 초대 코드 인증 지원
 * - 자동 회사명 추출 및 수동 입력 가능
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { CompanyVerification } from '@/shared/types/company.types';
import { cn } from '@/lib/utils';

// 인증 상태 enum
enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// 인증 방법 enum
enum VerificationMethod {
  EMAIL_DOMAIN = 'EMAIL_DOMAIN',
  INVITE_CODE = 'INVITE_CODE',
}

/**
 * Props 인터페이스
 *
 * @interface CompanyVerificationScreenProps
 * @property {() => void} onVerificationSubmitted - 인증 제출 완료 시 호출되는 콜백
 * @property {() => void} [onSkip] - 건너뛰기 버튼 클릭 시 호출되는 선택적 콜백
 * @property {() => void} [onBack] - 뒤로가기 버튼 클릭 시 호출되는 선택적 콜백
 */
interface CompanyVerificationScreenProps {
  onVerificationSubmitted: () => void;
  onSkip?: () => void;
  onBack?: () => void;
}

/**
 * 회사 인증 화면 컴포넌트
 *
 * @component
 * @param {CompanyVerificationScreenProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 회사 인증 화면 UI
 *
 * @description
 * 사용자의 회사/대학교 소속을 인증하는 화면
 * - 이메일 도메인 인증: 회사 이메일 주소로 인증 (예: @samsung.com)
 * - 초대 코드 인증: 8자리 영숫자 초대 코드로 인증
 * - 자동 회사명 추출: 주요 도메인 자동 매핑 (네이버, 카카오, 삼성 등)
 * - 건너뛰기 가능: 선택적 인증 단계
 *
 * @navigation
 * - From: AuthScreen (닉네임 설정 완료 후)
 * - To: Main (인증 완료 또는 건너뛰기)
 *
 * @example
 * ```tsx
 * <CompanyVerificationScreen
 *   onVerificationSubmitted={() => navigation.navigate('Main')}
 *   onSkip={() => navigation.navigate('Main')}
 * />
 * ```
 */
export const CompanyVerificationScreen = ({
  onVerificationSubmitted,
  onSkip,
}: CompanyVerificationScreenProps) => {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useAndroidSafeTranslation();

  // 이메일 도메인에서 회사명 추출
  const extractCompanyFromEmail = (emailAddress: string): string => {
    const domain = emailAddress.split('@')[1];
    if (!domain) return '';
    
    // TODO: 확장성 개선 - 이 데이터는 백엔드 API나 별도 설정 파일로 관리 (Gemini 피드백 반영)
    const domainMappings: Record<string, string> = {
      'naver.com': '네이버',
      'kakao.com': '카카오',
      'samsung.com': '삼성전자',
      'lg.com': 'LG전자',
      'hyundai.com': '현대자동차',
      'snu.ac.kr': '서울대학교',
      'yonsei.ac.kr': '연세대학교',
      'korea.ac.kr': '고려대학교',
    };

    if (domainMappings[domain]) {
      return domainMappings[domain];
    }

    // 일반적인 회사 도메인에서 회사명 추출 (예: company.co.kr -> Company)
    const companyPart = domain.split('.')[0];
    return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
  };

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const validateInviteCode = (code: string): boolean => {
    // 초대 코드는 8자리 영숫자 조합
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  };

  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (validateEmail(text)) {
      const extractedCompany = extractCompanyFromEmail(text);
      setCompanyName(extractedCompany);
    } else {
      setCompanyName('');
    }
  };

  const handleSubmitVerification = async (): Promise<void> => {
    if (!selectedMethod) {
      Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.selectMethod'));
      return;
    }

    if (selectedMethod === VerificationMethod.EMAIL_DOMAIN) {
      if (!email.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterEmail'));
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.invalidEmail'));
        return;
      }
      if (!companyName.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterCompanyName'));
        return;
      }
    }

    if (selectedMethod === VerificationMethod.INVITE_CODE) {
      if (!inviteCode.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterInviteCode'));
        return;
      }
      if (!validateInviteCode(inviteCode)) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.invalidInviteCode'));
        return;
      }
      if (!companyName.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterCompanyName'));
        return;
      }
    }

    setIsLoading(true);

    try {
      // TODO: 실제 API 호출로 교체
      const verificationData: Partial<CompanyVerification> = {
        companyId: 'temp_company_id', // TODO: Get actual company ID from search/selection
        email: email,
        status: VerificationStatus.PENDING as 'PENDING' | 'APPROVED' | 'REJECTED',
        verificationMethod: selectedMethod === VerificationMethod.EMAIL_DOMAIN ? 'EMAIL' : 'DOCUMENT' as 'EMAIL' | 'DOCUMENT',
      };

      console.log('Submitting company verification:', verificationData, 'Company Name:', companyName);

      // 임시 지연 (실제 API 호출 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        t('auth:companyVerification.success.title'),
        t('auth:companyVerification.success.message'),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: onVerificationSubmitted,
          },
        ]
      );
    } catch (error) {
      console.error('Company verification error:', error);
      // TODO: 실제 운영 환경에서는 Sentry, Firebase Crashlytics 등으로 에러 전송 (Gemini 피드백 반영)
      Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.submitFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-grow">
        <View className="flex-1 justify-center px-6 py-8">
          <Text className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            {t('auth:companyVerification.title')}
          </Text>
          <Text className="text-base text-center leading-6 mb-8 text-gray-600 dark:text-gray-300">
            {t('auth:companyVerification.subtitle')}
          </Text>
          
          <View className="mb-8">
            {/* 인증 방법 선택 */}
            <Text className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {t('auth:companyVerification.methodSelection.label')}
            </Text>
            <Text className="text-sm leading-5 mb-6 text-gray-600 dark:text-gray-300">
              {t('auth:companyVerification.methodSelection.description')}
            </Text>
            
            <View className="mb-8">
              <TouchableOpacity
                className={cn(
                  "border-2 rounded-xl p-4 mb-4",
                  selectedMethod === VerificationMethod.EMAIL_DOMAIN
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                )}
                onPress={() => setSelectedMethod(VerificationMethod.EMAIL_DOMAIN)}
              >
                <Text className={cn(
                  "text-base font-semibold mb-1",
                  selectedMethod === VerificationMethod.EMAIL_DOMAIN
                    ? "text-blue-600"
                    : "text-gray-600 dark:text-gray-300"
                )}>
                  {t('auth:companyVerification.methods.email.title')}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {t('auth:companyVerification.methods.email.description')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={cn(
                  "border-2 rounded-xl p-4 mb-4",
                  selectedMethod === VerificationMethod.INVITE_CODE
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                )}
                onPress={() => setSelectedMethod(VerificationMethod.INVITE_CODE)}
              >
                <Text className={cn(
                  "text-base font-semibold mb-1",
                  selectedMethod === VerificationMethod.INVITE_CODE
                    ? "text-blue-600"
                    : "text-gray-600 dark:text-gray-300"
                )}>
                  {t('auth:companyVerification.methods.inviteCode.title')}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {t('auth:companyVerification.methods.inviteCode.description')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 이메일 인증 폼 */}
            {selectedMethod === VerificationMethod.EMAIL_DOMAIN && (
              <View className="mb-6">
                <Text className="text-base font-medium mb-2 mt-4 text-gray-900 dark:text-white">
                  {t('auth:companyVerification.form.emailLabel')}
                </Text>
                <TextInput
                  className="border-2 rounded-xl px-4 py-4 text-base mb-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="company@example.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                {companyName && (
                  <View className="flex-row items-center mb-4 p-2 bg-green-50 rounded-lg">
                    <Text className="text-sm mr-2 text-gray-600 dark:text-gray-300">
                      {t('auth:companyVerification.form.detectedCompany')}
                    </Text>
                    <Text className="text-sm font-semibold text-green-600">
                      {companyName}
                    </Text>
                  </View>
                )}
                
                <Text className="text-base font-medium mb-2 mt-4 text-gray-900 dark:text-white">
                  {t('auth:companyVerification.form.companyNameLabel')}
                </Text>
                <TextInput
                  className="border-2 rounded-xl px-4 py-4 text-base mb-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder={t('auth:companyVerification.form.companyNamePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            )}

            {/* 초대 코드 인증 폼 */}
            {selectedMethod === VerificationMethod.INVITE_CODE && (
              <View className="mb-6">
                <Text className="text-base font-medium mb-2 mt-4 text-gray-900 dark:text-white">
                  {t('auth:companyVerification.form.inviteCodeLabel')}
                </Text>
                <TextInput
                  className="border-2 rounded-xl px-4 py-4 text-base mb-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="ABC12345"
                  placeholderTextColor="#6B7280"
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                
                <Text className="text-base font-medium mb-2 mt-4 text-gray-900 dark:text-white">
                  {t('auth:companyVerification.form.companyNameLabel')}
                </Text>
                <TextInput
                  className="border-2 rounded-xl px-4 py-4 text-base mb-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder={t('auth:companyVerification.form.companyNamePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            )}
            
            <TouchableOpacity
              className={cn(
                "rounded-xl py-4 items-center mt-6",
                (!selectedMethod || isLoading)
                  ? "bg-gray-300 dark:bg-gray-700"
                  : "bg-blue-500"
              )}
              onPress={handleSubmitVerification}
              disabled={!selectedMethod || isLoading}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white text-base font-semibold ml-2">
                    {t('auth:companyVerification.form.submitting')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-semibold">
                  {t('auth:companyVerification.form.submitButton')}
                </Text>
              )}
            </TouchableOpacity>

            {/* 건너뛰기 버튼 */}
            {onSkip && (
              <TouchableOpacity
                className="mt-4 py-4 items-center"
                onPress={onSkip}
                disabled={isLoading}
              >
                <Text className="text-base font-medium underline text-gray-600 dark:text-gray-300">
                  {t('auth:companyVerification.form.skipButton')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text className="text-xs text-center leading-5 text-gray-500 dark:text-gray-400">
            {t('auth:companyVerification.notice')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
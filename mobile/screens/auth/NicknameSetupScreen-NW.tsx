/**
 * 닉네임 설정 화면 (Nickname Setup Screen)
 *
 * @screen
 * @description 사용자 닉네임 및 성별을 설정하는 화면
 * - 실시간 닉네임 유효성 검증 및 중복 확인
 * - 남성/여성 성별 선택
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
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import { REGEX } from '@/utils/constants';
import { Gender } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/store/slices/themeSlice';

/**
 * Props 인터페이스
 *
 * @interface NicknameSetupScreenProps
 * @property {() => void} onNicknameSet - 닉네임 설정 완료 시 호출되는 콜백
 */
interface NicknameSetupScreenProps {
  onNicknameSet: () => void;
}

/**
 * 닉네임 설정 화면 컴포넌트
 *
 * @component
 * @param {NicknameSetupScreenProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 닉네임 설정 화면 UI
 *
 * @description
 * SMS 인증 완료 후 사용자 프로필 기본 정보를 설정하는 화면
 * - 닉네임 입력: 2-20자, 한글/영문/숫자 조합
 * - 실시간 검증: 형식 검증 및 중복 확인 (디바운싱 적용)
 * - 성별 선택: 남성/여성 필수 선택
 * - 익명 매칭: 실명이 아닌 닉네임 기반 시스템
 *
 * @navigation
 * - From: AuthScreen (SMS 인증 완료 후)
 * - To: CompanyVerificationScreen 또는 Main
 *
 * @example
 * ```tsx
 * <NicknameSetupScreen
 *   onNicknameSet={() => navigation.navigate('CompanyVerification')}
 * />
 * ```
 */
export const NicknameSetupScreen = ({
  onNicknameSet,
}: NicknameSetupScreenProps) => {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const authStore = useAuthStore();
  const { t } = useAndroidSafeTranslation();
  const { isDarkMode } = useTheme();

  const validateNickname = (text: string): boolean => {
    return REGEX.NICKNAME.test(text);
  };

  const checkNicknameAvailability = async (text: string): Promise<void> => {
    if (!validateNickname(text)) {
      setIsAvailable(false);
      return;
    }

    // 실제로는 백엔드 API를 호출하여 닉네임 중복을 확인
    // 지금은 간단한 로컬 검증만 구현
    const unavailableNicknames = ['admin', 'system', 'glimpse', 'administrator', '관리자'];
    const available = !unavailableNicknames.includes(text.toLowerCase());
    setIsAvailable(available);
  };

  const handleNicknameChange = (text: string): void => {
    setNickname(text);
    setIsAvailable(null);
    
    // 개선된 디바운싱 (Gemini 피드백 반영)
    if (text.length >= 2) {
      setTimeout(() => {
        checkNicknameAvailability(text);
      }, 500);
    }
  };

  const handleSetNickname = async (): Promise<void> => {
    if (!nickname.trim()) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.enterNickname'));
      return;
    }

    if (!gender) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.selectGender'));
      return;
    }

    if (!validateNickname(nickname)) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.invalidNickname'));
      return;
    }

    if (isAvailable === false) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.nicknameInUse'));
      return;
    }

    setIsLoading(true);

    try {
      // 사용자 정보 업데이트 (닉네임 + 성별)
      authStore.updateUser({ 
        nickname: nickname.trim(),
        gender: gender,
      });
      
      Alert.alert(
        t('auth:nicknameSetup.success.title'),
        t('auth:nicknameSetup.success.message', { nickname }),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: onNicknameSet,
          },
        ]
      );
    } catch (error) {
      console.error('Profile setup error:', error);
      // TODO: 실제 운영 환경에서는 Sentry, Firebase Crashlytics 등으로 에러 전송
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.setupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBorderColor = (): string => {
    if (!nickname) return 'border-gray-200 dark:border-gray-600';
    if (isAvailable === true) return 'border-green-500';
    if (isAvailable === false) return 'border-red-500';
    return 'border-blue-500';
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          {t('auth:nicknameSetup.title')}
        </Text>
        <Text className="text-base text-center leading-6 mb-8 text-gray-600 dark:text-gray-300">
          {t('auth:nicknameSetup.subtitle')}
        </Text>
        
        <View className="mb-8">
          {/* 성별 선택 */}
          <Text className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {t('auth:nicknameSetup.gender.label')}
          </Text>
          <Text className="text-sm leading-5 mb-6 text-gray-600 dark:text-gray-300">
            {t('auth:nicknameSetup.gender.description')}
          </Text>
          
          <View className="flex-row mb-6 space-x-4">
            <TouchableOpacity
              className={cn(
                "flex-1 border-2 rounded-xl py-4 items-center",
                gender === 'MALE'
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              )}
              onPress={() => setGender('MALE')}
            >
              <Text className={cn(
                "text-base font-medium",
                gender === 'MALE'
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 dark:text-gray-300"
              )}>
                {t('common:gender.male')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={cn(
                "flex-1 border-2 rounded-xl py-4 items-center",
                gender === 'FEMALE'
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              )}
              onPress={() => setGender('FEMALE')}
            >
              <Text className={cn(
                "text-base font-medium",
                gender === 'FEMALE'
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 dark:text-gray-300"
              )}>
                {t('common:gender.female')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 닉네임 입력 */}
          <Text className={cn(
            "text-lg font-semibold mb-2 mt-8",
            "text-gray-900 dark:text-white"
          )}>
            {t('auth:nicknameSetup.nickname.label')}
          </Text>
          <Text className="text-sm leading-5 mb-6 text-gray-600 dark:text-gray-300">
            {t('auth:nicknameSetup.nickname.description')}
          </Text>
          
          <TextInput
            className={cn(
              "border-2 rounded-xl px-4 py-4 text-base mb-2",
              getInputBorderColor(),
              "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
            placeholder={t('auth:nicknameSetup.nickname.placeholder')}
            placeholderTextColor="#6B7280"
            value={nickname}
            onChangeText={handleNicknameChange}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {nickname && (
            <View className="mb-6">
              {isAvailable === null && nickname.length >= 2 && (
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  {t('auth:nicknameSetup.nickname.checking')}
                </Text>
              )}
              {isAvailable === true && (
                <Text className="text-sm text-green-600 font-medium">
                  ✓ {t('auth:nicknameSetup.nickname.available')}
                </Text>
              )}
              {isAvailable === false && (
                <Text className="text-sm text-red-500 font-medium">
                  {validateNickname(nickname) 
                    ? t('auth:nicknameSetup.errors.nicknameInUse') 
                    : t('auth:nicknameSetup.errors.invalidNicknameFormat')
                  }
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity
            className={cn(
              "rounded-xl py-4 items-center",
              (!nickname.trim() || !gender || isLoading || isAvailable === false)
                ? "bg-gray-300 dark:bg-gray-700"
                : "bg-blue-500"
            )}
            onPress={handleSetNickname}
            disabled={!nickname.trim() || !gender || isLoading || isAvailable === false}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white text-base font-semibold ml-2">
                  {t('auth:nicknameSetup.settingUp')}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-base font-semibold">
                {t('auth:nicknameSetup.submitButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text className="text-xs text-center leading-4 text-gray-500 dark:text-gray-400">
          {t('auth:nicknameSetup.notice')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};
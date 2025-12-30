/**
 * 전화번호 인증 화면 (Phone Verification Screen)
 *
 * @screen
 * @description 전화번호 입력 및 SMS 인증 요청 화면
 * - 한국 전화번호 형식 자동 포맷팅
 * - 로그인/회원가입 모드 지원
 * - 애니메이션 효과 적용
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthService } from '@/services/auth/auth-service';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { validatePhoneNumber as validatePhone } from '@/services/auth/auth-service';
import { cn } from '@/lib/utils';

/**
 * Props 인터페이스
 *
 * @interface PhoneVerificationScreenProps
 * @property {(phoneNumber: string) => void} onVerificationSent - SMS 전송 완료 시 호출되는 콜백
 * @property {'signin' | 'signup'} [authMode='signin'] - 인증 모드 (로그인/회원가입)
 * @property {() => void} [onBack] - 뒤로가기 버튼 클릭 시 호출되는 선택적 콜백
 */
interface PhoneVerificationScreenProps {
  onVerificationSent: (phoneNumber: string) => void;
  authMode?: 'signin' | 'signup';
  onBack?: () => void;
}

const { width } = Dimensions.get('window');

/**
 * 전화번호 인증 화면 컴포넌트
 *
 * @component
 * @param {PhoneVerificationScreenProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 전화번호 입력 화면 UI
 *
 * @description
 * 전화번호를 입력받아 SMS 인증번호를 전송하는 화면
 * - 자동 포맷팅: 010-1234-5678 형식으로 자동 변환
 * - 실시간 검증: 한국 전화번호 형식 검증 (010, 011, 016, 017, 018, 019)
 * - 애니메이션: 페이드인, 스케일, 입력 포커스 효과
 * - 플랫폼 대응: Web/iOS/Android 각각 최적화된 UI
 * - 로그인/회원가입: authMode에 따라 다른 문구 표시
 *
 * @navigation
 * - From: AuthScreen (Welcome 단계 후)
 * - To: SMSVerificationScreen (SMS 전송 성공 후)
 *
 * @example
 * ```tsx
 * <PhoneVerificationScreen
 *   onVerificationSent={(phone) => setPhoneNumber(phone)}
 *   authMode="signup"
 *   onBack={() => setCurrentStep('welcome')}
 * />
 * ```
 */
export const PhoneVerificationScreen = ({
  onVerificationSent,
  authMode = 'signin',
  onBack,
}: PhoneVerificationScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const authService = useAuthService();
  const { t } = useAndroidSafeTranslation('auth');
  const { colors: themeColors } = useTheme();
  
  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // 페이드인 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const animateInputFocus = (focused: boolean) => {
    Animated.timing(inputBorderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const formatPhoneInput = (input: string): string => {
    // 숫자만 추출
    const numbers = input.replace(/\D/g, '');
    
    // 한국 전화번호 형식으로 포맷팅
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSendVerification = async (): Promise<void> => {
    console.log('🔍 handleSendVerification called');
    console.log('📱 Phone number:', phoneNumber);
    console.log('🎯 Auth mode:', authMode);
    
    if (!phoneNumber.trim()) {
      console.log('❌ Phone number is empty');
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.phoneRequired'));
      return;
    }

    const rawNumbers = phoneNumber.replace(/\D/g, '');
    console.log('📞 Raw numbers:', rawNumbers);
    
    if (!validatePhone(rawNumbers)) {
      console.log('❌ Phone validation failed');
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.invalidPhone'));
      return;
    }

    console.log('⏳ Starting verification process');
    setIsLoading(true);

    try {
      console.log('🚀 Calling auth service to send verification code');
      // 인증 코드 발송 (로그인/회원가입 모드에 관계없이 동일)
      const result = await authService.sendVerificationCode(rawNumbers);
      
      console.log('📨 Auth service result:', result);
      
      if (result.success || result.data?.sent) {
        const titleKey = authMode === 'signup' ? 'phoneVerification.signup.success.title' : 'phoneVerification.success.title';
        const messageKey = authMode === 'signup' ? 'phoneVerification.signup.success.message' : 'phoneVerification.success.message';
        
        console.log('✅ Success, moving to SMS verification');
        
        // 웹 환경에서는 Alert 콜백이 작동하지 않을 수 있으므로 플랫폼별 처리
        if (Platform.OS === 'web') {
          // 웹에서는 바로 다음 화면으로 이동
          onVerificationSent(rawNumbers);
          // 옵션: 토스트 메시지나 다른 방식으로 알림
          window.alert(`${t(titleKey)}\n${t(messageKey)}`);
        } else {
          // 네이티브에서는 Alert 사용
          Alert.alert(
            t(titleKey),
            t(messageKey),
            [
              {
                text: t('common:actions.confirm'),
                onPress: () => onVerificationSent(rawNumbers),
              },
            ]
          );
        }
      } else {
        console.log('❌ Auth service failed:', result.error);
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : (result.error as any)?.message || t('auth:phoneVerification.errors.sendFailed');
        Alert.alert(t('common:errors.error'), errorMessage);
      }
    } catch (error) {
      console.error('🔥 Phone verification error:', error);
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.networkError'));
    } finally {
      console.log('🏁 Verification process finished');
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (text: string): void => {
    const formatted = formatPhoneInput(text);
    if (formatted.length <= 13) { // 010-1234-5678 형식 최대 길이
      setPhoneNumber(formatted);
    }
  };

  return (
    <KeyboardAvoidingView 
      className={cn(
        "flex-1",
        "bg-gray-50 dark:bg-black"
      )}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {onBack && (
        <View className={cn(
          "px-5",
          Platform.OS === 'ios' ? "pt-15" : "pt-10",
          "pb-5"
        )}>
          <TouchableOpacity
            className="flex-row items-center py-2 px-3 rounded-[20px] bg-red-100 dark:bg-red-100/10 self-start"
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={themeColors.TEXT.PRIMARY} 
            />
            <Text className="text-base font-medium ml-1 text-gray-900 dark:text-white">
              뒤로가기
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Animated.View 
        className="flex-1 px-6 pt-5"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* 타이틀 섹션 */}
        <View className="items-center mb-10">
          <View className="mb-6">
            <LinearGradient
              colors={['#FF8A8A', '#FF6B6B']}
              className={cn(
                "w-20 h-20 rounded-full justify-center items-center",
                Platform.select({
                  ios: "shadow-lg",
                  android: "elevation-10",
                  web: "" // Shadow handled via style
                })
              )}
              style={Platform.OS === 'web' ? {
                boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.3)'
              } : undefined}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="phone-portrait" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text className="text-3xl font-bold text-center mb-2 text-red-500 dark:text-red-400">
            {authMode === 'signup' ? t('auth:phoneVerification.signup.title') : t('auth:phoneVerification.title')}
          </Text>
          <Text className="text-base text-center leading-6 px-5 text-gray-600 dark:text-gray-400">
            {authMode === 'signup' ? t('auth:phoneVerification.signup.subtitle') : t('auth:phoneVerification.subtitle')}
          </Text>
        </View>
        
        {/* 폼 섹션 */}
        <View className="mb-8">
          <View className="flex-row items-center mb-2">
            <Text className="text-base font-semibold text-gray-900 dark:text-white">
              {t('auth:phoneVerification.phoneLabel')}
            </Text>
            <View className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-100/20 rounded-xl">
              <Text className="text-xs font-semibold text-red-500">필수</Text>
            </View>
          </View>
          
          <Text className="text-sm leading-5 mb-5 text-gray-600 dark:text-gray-400">
            {t('auth:phoneVerification.description')}
          </Text>
          
          {/* 입력 필드 */}
          <Animated.View
            className={cn(
              "flex-row items-center rounded-2xl mb-6 overflow-hidden bg-white dark:bg-gray-800",
              Platform.select({
                ios: "shadow-sm",
                android: "elevation-2",
                web: "" // Shadow handled via style
              })
            )}
            style={{
              borderColor: inputBorderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  themeColors.BORDER,
                  themeColors.PRIMARY,
                ],
              }),
              borderWidth: inputBorderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2],
              }),
              ...(Platform.OS === 'web' ? {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
              } : {})
            }}
          >
            <View className="flex-row items-center pl-4 pr-2">
              <Ionicons 
                name="call-outline" 
                size={20} 
                color={isFocused 
                  ? themeColors.PRIMARY
                  : themeColors.TEXT.TERTIARY
                } 
              />
              <Text className="text-base font-medium ml-2 text-gray-900 dark:text-white">
                +82
              </Text>
            </View>
            <TextInput
              className="flex-1 text-base py-4.5 pr-4 text-gray-900 dark:text-white"
              placeholder="10-1234-5678"
              placeholderTextColor={themeColors.TEXT.TERTIARY}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={13}
              autoFocus
              onFocus={() => {
                setIsFocused(true);
                animateInputFocus(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                animateInputFocus(false);
              }}
            />
          </Animated.View>
          
          {/* 버튼 */}
          <TouchableOpacity
            onPress={handleSendVerification}
            disabled={!phoneNumber.trim() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !phoneNumber.trim() || isLoading
                  ? ['#CED4DA', '#CED4DA']
                  : ['#FF6B6B', '#FF5252']
              }
              className={cn(
                "rounded-2xl py-4.5 items-center justify-center",
                Platform.select({
                  ios: "shadow-lg",
                  android: "elevation-8",
                  web: ""
                })
              )}
              style={Platform.OS === 'web' && !(!phoneNumber.trim() || isLoading) ? {
                boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.25)'
              } : undefined}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white text-base font-semibold ml-2">
                    {authMode === 'signup' ? t('auth:phoneVerification.signup.sendingButton') : t('auth:phoneVerification.sendingButton')}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className="text-white text-base font-semibold">
                    {authMode === 'signup' ? t('auth:phoneVerification.signup.sendButton') : t('auth:phoneVerification.sendButton')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* 개인정보 안내 */}
        <View className="flex-row items-center justify-center mt-6">
          <Ionicons 
            name="shield-checkmark-outline" 
            size={16} 
            color={themeColors.TEXT.TERTIARY} 
          />
          <Text className="text-xs text-center leading-4.5 ml-1.5 text-gray-500 dark:text-gray-400">
            {t('auth:phoneVerification.privacyNotice')}
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};
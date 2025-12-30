/**
 * SMS 인증 화면 (SMS Verification Screen)
 *
 * @screen
 * @description SMS로 받은 6자리 인증번호를 입력하는 화면
 * - 자동 포커스 이동 및 자동 제출
 * - 타이머 기반 만료 처리
 * - 재전송 기능 제공
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthService } from '@/services/auth/auth-service';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { SECURITY } from '@/utils/constants';
import { cn } from '@/lib/utils';

/**
 * Props 인터페이스
 *
 * @interface SMSVerificationScreenProps
 * @property {string} phoneNumber - 인증 대상 전화번호
 * @property {() => void} onVerificationSuccess - 인증 성공 시 호출되는 콜백
 * @property {() => void} onBack - 뒤로가기 버튼 클릭 시 호출되는 콜백
 */
interface SMSVerificationScreenProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

/**
 * SMS 인증 화면 컴포넌트
 *
 * @component
 * @param {SMSVerificationScreenProps} props - 컴포넌트 속성
 * @returns {JSX.Element} SMS 인증번호 입력 화면 UI
 *
 * @description
 * 전송된 SMS 인증번호 6자리를 입력받아 검증하는 화면
 * - 6자리 OTP: 각 자리별 개별 입력 필드
 * - 자동 포커스: 입력 시 다음 필드로 자동 이동
 * - 자동 제출: 6자리 완성 시 자동으로 인증 시도
 * - 만료 타이머: 3분 카운트다운 표시
 * - 재전송: 만료 후 또는 코드 미수신 시 재전송 가능
 * - 애니메이션: 오류 시 흔들림 효과, 페이드인 효과
 * - Backspace 처리: 삭제 시 이전 필드로 자동 이동
 *
 * @navigation
 * - From: PhoneVerificationScreen (SMS 전송 후)
 * - To: NicknameSetupScreen (인증 성공 후)
 *
 * @example
 * ```tsx
 * <SMSVerificationScreen
 *   phoneNumber="01012345678"
 *   onVerificationSuccess={() => setCurrentStep('nickname')}
 *   onBack={() => setCurrentStep('phone')}
 * />
 * ```
 */
export const SMSVerificationScreen = ({
  phoneNumber,
  onVerificationSuccess,
  onBack,
}: SMSVerificationScreenProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SECURITY.OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);
  const authService = useAuthService();
  const authStore = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { t } = useAndroidSafeTranslation();
  const { colors: themeColors } = useTheme();
  
  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
    
    // 타이머 시작
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 첫번째 입력 필드에 포커스
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string): string => {
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  const handleCodeChange = (text: string, index: number): void => {
    // 숫자만 허용
    const digit = text.replace(/\D/g, '').slice(-1);
    const newCode = code.split('');
    newCode[index] = digit;
    
    // 코드 업데이트
    const updatedCode = newCode.join('');
    setCode(updatedCode);
    
    // 다음 필드로 자동 이동
    if (digit && index < SECURITY.OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // 마지막 입력 시 자동 제출
    if (updatedCode.length === SECURITY.OTP_LENGTH) {
      handleVerifyCode();
    }
  };
  
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (): Promise<void> => {
    console.log('🔍 handleVerifyCode called');
    console.log('📝 Code entered:', code);
    console.log('📏 Code length:', code.length);
    
    if (code.length !== SECURITY.OTP_LENGTH) {
      console.log('❌ Invalid code length');
      Alert.alert(t('common:status.error'), t('auth:smsVerification.errors.enterSixDigitCode'));
      return;
    }

    console.log('✅ Starting verification process');
    setIsLoading(true);

    try {
      console.log('🚀 Calling authService.verifyPhoneCode with phone:', phoneNumber, 'code:', code);
      const result = await authService.verifyPhoneCode(phoneNumber, code);
      console.log('📨 Verification result:', result);
      
      if (result.success) {
        console.log('✅ Verification successful');
        // 인증 성공 시 사용자 정보를 스토어에 저장
        const userId = authService.getCurrentUserId();
        console.log('👤 Current user ID:', userId);
        if (userId) {
          authStore.setUser({
            id: userId,
            anonymousId: `anon_${userId.slice(-8)}`,
            nickname: t('common:user.defaultName'),
            phoneNumber: phoneNumber,
            isVerified: true,
            credits: 10, // 기본 크레딧
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        Alert.alert(
          t('auth:smsVerification.success.title'),
          t('auth:smsVerification.success.message'),
          [
            {
              text: t('common:buttons.confirm'),
              onPress: onVerificationSuccess,
            },
          ]
        );
      } else {
        console.log('❌ Verification failed:', result.error);
        shakeAnimation(); // 에러 시 흔들림 효과
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : (result.error as any)?.message || t('auth:smsVerification.errors.invalidCode');
        Alert.alert(t('common:status.error'), errorMessage);
        setCode(''); // 코드 초기화
        inputRefs.current[0]?.focus(); // 첫번째 필드로 포커스
      }
    } catch (error) {
      console.error('🔥 SMS verification error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert(t('common:status.error'), t('auth:smsVerification.errors.verificationFailed'));
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      const result = await authService.sendVerificationCode(phoneNumber);
      
      if (result.success || result.data?.sent) {
        Alert.alert(t('auth:smsVerification.resend.success.title'), t('auth:smsVerification.resend.success.message'));
        setRemainingTime(SECURITY.OTP_EXPIRY_MINUTES * 60);
        setCanResend(false);
        setCode('');
      } else {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : (result.error as any)?.message || t('auth:smsVerification.resend.errors.failed');
        Alert.alert(t('common:status.error'), errorMessage);
      }
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert(t('common:status.error'), t('common:errors.network'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50 dark:bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View 
        className={cn(
          "flex-1 px-6",
          Platform.OS === 'ios' ? "pt-20" : "pt-15"
        )}
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* 헤더 */}
        <TouchableOpacity 
          className="flex-row items-center py-2 px-3 rounded-[20px] bg-red-100 dark:bg-red-100/10 self-start mb-8"
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.TEXT.PRIMARY} 
          />
          <Text className="text-base font-medium ml-1 text-gray-900 dark:text-white">
            {t('common:buttons.back')}
          </Text>
        </TouchableOpacity>

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
                  web: ""
                })
              )}
              style={Platform.OS === 'web' ? {
                boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.3)'
              } : undefined}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="lock-closed" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            {t('auth:smsVerification.title')}
          </Text>
          <Text className="text-base text-center leading-6 px-5 text-gray-600 dark:text-gray-400">
            {t('auth:smsVerification.subtitle', { phoneNumber: formatPhoneNumber(phoneNumber) })}
          </Text>
        </View>
        
        {/* 코드 입력 필드 */}
        <Animated.View 
          className="mb-8"
          style={{
            transform: [{ translateX: shakeAnim }],
          }}
        >
          <View className="flex-row justify-between mb-6 px-5">
            {[...Array(SECURITY.OTP_LENGTH)].map((_, index) => (
              <View
                key={index}
                className={cn(
                  "w-11 h-14 rounded-xl justify-center items-center bg-white dark:bg-gray-800",
                  Platform.select({
                    ios: "shadow-sm",
                    android: "elevation-2",
                    web: ""
                  }),
                  code[index] ? "border-2 border-red-500 dark:border-red-400" : "border border-gray-200 dark:border-gray-600"
                )}
                style={Platform.OS === 'web' ? {
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
                } : undefined}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  className="text-2xl font-semibold w-full h-full text-center text-gray-900 dark:text-white"
                  value={code[index] || ''}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              </View>
            ))}
          </View>
          
          {/* 타이머 */}
          <View className="flex-row items-center justify-center mb-6">
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={remainingTime > 30 
                ? themeColors.SUCCESS
                : themeColors.WARNING
              } 
            />
            <Text className={cn(
              "text-sm ml-1.5",
              remainingTime > 30 
                ? "text-gray-600 dark:text-gray-400"
                : "text-amber-600 dark:text-amber-400"
            )}>
              {remainingTime > 0 
                ? t('auth:smsVerification.timer.expires', { time: formatTime(remainingTime) }) 
                : t('auth:smsVerification.timer.expired')
              }
            </Text>
          </View>
          
          {/* 확인 버튼 */}
          <TouchableOpacity
            onPress={() => {
              console.log('🔮️ Verify button pressed');
              console.log('🔢 Code length check:', code.length, 'vs required:', SECURITY.OTP_LENGTH);
              console.log('🎯 Is loading:', isLoading);
              if (code.length === SECURITY.OTP_LENGTH && !isLoading) {
                handleVerifyCode();
              }
            }}
            disabled={code.length !== SECURITY.OTP_LENGTH || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                code.length !== SECURITY.OTP_LENGTH || isLoading
                  ? ['#CED4DA', '#CED4DA']
                  : ['#FF6B6B', '#FF5252']
              }
              className={cn(
                "rounded-2xl py-4.5 items-center justify-center mb-4",
                Platform.select({
                  ios: "shadow-lg",
                  android: "elevation-8",
                  web: ""
                })
              )}
              style={Platform.OS === 'web' && (code.length === SECURITY.OTP_LENGTH && !isLoading) ? {
                boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.25)'
              } : undefined}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white text-base font-semibold ml-2">
                    {t('auth:smsVerification.verifying')}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white text-base font-semibold">
                    {t('auth:smsVerification.verifyButton')}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          {/* 재전송 버튼 */}
          <TouchableOpacity
            className={cn(
              "items-center py-3",
              !canResend && "opacity-50"
            )}
            onPress={handleResendCode}
            disabled={!canResend || isLoading}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons 
                name="refresh" 
                size={18} 
                color={canResend 
                  ? themeColors.PRIMARY
                  : themeColors.TEXT.TERTIARY
                } 
              />
              <Text className={cn(
                "text-base font-medium ml-1.5",
                canResend 
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-400 dark:text-gray-500"
              )}>
                {t('auth:smsVerification.resendButton')}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* 도움말 */}
        <View className="flex-row items-center justify-center mt-8 px-5">
          <Ionicons 
            name="information-circle-outline" 
            size={16} 
            color={themeColors.TEXT.TERTIARY} 
          />
          <Text className="text-xs text-center leading-4.5 ml-1.5 flex-1 text-gray-500 dark:text-gray-400">
            {t('auth:smsVerification.help')}
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';
import { SECURITY } from '@/utils/constants';

interface SMSVerificationScreenProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const SMSVerificationScreen= ({
  phoneNumber,
  onVerificationSuccess,
  onBack,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SECURITY.OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);
  const authService = useAuthService();
  const authStore = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { t } = useAndroidSafeTranslation();
  const { colors, isDarkMode } = useTheme();
  
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
      console.log('🚀 Calling authService.verifyPhoneCode with code:', code);
      const result = await authService.verifyPhoneCode(code);
      console.log('📨 Verification result:', result);
      
      if (result.success) {
        console.log('✅ Verification successful');
        // 인증 성공 시 사용자 정보를 스토어에 저장
        const currentUser = authService.getCurrentUser();
        console.log('👤 Current user:', currentUser);
        if (currentUser) {
          authStore.setUser({
            id: (currentUser as { id: string }).id,
            anonymousId: `anon_${(currentUser as { id: string }).id.slice(-8)}`,
            nickname: (currentUser as { firstName?: string }).firstName || t('common:user.defaultName'),
            phoneNumber: phoneNumber, // 해시화된 전화번호 (실제로는 백엔드에서 처리)
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
        Alert.alert(t('common:status.error'), typeof result.error === 'string' ? result.error : result.error?.message || t('auth:smsVerification.errors.invalidCode'));
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
      const result = await authService.signInWithPhone(phoneNumber);
      
      if (result.success) {
        Alert.alert(t('auth:smsVerification.resend.success.title'), t('auth:smsVerification.resend.success.message'));
        setRemainingTime(SECURITY.OTP_EXPIRY_MINUTES * 60);
        setCanResend(false);
        setCode('');
      } else {
        Alert.alert(t('common:status.error'), typeof result.error === 'string' ? result.error : result.error?.message || t('auth:smsVerification.resend.errors.failed'));
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
      style={[styles.container, { backgroundColor: isDarkMode ? DARK_COLORS.BACKGROUND : LIGHT_COLORS.BACKGROUND }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 헤더 */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY} 
          />
          <Text style={[styles.backButtonText, { color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY }]}>
            {t('common:buttons.back')}
          </Text>
        </TouchableOpacity>

        {/* 타이틀 섹션 */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']}
              style={styles.gradientIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="lock-closed" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY }]}>
            {t('auth:smsVerification.title')}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? DARK_COLORS.TEXT.SECONDARY : LIGHT_COLORS.TEXT.SECONDARY }]}>
            {t('auth:smsVerification.subtitle', { phoneNumber: formatPhoneNumber(phoneNumber) })}
          </Text>
        </View>
        
        {/* 코드 입력 필드 */}
        <Animated.View 
          style={[
            styles.form,
            {
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        >
          <View style={styles.codeContainer}>
            {[...Array(SECURITY.OTP_LENGTH)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: isDarkMode ? DARK_COLORS.SURFACE : LIGHT_COLORS.SURFACE,
                    borderColor: code[index] 
                      ? (isDarkMode ? DARK_COLORS.PRIMARY : LIGHT_COLORS.PRIMARY)
                      : (isDarkMode ? DARK_COLORS.BORDER : LIGHT_COLORS.BORDER),
                    borderWidth: code[index] ? 2 : 1,
                  },
                ]}
              >
                <TextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    { color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY },
                  ]}
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
          <View style={styles.timerContainer}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={remainingTime > 30 
                ? (isDarkMode ? DARK_COLORS.SUCCESS : LIGHT_COLORS.SUCCESS)
                : (isDarkMode ? DARK_COLORS.WARNING : LIGHT_COLORS.WARNING)
              } 
            />
            <Text style={[
              styles.timerText,
              { 
                color: remainingTime > 30 
                  ? (isDarkMode ? DARK_COLORS.TEXT.SECONDARY : LIGHT_COLORS.TEXT.SECONDARY)
                  : (isDarkMode ? DARK_COLORS.WARNING : LIGHT_COLORS.WARNING)
              },
            ]}>
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
                  ? isDarkMode ? ['#48484A', '#48484A'] : ['#CED4DA', '#CED4DA']
                  : isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']
              }
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    {t('auth:smsVerification.verifying')}
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>{t('auth:smsVerification.verifyButton')}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          {/* 재전송 버튼 */}
          <TouchableOpacity
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled,
            ]}
            onPress={handleResendCode}
            disabled={!canResend || isLoading}
            activeOpacity={0.7}
          >
            <View style={styles.resendButtonContent}>
              <Ionicons 
                name="refresh" 
                size={18} 
                color={canResend 
                  ? (isDarkMode ? DARK_COLORS.PRIMARY : LIGHT_COLORS.PRIMARY)
                  : (isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY)
                } 
              />
              <Text style={[
                styles.resendButtonText,
                {
                  color: canResend 
                    ? (isDarkMode ? DARK_COLORS.PRIMARY : LIGHT_COLORS.PRIMARY)
                    : (isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY)
                },
              ]}>
                {t('auth:smsVerification.resendButton')}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* 도움말 */}
        <View style={styles.helpContainer}>
          <Ionicons 
            name="information-circle-outline" 
            size={16} 
            color={isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY} 
          />
          <Text style={[styles.description, { color: isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY }]}>
            {t('auth:smsVerification.help')}
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  gradientIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.3)',
      } as any,
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  codeBox: {
    width: 45,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '600',
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    marginLeft: 6,
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.25)',
      } as any,
    }),
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 6,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginLeft: 6,
    flex: 1,
  },
});
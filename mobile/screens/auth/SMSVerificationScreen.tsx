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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthService } from '@/services/auth/auth-service';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES, SECURITY } from '@/utils/constants';

interface SMSVerificationScreenProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

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
  const inputRef = useRef<TextInput>(null);
  const { t } = useTranslation();

  useEffect(() => {
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
    // 포커스 설정
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  const handleCodeChange = (text: string): void => {
    // 숫자만 허용
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= SECURITY.OTP_LENGTH) {
      setCode(numbers);
    }
  };

  const handleVerifyCode = async (): Promise<void> => {
    if (code.length !== SECURITY.OTP_LENGTH) {
      Alert.alert(t('common:status.error'), t('auth:smsVerification.errors.enterSixDigitCode'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyPhoneCode(code);
      
      if (result.success) {
        // 인증 성공 시 사용자 정보를 스토어에 저장
        const currentUser = authService.getCurrentUser();
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
        Alert.alert(t('common:status.error'), typeof result.error === 'string' ? result.error : result.error?.message || t('auth:smsVerification.errors.invalidCode'));
        setCode(''); // 코드 초기화
      }
    } catch (error) {
      console.error('SMS verification error:', error);
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← {t('common:buttons.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth:smsVerification.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth:smsVerification.subtitle', { phoneNumber: formatPhoneNumber(phoneNumber) })}
        </Text>
        
        <View style={styles.form}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="123456"
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={SECURITY.OTP_LENGTH}
            textAlign="center"
          />
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {remainingTime > 0 ? t('auth:smsVerification.timer.expires', { time: formatTime(remainingTime) }) : t('auth:smsVerification.timer.expired')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.button,
              (code.length !== SECURITY.OTP_LENGTH || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={code.length !== SECURITY.OTP_LENGTH || isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                <Text style={[styles.buttonText, { marginLeft: SPACING.SM }]}>
                  {t('auth:smsVerification.verifying')}
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('auth:smsVerification.verifyButton')}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled,
            ]}
            onPress={handleResendCode}
            disabled={!canResend || isLoading}
          >
            {isLoading ? (
              <View style={styles.resendButtonContent}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={[styles.resendButtonText, { marginLeft: SPACING.XS }]}>
                  {t('auth:smsVerification.resending')}
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.resendButtonText,
                !canResend && styles.resendButtonTextDisabled,
              ]}>
                {t('auth:smsVerification.resendButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description}>
          {t('auth:smsVerification.help')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: SPACING.LG,
  },
  backButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XXL,
  },
  form: {
    marginBottom: SPACING.XXL,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingVertical: SPACING.LG,
    marginBottom: SPACING.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    fontSize: 24,
    letterSpacing: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  timerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  buttonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  buttonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: SPACING.SM,
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
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: COLORS.TEXT.LIGHT,
  },
  description: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 18,
  },
});
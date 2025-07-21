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
} from 'react-native';
import { useAuthService } from '@/services/auth/auth-service';
import { COLORS, SPACING, FONT_SIZES, SECURITY } from '@/utils/constants';

interface SMSVerificationScreenProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export const SMSVerificationScreen: React.FC<SMSVerificationScreenProps> = ({
  phoneNumber,
  onVerificationSuccess,
  onBack,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SECURITY.OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);
  const authService = useAuthService();
  const inputRef = useRef<TextInput>(null);

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
      Alert.alert('오류', '6자리 인증번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyPhoneCode(code);
      
      if (result.success) {
        Alert.alert(
          '인증 성공',
          '전화번호 인증이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: onVerificationSuccess,
            },
          ]
        );
      } else {
        Alert.alert('오류', result.error || '인증번호가 올바르지 않습니다.');
        setCode(''); // 코드 초기화
      }
    } catch (error) {
      console.error('SMS verification error:', error);
      Alert.alert('오류', '인증 중 오류가 발생했습니다. 다시 시도해주세요.');
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
        Alert.alert('재전송 완료', '인증번호를 다시 전송했습니다.');
        setRemainingTime(SECURITY.OTP_EXPIRY_MINUTES * 60);
        setCanResend(false);
        setCode('');
      } else {
        Alert.alert('오류', result.error || '인증번호 재전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
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
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.title}>인증번호 입력</Text>
        <Text style={styles.subtitle}>
          {formatPhoneNumber(phoneNumber)}로{'\n'}
          전송된 6자리 인증번호를 입력해주세요.
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
              {remainingTime > 0 ? `${formatTime(remainingTime)} 후 만료` : '인증번호가 만료되었습니다'}
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
            <Text style={styles.buttonText}>
              {isLoading ? '인증 중...' : '인증하기'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled,
            ]}
            onPress={handleResendCode}
            disabled={!canResend || isLoading}
          >
            <Text style={[
              styles.resendButtonText,
              !canResend && styles.resendButtonTextDisabled,
            ]}>
              {isLoading ? '전송 중...' : '인증번호 재전송'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description}>
          인증번호를 받지 못하셨나요?{'\n'}
          스팸 메시지함을 확인하시거나 잠시 후 다시 시도해주세요.
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  resendButtonDisabled: {
    opacity: 0.5,
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
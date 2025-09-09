import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput } from 'react-native';
import { useSignIn, useSignUp, useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { SPACING, FONT_SIZES } from '@/utils/constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ClerkPhoneAuthProps {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
  onBack?: () => void;
}

/**
 * Clerk 전화번호 인증 컴포넌트
 * SMS OTP를 통한 전화번호 인증 처리
 */
export const ClerkPhoneAuth: React.FC<ClerkPhoneAuthProps> = ({ mode, onSuccess, onBack }) => {
  const { colors } = useTheme();
  const { signIn, isLoaded: signInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setSignUpActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { setUser } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 전화번호 포맷팅
   */
  const formatPhoneNumber = (phone: string): string => {
    // 숫자만 추출
    const numbers = phone.replace(/\D/g, '');
    
    // 한국 번호 형식으로 변환 (+82)
    if (numbers.startsWith('010')) {
      return `+82${numbers.substring(1)}`;
    }
    
    // 이미 국가 코드가 있는 경우
    if (numbers.startsWith('82')) {
      return `+${numbers}`;
    }
    
    return `+82${numbers}`;
  };

  /**
   * 전화번호 인증 시작
   */
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('오류', '올바른 전화번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const formattedPhone = formatPhoneNumber(phoneNumber);

    try {
      if (mode === 'signup' && signUpLoaded) {
        // 회원가입 모드
        const result = await signUp?.create({
          phoneNumber: formattedPhone,
        });

        // 전화번호 인증 준비
        await signUp?.preparePhoneNumberVerification({
          strategy: 'phone_code',
        });

        setPendingVerification(true);
        Alert.alert('인증번호 전송', '인증번호가 SMS로 전송되었습니다.');
        
      } else if (mode === 'signin' && signInLoaded) {
        // 로그인 모드
        const result = await signIn?.create({
          identifier: formattedPhone,
        });

        // 전화번호 인증 준비
        const phoneCodeFactor = result?.supportedFirstFactors?.find(
          (factor: any) => factor.strategy === 'phone_code'
        );

        if (phoneCodeFactor && 'phoneNumberId' in phoneCodeFactor) {
          await signIn?.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneCodeFactor.phoneNumberId as string,
          });

          setPendingVerification(true);
          Alert.alert('인증번호 전송', '인증번호가 SMS로 전송되었습니다.');
        } else {
          Alert.alert('오류', '등록되지 않은 전화번호입니다.');
        }
      }
    } catch (error: any) {
      console.error('❌ OTP 전송 오류:', error);
      
      // 에러 메시지 파싱
      if (error?.errors?.[0]?.message) {
        Alert.alert('오류', error.errors[0].message);
      } else if (error?.message) {
        Alert.alert('오류', error.message);
      } else {
        Alert.alert('오류', '인증번호 전송에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 인증번호 확인
   */
  const handleVerifyOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('오류', '6자리 인증번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      let completeResult;

      if (mode === 'signup' && signUpLoaded) {
        // 회원가입 인증 완료
        completeResult = await signUp?.attemptPhoneNumberVerification({
          code: verificationCode,
        });

        if (completeResult?.status === 'complete' && completeResult.createdSessionId) {
          await setSignUpActive?.({ session: completeResult.createdSessionId });
          
          // 사용자 정보 저장
          const userData = {
            id: completeResult.createdUserId || '',
            phoneNumber: phoneNumber,
            nickname: '',
            isVerified: true,
            anonymousId: `anon_${completeResult.createdUserId}`,
            email: '',
            profileImageUrl: undefined,
            credits: 0,
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(userData as any);
          onSuccess();
        }
        
      } else if (mode === 'signin' && signInLoaded) {
        // 로그인 인증 완료
        completeResult = await signIn?.attemptFirstFactor({
          strategy: 'phone_code',
          code: verificationCode,
        });

        if (completeResult?.status === 'complete' && completeResult.createdSessionId) {
          await setSignInActive?.({ session: completeResult.createdSessionId });
          
          // 사용자 정보 저장
          const userData = {
            id: completeResult.createdUserId || '',
            phoneNumber: phoneNumber,
            nickname: '',
            isVerified: true,
            anonymousId: `anon_${completeResult.createdUserId}`,
            email: '',
            profileImageUrl: undefined,
            credits: 0,
            isPremium: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(userData as any);
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('❌ OTP 인증 오류:', error);
      
      if (error?.errors?.[0]?.message) {
        Alert.alert('오류', error.errors[0].message);
      } else {
        Alert.alert('오류', '인증번호가 올바르지 않습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!pendingVerification ? (
        // 전화번호 입력 화면
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
              {mode === 'signup' ? '회원가입' : '로그인'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
              전화번호를 입력해주세요
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="phone" 
              size={20} 
              color={colors.TEXT.SECONDARY} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="010-0000-0000"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.PRIMARY }]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>인증번호 받기</Text>
            )}
          </TouchableOpacity>

          {onBack && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.BORDER }]}
              onPress={onBack}
            >
              <Text style={[styles.backButtonText, { color: colors.TEXT.SECONDARY }]}>
                돌아가기
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        // 인증번호 입력 화면
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
              인증번호 입력
            </Text>
            <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
              {phoneNumber}로 전송된 6자리 코드를 입력해주세요
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="message-text" 
              size={20} 
              color={colors.TEXT.SECONDARY} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="000000"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.PRIMARY }]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>인증하기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.BORDER }]}
            onPress={() => setPendingVerification(false)}
          >
            <Text style={[styles.backButtonText, { color: colors.TEXT.SECONDARY }]}>
              전화번호 다시 입력
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.LG,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.XL * 2,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  inputIcon: {
    marginRight: SPACING.MD,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderWidth: 1,
    borderRadius: 12,
  },
  button: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  buttonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});
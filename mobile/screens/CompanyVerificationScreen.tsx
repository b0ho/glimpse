import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { companyVerificationService, CompanyDomain } from '../services/companyVerificationService';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function CompanyVerificationScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [suggestions, setSuggestions] = useState<CompanyDomain[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<CompanyDomain | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleEmailChange = async (text: string) => {
    setEmail(text);
    
    const domain = companyVerificationService.extractDomain(text);
    if (domain && domain.length > 2) {
      try {
        const results = await companyVerificationService.searchCompanyDomains(domain);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectDomain = (domain: CompanyDomain) => {
    const emailUser = email.split('@')[0] || '';
    setEmail(`${emailUser}@${domain.domain}`);
    setSelectedDomain(domain);
    setShowSuggestions(false);
  };

  const sendVerificationEmail = async () => {
    if (!companyVerificationService.validateEmail(email)) {
      Alert.alert('오류', '올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await companyVerificationService.sendVerificationEmail(email);
      setStep('code');
      setTimer(1800); // 30분 = 1800초
      Alert.alert('성공', '인증 코드가 이메일로 전송되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.message || '이메일 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('오류', '6자리 인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await companyVerificationService.verifyEmailCode(email, verificationCode);
      if (success) {
        Alert.alert(
          '인증 완료',
          '회사 인증이 완료되었습니다. 이제 회사 그룹에 참여할 수 있습니다.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resendCode = async () => {
    if (timer > 0) {
      Alert.alert('알림', `${formatTime(timer)} 후에 다시 시도해주세요.`);
      return;
    }
    await sendVerificationEmail();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>회사 인증</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={60} color={COLORS.primary} />
          </View>

          <Text style={styles.description}>
            회사 이메일을 인증하면 회사 동료들과 함께{'\n'}
            특별한 그룹에서 만날 수 있습니다.
          </Text>

          {step === 'email' ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="회사 이메일 주소"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {selectedDomain && (
                  <View style={styles.selectedDomainBadge}>
                    <Text style={styles.selectedDomainText}>
                      {companyVerificationService.formatCompanyName(selectedDomain)}
                    </Text>
                  </View>
                )}
              </View>

              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>추천 회사 도메인</Text>
                  {suggestions.map((domain) => (
                    <TouchableOpacity
                      key={domain.id}
                      style={styles.suggestionItem}
                      onPress={() => selectDomain(domain)}
                    >
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionDomain}>@{domain.domain}</Text>
                        <Text style={styles.suggestionCompany}>
                          {companyVerificationService.formatCompanyName(domain)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, !email && styles.buttonDisabled]}
                onPress={sendVerificationEmail}
                disabled={!email || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>인증 코드 받기</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.codeSection}>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.codeDescription}>
                  위 이메일로 전송된 6자리 인증 코드를 입력해주세요.
                </Text>

                <View style={styles.codeInputContainer}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="000000"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {timer > 0 && (
                  <Text style={styles.timerText}>
                    남은 시간: {formatTime(timer)}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, verificationCode.length !== 6 && styles.buttonDisabled]}
                  onPress={verifyCode}
                  disabled={verificationCode.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>인증하기</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                  onPress={resendCode}
                  disabled={timer > 0}
                >
                  <Text style={[styles.resendButtonText, timer > 0 && styles.resendButtonTextDisabled]}>
                    인증 코드 다시 받기
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              인증 가능한 회사/학교 도메인만 지원됩니다.{'\n'}
              등록되지 않은 도메인은 고객센터로 문의해주세요.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: SIZES.padding * 2,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding * 0.75,
    ...FONTS.body3,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedDomainBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
  },
  selectedDomainText: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionsTitle: {
    ...FONTS.body4,
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionDomain: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  suggestionCompany: {
    ...FONTS.body4,
    color: COLORS.textLight,
    marginTop: 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  buttonText: {
    ...FONTS.body3,
    color: 'white',
  },
  codeSection: {
    alignItems: 'center',
  },
  emailText: {
    ...FONTS.body3,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  codeDescription: {
    ...FONTS.body4,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  codeInputContainer: {
    marginBottom: SIZES.padding,
  },
  codeInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    minWidth: 200,
  },
  timerText: {
    ...FONTS.body4,
    color: COLORS.error,
    marginBottom: SIZES.padding,
  },
  resendButton: {
    paddingVertical: SIZES.base,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: COLORS.textLight,
    textDecorationLine: 'none',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoBackground,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
  },
  infoText: {
    flex: 1,
    ...FONTS.body4,
    color: COLORS.info,
    marginLeft: SIZES.base,
    lineHeight: 20,
  },
});
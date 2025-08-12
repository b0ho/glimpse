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
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { companyVerificationService, CompanyDomain } from '../services/companyVerificationService';
import { FONTS, SIZES } from '../constants/theme';

export default function CompanyVerificationScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
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
      Alert.alert(t('common:errors.error'), t('companyVerification.email.invalidError'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await companyVerificationService.sendVerificationEmail(email);
      setStep('code');
      setTimer(1800); // 30분 = 1800초
      Alert.alert(t('common:status.success'), t('companyVerification.email.success'));
    } catch (error: any) {
      Alert.alert(t('common:errors.error'), error.message || t('companyVerification.email.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert(t('common:errors.error'), t('companyVerification.code.invalidError'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await companyVerificationService.verifyEmailCode(email, verificationCode);
      if (success) {
        Alert.alert(
          t('companyVerification.code.verifySuccess'),
          t('companyVerification.code.verifySuccessMessage'),
          [{ text: t('common:buttons.confirm'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert(t('common:errors.error'), error.message || t('companyVerification.code.verifyFailed'));
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
      Alert.alert(t('common:status.info'), t('companyVerification.code.resendWait', { time: formatTime(timer) }));
      return;
    }
    await sendVerificationEmail();
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>{t('companyVerification.title')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={60} color={colors.PRIMARY} />
          </View>

          <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
            {t('companyVerification.description')}
          </Text>

          {step === 'email' ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.SURFACE, 
                    color: colors.TEXT.PRIMARY,
                    borderColor: colors.BORDER 
                  }]}
                  placeholder={t('companyVerification.email.placeholder')}
                  placeholderTextColor={colors.TEXT.LIGHT}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {selectedDomain && (
                  <View style={[styles.selectedDomainBadge, { backgroundColor: colors.PRIMARY + '20' }]}>
                    <Text style={[styles.selectedDomainText, { color: colors.PRIMARY }]}>
                      {companyVerificationService.formatCompanyName(selectedDomain)}
                    </Text>
                  </View>
                )}
              </View>

              {showSuggestions && (
                <View style={[styles.suggestionsContainer, { 
                  backgroundColor: colors.SURFACE, 
                  borderColor: colors.BORDER 
                }]}>
                  <Text style={[styles.suggestionsTitle, { color: colors.TEXT.SECONDARY }]}>{t('companyVerification.suggestions.title')}</Text>
                  {suggestions.map((domain) => (
                    <TouchableOpacity
                      key={domain.id}
                      style={[styles.suggestionItem, { borderBottomColor: colors.BORDER }]}
                      onPress={() => selectDomain(domain)}
                    >
                      <View style={styles.suggestionContent}>
                        <Text style={[styles.suggestionDomain, { color: colors.TEXT.PRIMARY }]}>@{domain.domain}</Text>
                        <Text style={[styles.suggestionCompany, { color: colors.TEXT.SECONDARY }]}>
                          {companyVerificationService.formatCompanyName(domain)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.TEXT.SECONDARY} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.button, 
                  { backgroundColor: colors.PRIMARY },
                  !email && [styles.buttonDisabled, { backgroundColor: colors.DISABLED }]
                ]}
                onPress={sendVerificationEmail}
                disabled={!email || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.TEXT.WHITE} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.TEXT.WHITE }]}>{t('companyVerification.email.sendButton')}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.codeSection}>
                <Text style={[styles.emailText, { color: colors.TEXT.PRIMARY }]}>{email}</Text>
                <Text style={[styles.codeDescription, { color: colors.TEXT.SECONDARY }]}>
                  {t('companyVerification.code.description')}
                </Text>

                <View style={styles.codeInputContainer}>
                  <TextInput
                    style={[styles.codeInput, { 
                      backgroundColor: colors.SURFACE,
                      color: colors.TEXT.PRIMARY,
                      borderColor: colors.PRIMARY 
                    }]}
                    placeholder={t('companyVerification.code.placeholder')}
                    placeholderTextColor={colors.TEXT.LIGHT}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {timer > 0 && (
                  <Text style={[styles.timerText, { color: colors.ERROR }]}>
                    {t('companyVerification.code.timer', { time: formatTime(timer) })}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.button, 
                    { backgroundColor: colors.PRIMARY },
                    verificationCode.length !== 6 && [styles.buttonDisabled, { backgroundColor: colors.DISABLED }]
                  ]}
                  onPress={verifyCode}
                  disabled={verificationCode.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.TEXT.WHITE} />
                  ) : (
                    <Text style={[styles.buttonText, { color: colors.TEXT.WHITE }]}>{t('companyVerification.code.verifyButton')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                  onPress={resendCode}
                  disabled={timer > 0}
                >
                  <Text style={[
                    styles.resendButtonText, 
                    { color: colors.PRIMARY },
                    timer > 0 && [styles.resendButtonTextDisabled, { color: colors.TEXT.SECONDARY }]
                  ]}>
                    {t('companyVerification.code.resendButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={[styles.infoBox, { backgroundColor: colors.INFO + '20' }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.INFO} />
            <Text style={[styles.infoText, { color: colors.INFO }]}>
              {t('companyVerification.info.title')}
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
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  input: {
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding * 0.75,
    ...FONTS.body3,
    borderWidth: 1,
  },
  selectedDomainBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
  },
  selectedDomainText: {
    ...FONTS.body4,
  },
  suggestionsContainer: {
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    borderWidth: 1,
  },
  suggestionsTitle: {
    ...FONTS.body4,
    marginBottom: SIZES.base,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionDomain: {
    ...FONTS.body3,
  },
  suggestionCompany: {
    ...FONTS.body4,
    marginTop: 2,
  },
  button: {
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonDisabled: {
  },
  buttonText: {
    ...FONTS.body3,
  },
  codeSection: {
    alignItems: 'center',
  },
  emailText: {
    ...FONTS.body3,
    marginBottom: SIZES.base,
  },
  codeDescription: {
    ...FONTS.body4,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  codeInputContainer: {
    marginBottom: SIZES.padding,
  },
  codeInput: {
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    ...FONTS.h2,
    textAlign: 'center',
    letterSpacing: 10,
    borderWidth: 2,
    minWidth: 200,
  },
  timerText: {
    ...FONTS.body4,
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
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    textDecorationLine: 'none',
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
  },
  infoText: {
    flex: 1,
    ...FONTS.body4,
    marginLeft: SIZES.base,
    lineHeight: 20,
  },
});
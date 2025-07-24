import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { SMSVerificationScreen } from './SMSVerificationScreen';
import { NicknameSetupScreen } from './NicknameSetupScreen';
import { CompanyVerificationScreen } from './CompanyVerificationScreen';
import { COLORS } from '@/utils/constants';

type AuthStep = 'phone' | 'sms' | 'nickname' | 'company' | 'completed';

interface AuthScreenProps {
  onAuthCompleted: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthCompleted }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleVerificationSent = (phone: string): void => {
    setPhoneNumber(phone);
    setCurrentStep('sms');
  };

  const handleVerificationSuccess = (): void => {
    setCurrentStep('nickname');
  };

  const handleNicknameSet = (): void => {
    setCurrentStep('company');
  };

  const handleCompanyVerificationSubmitted = (): void => {
    setCurrentStep('completed');
    onAuthCompleted();
  };

  const handleBack = (): void => {
    if (currentStep === 'sms') {
      setCurrentStep('phone');
      setPhoneNumber('');
    } else if (currentStep === 'nickname') {
      setCurrentStep('sms');
    } else if (currentStep === 'company') {
      setCurrentStep('nickname');
    }
  };

  return (
    <View style={styles.container}>
      {currentStep === 'phone' && (
        <PhoneVerificationScreen onVerificationSent={handleVerificationSent} />
      )}
      
      {currentStep === 'sms' && (
        <SMSVerificationScreen
          phoneNumber={phoneNumber}
          onVerificationSuccess={handleVerificationSuccess}
          onBack={handleBack}
        />
      )}
      
      {currentStep === 'nickname' && (
        <NicknameSetupScreen
          onNicknameSet={handleNicknameSet}
        />
      )}
      
      {currentStep === 'company' && (
        <CompanyVerificationScreen
          onVerificationSubmitted={handleCompanyVerificationSubmitted}
          onSkip={handleCompanyVerificationSubmitted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});
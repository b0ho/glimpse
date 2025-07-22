import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { SMSVerificationScreen } from './SMSVerificationScreen';
import { NicknameSetupScreen } from './NicknameSetupScreen';
import { COLORS } from '@/utils/constants';

type AuthStep = 'phone' | 'sms' | 'nickname' | 'completed';

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
    setCurrentStep('completed');
    onAuthCompleted();
  };

  const handleBack = (): void => {
    if (currentStep === 'sms') {
      setCurrentStep('phone');
      setPhoneNumber('');
    } else if (currentStep === 'nickname') {
      setCurrentStep('sms');
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});
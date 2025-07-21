import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { SMSVerificationScreen } from './SMSVerificationScreen';
import { COLORS } from '@/utils/constants';

type AuthStep = 'phone' | 'sms' | 'completed';

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
    setCurrentStep('completed');
    onAuthCompleted();
  };

  const handleBack = (): void => {
    setCurrentStep('phone');
    setPhoneNumber('');
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});
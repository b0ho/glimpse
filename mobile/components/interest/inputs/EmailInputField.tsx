/**
 * 이메일 입력 컴포넌트
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface EmailInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  colors: any;
}

export const EmailInputField: React.FC<EmailInputFieldProps> = ({
  value,
  onChange,
  colors,
}) => {
  return (
    <View style={styles.container}>
      <CrossPlatformInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.BACKGROUND, 
            color: colors.TEXT.PRIMARY,
            borderColor: colors.BORDER,
          }
        ]}
        placeholder="example@email.com"
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={onChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
});
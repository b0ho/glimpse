/**
 * 전화번호 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { formatPhoneNumber } from '@/utils/interest/formValidation';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onContactPress?: () => void;
  colors: any;
  t: (key: string) => string;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  onChange,
  onContactPress,
  colors,
  t,
}) => {
  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChange(formatted);
  };

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
        placeholder="010-1234-5678"
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        maxLength={13}
        autoComplete="tel"
      />
      {onContactPress && (
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: colors.PRIMARY + '10' }]}
          onPress={onContactPress}
        >
          <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.contactButtonText, { color: colors.PRIMARY }]}>
            {t('interest:selectContact')}
          </Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
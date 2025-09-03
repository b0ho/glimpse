/**
 * 위치/인상착의 입력 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface LocationInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const LocationInputField: React.FC<LocationInputFieldProps> = ({
  value,
  onChange,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
        {t('interest:locationDescription')} *
      </Text>
      <Text style={[styles.helpText, { color: colors.TEXT.LIGHT }]}>
        {t('interest:locationHelp')}
      </Text>
      <CrossPlatformInput
        style={[
          styles.textArea,
          { 
            backgroundColor: colors.BACKGROUND, 
            color: colors.TEXT.PRIMARY,
            borderColor: colors.BORDER,
          }
        ]}
        placeholder={t('interest:locationPlaceholder')}
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, { color: colors.TEXT.LIGHT }]}>
        {value.length}/200
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
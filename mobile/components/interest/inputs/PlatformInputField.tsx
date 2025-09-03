/**
 * 플랫폼 입력 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface PlatformInputFieldProps {
  platformName: string;
  onPlatformNameChange: (value: string) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const PlatformInputField: React.FC<PlatformInputFieldProps> = ({
  platformName,
  onPlatformNameChange,
  userId,
  onUserIdChange,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:platformName')} *
        </Text>
        <CrossPlatformInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.BACKGROUND, 
              color: colors.TEXT.PRIMARY,
              borderColor: colors.BORDER,
            }
          ]}
          placeholder={t('interest:platformNamePlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={platformName}
          onChangeText={onPlatformNameChange}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:userId')} *
        </Text>
        <CrossPlatformInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.BACKGROUND, 
              color: colors.TEXT.PRIMARY,
              borderColor: colors.BORDER,
            }
          ]}
          placeholder={t('interest:userIdPlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={userId}
          onChangeText={onUserIdChange}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
});
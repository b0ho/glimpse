/**
 * 닉네임 입력 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface NicknameInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const NicknameInputField: React.FC<NicknameInputFieldProps> = ({
  value,
  onChange,
  description,
  onDescriptionChange,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:nickname')} *
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
          placeholder={t('interest:nicknamePlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={value}
          onChangeText={onChange}
          maxLength={20}
        />
        <Text style={[styles.charCount, { color: colors.TEXT.LIGHT }]}>
          {value.length}/20
        </Text>
      </View>

      {description !== undefined && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:additionalDescription')}
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
            placeholder={t('interest:descriptionPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: colors.TEXT.LIGHT }]}>
            {description.length}/100
          </Text>
        </View>
      )}
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
/**
 * 알바 정보 입력 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface PartTimeJobInputFieldProps {
  workplace: string;
  onWorkplaceChange: (value: string) => void;
  position?: string;
  onPositionChange?: (value: string) => void;
  nickname?: string;
  onNicknameChange?: (value: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const PartTimeJobInputField: React.FC<PartTimeJobInputFieldProps> = ({
  workplace,
  onWorkplaceChange,
  position,
  onPositionChange,
  nickname,
  onNicknameChange,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:workplace')} *
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
          placeholder={t('interest:workplacePlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={workplace}
          onChangeText={onWorkplaceChange}
        />
      </View>

      {position !== undefined && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:position')}
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
            placeholder={t('interest:positionPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={position}
            onChangeText={onPositionChange}
          />
        </View>
      )}

      {nickname !== undefined && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:nickname')}
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
            value={nickname}
            onChangeText={onNicknameChange}
          />
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
});
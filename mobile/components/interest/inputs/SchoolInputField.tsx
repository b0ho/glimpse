/**
 * 학교 정보 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface SchoolInputFieldProps {
  schoolName: string;
  onSchoolNameChange: (value: string) => void;
  selectedLevel?: string;
  onLevelSelect: (level: string) => void;
  major?: string;
  onMajorChange?: (value: string) => void;
  nickname?: string;
  onNicknameChange?: (value: string) => void;
  showAdditionalOptions?: boolean;
  colors: any;
  t: (key: string) => string;
}

const SCHOOL_LEVELS = [
  { id: 'middle', label: '중학교' },
  { id: 'high', label: '고등학교' },
  { id: 'university', label: '대학교' },
  { id: 'graduate', label: '대학원' },
];

export const SchoolInputField: React.FC<SchoolInputFieldProps> = ({
  schoolName,
  onSchoolNameChange,
  selectedLevel,
  onLevelSelect,
  major,
  onMajorChange,
  nickname,
  onNicknameChange,
  showAdditionalOptions = false,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
        {t('interest:schoolLevel')} *
      </Text>
      <View style={styles.levelButtons}>
        {SCHOOL_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelButton,
              {
                backgroundColor: selectedLevel === level.id 
                  ? colors.PRIMARY 
                  : colors.SURFACE,
                borderColor: selectedLevel === level.id 
                  ? colors.PRIMARY 
                  : colors.BORDER,
              }
            ]}
            onPress={() => onLevelSelect(level.id)}
          >
            <Text style={[
              styles.levelButtonText,
              { 
                color: selectedLevel === level.id 
                  ? colors.TEXT.WHITE 
                  : colors.TEXT.PRIMARY 
              }
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:schoolName')} *
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
          placeholder={t('interest:schoolPlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={schoolName}
          onChangeText={onSchoolNameChange}
        />
      </View>

      {(selectedLevel === 'university' || selectedLevel === 'graduate') && major !== undefined && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:major')}
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
            placeholder={t('interest:majorPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={major}
            onChangeText={onMajorChange}
          />
        </View>
      )}

      {showAdditionalOptions && nickname !== undefined && (
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
  levelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelButtonText: {
    fontSize: 14,
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
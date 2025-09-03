/**
 * 회사 정보 입력 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface CompanyInputFieldProps {
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  department?: string;
  onDepartmentChange?: (value: string) => void;
  nickname?: string;
  onNicknameChange?: (value: string) => void;
  showAdditionalOptions?: boolean;
  colors: any;
  t: (key: string) => string;
}

export const CompanyInputField: React.FC<CompanyInputFieldProps> = ({
  companyName,
  onCompanyNameChange,
  department,
  onDepartmentChange,
  nickname,
  onNicknameChange,
  showAdditionalOptions = false,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:companyName')} *
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
          placeholder={t('interest:companyPlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={companyName}
          onChangeText={onCompanyNameChange}
        />
      </View>

      {department !== undefined && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:department')}
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
            placeholder={t('interest:departmentPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={department}
            onChangeText={onDepartmentChange}
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
});
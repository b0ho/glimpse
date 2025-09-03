/**
 * 생년월일 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { Gender } from '@/types/interest';
import { formatBirthdate } from '@/utils/interest/formValidation';

interface BirthdateInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  selectedGender: Gender | null;
  onGenderSelect: (gender: Gender) => void;
  showAdditionalOptions: boolean;
  onToggleAdditionalOptions: () => void;
  birthdate?: string;
  onBirthdateChange?: (value: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const BirthdateInputField: React.FC<BirthdateInputFieldProps> = ({
  value,
  onChange,
  selectedGender,
  onGenderSelect,
  showAdditionalOptions,
  onToggleAdditionalOptions,
  birthdate,
  onBirthdateChange,
  colors,
  t,
}) => {
  const handleChange = (text: string) => {
    const formatted = formatBirthdate(text);
    onChange(formatted);
  };

  const handleBirthdateChange = (text: string) => {
    if (onBirthdateChange) {
      const formatted = formatBirthdate(text);
      onBirthdateChange(formatted);
    }
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
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={handleChange}
        keyboardType="numeric"
        maxLength={10}
      />
      
      <View style={styles.genderContainer}>
        <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:gender')} *
        </Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              { 
                backgroundColor: selectedGender === Gender.MALE ? colors.PRIMARY : colors.SURFACE,
                borderColor: selectedGender === Gender.MALE ? colors.PRIMARY : colors.BORDER,
              }
            ]}
            onPress={() => onGenderSelect(Gender.MALE)}
          >
            <Icon 
              name="male" 
              size={20} 
              color={selectedGender === Gender.MALE ? colors.TEXT.WHITE : colors.TEXT.SECONDARY} 
            />
            <Text style={[
              styles.genderButtonText,
              { color: selectedGender === Gender.MALE ? colors.TEXT.WHITE : colors.TEXT.PRIMARY }
            ]}>
              {t('interest:male')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.genderButton,
              { 
                backgroundColor: selectedGender === Gender.FEMALE ? colors.PRIMARY : colors.SURFACE,
                borderColor: selectedGender === Gender.FEMALE ? colors.PRIMARY : colors.BORDER,
              }
            ]}
            onPress={() => onGenderSelect(Gender.FEMALE)}
          >
            <Icon 
              name="female" 
              size={20} 
              color={selectedGender === Gender.FEMALE ? colors.TEXT.WHITE : colors.TEXT.SECONDARY} 
            />
            <Text style={[
              styles.genderButtonText,
              { color: selectedGender === Gender.FEMALE ? colors.TEXT.WHITE : colors.TEXT.PRIMARY }
            ]}>
              {t('interest:female')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.additionalOptionsButton, { backgroundColor: colors.SURFACE }]}
        onPress={onToggleAdditionalOptions}
      >
        <Icon 
          name={showAdditionalOptions ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.TEXT.SECONDARY} 
        />
        <Text style={[styles.additionalOptionsText, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:additionalInfo')}
        </Text>
      </TouchableOpacity>

      {showAdditionalOptions && birthdate !== undefined && (
        <View style={styles.additionalContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:exactBirthdate')}
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
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.TEXT.LIGHT}
            value={birthdate}
            onChangeText={handleBirthdateChange}
            keyboardType="numeric"
            maxLength={10}
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  genderContainer: {
    marginTop: 12,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  genderButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  additionalOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  additionalOptionsText: {
    marginLeft: 8,
    fontSize: 14,
  },
  additionalContainer: {
    marginTop: 12,
  },
});
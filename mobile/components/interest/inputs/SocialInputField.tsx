/**
 * 소셜 ID 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { SOCIAL_PLATFORM_OPTIONS } from '@/constants/interest/interestTypes';

interface SocialInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  selectedPlatform?: string;
  onPlatformSelect: (platform: string) => void;
  nickname?: string;
  onNicknameChange?: (value: string) => void;
  showAdditionalOptions: boolean;
  onToggleAdditionalOptions: () => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: 'male' | 'female' | 'other';
  onGenderSelect?: (gender: 'male' | 'female' | 'other') => void;
  colors: any;
  t: (key: string) => string;
}

export const SocialInputField: React.FC<SocialInputFieldProps> = ({
  value,
  onChange,
  selectedPlatform,
  onPlatformSelect,
  nickname,
  onNicknameChange,
  showAdditionalOptions,
  onToggleAdditionalOptions,
  name = '',
  onNameChange,
  selectedGender = 'male',
  onGenderSelect,
  colors,
  t,
}) => {
  const genderOptions = [
    { id: 'male' as const, label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'female' as const, label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'other' as const, label: t('common:gender.other'), icon: 'help-outline' },
  ];
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
        {t('interest:platform')} *
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.platformScroll}
      >
        {SOCIAL_PLATFORM_OPTIONS.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={[
              styles.platformButton,
              {
                backgroundColor: selectedPlatform === platform.id 
                  ? colors.PRIMARY 
                  : colors.SURFACE,
                borderColor: selectedPlatform === platform.id 
                  ? colors.PRIMARY 
                  : colors.BORDER,
              }
            ]}
            onPress={() => onPlatformSelect(platform.id)}
          >
            <Text style={[
              styles.platformButtonText,
              { 
                color: selectedPlatform === platform.id 
                  ? colors.TEXT.WHITE 
                  : colors.TEXT.PRIMARY 
              }
            ]}>
              {platform.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CrossPlatformInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.BACKGROUND, 
            color: colors.TEXT.PRIMARY,
            borderColor: colors.BORDER,
          }
        ]}
        placeholder={selectedPlatform === 'instagram' ? '@username' : 'username'}
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
      />

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

      {/* 이름 입력 필드 (선택) */}
      <View style={styles.nameSection}>
        <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
          {t('interest:labels.nameOptional')}
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
          placeholder={t('interest:placeholders.nameOptional')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={name}
          onChangeText={onNameChange}
          maxLength={50}
        />
        <Text style={[styles.hint, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:hints.nameDescription')}
        </Text>
      </View>

      {/* 성별 선택 */}
      <View style={styles.genderSection}>
        <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
          찾고자 하는 성별 <Text style={{ color: colors.ERROR }}>*</Text>
        </Text>
        <View style={styles.genderOptions}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.genderOption,
                {
                  backgroundColor: selectedGender === option.id 
                    ? colors.PRIMARY + '20' 
                    : colors.SURFACE,
                  borderColor: selectedGender === option.id 
                    ? colors.PRIMARY 
                    : colors.BORDER,
                }
              ]}
              onPress={() => onGenderSelect?.(option.id)}
            >
              <Icon 
                name={option.icon} 
                size={20} 
                color={selectedGender === option.id ? colors.PRIMARY : colors.TEXT.SECONDARY} 
              />
              <Text style={[
                styles.genderLabel,
                { 
                  color: selectedGender === option.id 
                    ? colors.PRIMARY 
                    : colors.TEXT.PRIMARY 
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  platformScroll: {
    marginBottom: 12,
  },
  platformButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  platformButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  additionalOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  additionalOptionsText: {
    marginLeft: 8,
    fontSize: 14,
  },
  additionalContainer: {
    marginTop: 12,
  },
  nameSection: {
    marginTop: 20,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  genderSection: {
    marginTop: 20,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
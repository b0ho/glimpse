/**
 * 소셜 ID 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { SOCIAL_PLATFORM_OPTIONS } from '@/constants/interest/interestTypes';
import { Gender } from '@/types';

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
  selectedGender?: Gender;
  onGenderSelect?: (gender: Gender) => void;
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
  selectedGender = 'MALE',
  onGenderSelect,
  t,
}) => {
  const genderOptions: Array<{ id: Gender; label: string; icon: string }> = [
    { id: 'MALE', label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'FEMALE', label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'OTHER', label: t('common:gender.other'), icon: 'help-outline' },
  ];
  return (
    <View className="container">
      <Text className="label">
        {t('interest:platform')} *
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="platformScroll"
      >
        {SOCIAL_PLATFORM_OPTIONS.map((platform) => (
          <TouchableOpacity
            key={platform.value}
            className="platformButton"
            onPress={() => onPlatformSelect(platform.value)}
          >
            <Text className="platformButtonText">
              {platform.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CrossPlatformInput
        className="input"
        placeholder={selectedPlatform === 'instagram' ? '@username' : 'username'}
        placeholderTextColor="#D1D5DB"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
      />

      <TouchableOpacity
        className="additionalOptionsButton"
        onPress={onToggleAdditionalOptions}
      >
        <Icon 
          name={showAdditionalOptions ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
        <Text className="additionalOptionsText">
          {t('interest:additionalInfo')}
        </Text>
      </TouchableOpacity>

      {/* 이름 입력 필드 (선택) */}
      <View className="nameSection">
        <Text className="label">
          {t('interest:labels.nameOptional')}
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder={t('interest:placeholders.nameOptional')}
          placeholderTextColor="#D1D5DB"
          value={name}
          onChangeText={onNameChange}
          maxLength={50}
        />
        <Text className="hint">
          {t('interest:hints.nameDescription')}
        </Text>
      </View>

      {/* 성별 선택 */}
      <View className="genderSection">
        <Text className="label">
          찾고자 하는 성별 <Text style={{ color: "#EF4444" }}>*</Text>
        </Text>
        <View className="genderOptions">
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              className="genderOption"
              onPress={() => onGenderSelect?.(option.id)}
            >
              <Icon 
                name={option.icon} 
                size={20} 
                color={selectedGender === option.id ? "#3B82F6" : "#6B7280"} 
              />
              <Text className="genderLabel">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};


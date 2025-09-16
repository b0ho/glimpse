/**
 * 위치/인상착의 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface LocationInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: 'male' | 'female' | 'other';
  onGenderSelect?: (gender: 'male' | 'female' | 'other') => void;
  colors: any;
  t: (key: string) => string;
}

export const LocationInputField: React.FC<LocationInputFieldProps> = ({
  value,
  onChange,
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
    <View className="container">
      <Text className="label">
        {t('interest:locationDescription')} *
      </Text>
      <Text className="helpText">
        {t('interest:locationHelp')}
      </Text>
      <CrossPlatformInput
        className="textArea"
        placeholder={t('interest:locationPlaceholder')}
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <Text className="charCount">
        {value.length}/200
      </Text>

      {/* 이름 입력 필드 (선택) */}
      <View className="nameSection">
        <Text className="label">
          {t('interest:labels.nameOptional')}
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder={t('interest:placeholders.nameOptional')}
          placeholderTextColor={colors.TEXT.LIGHT}
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
          찾고자 하는 성별 <Text style={{ color: colors.ERROR }}>*</Text>
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
                color={selectedGender === option.id ? colors.PRIMARY : colors.TEXT.SECONDARY} 
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


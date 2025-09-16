/**
 * 전화번호 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { formatPhoneNumber } from '@/utils/interest/formValidation';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onContactPress?: () => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: 'male' | 'female' | 'other';
  onGenderSelect?: (gender: 'male' | 'female' | 'other') => void;
  colors: any;
  t: (key: string) => string;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  onChange,
  onContactPress,
  name = '',
  onNameChange,
  selectedGender = 'male',
  onGenderSelect,
  colors,
  t,
}) => {
  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChange(formatted);
  };

  const genderOptions = [
    { id: 'male' as const, label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'female' as const, label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'other' as const, label: t('common:gender.other'), icon: 'help-outline' },
  ];

  return (
    <View className="container">
      <Text className="label">
        {t('interest:placeholders.phone')}
      </Text>
      <CrossPlatformInput
        className="input"
        placeholder="010-1234-5678"
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        maxLength={13}
        autoComplete="tel"
      />
      {onContactPress && (
        <TouchableOpacity
          className="contactButton"
          onPress={onContactPress}
        >
          <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
          <Text className="contactButtonText">
            {t('interest:selectContact')}
          </Text>
        </TouchableOpacity>
      )}
      
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


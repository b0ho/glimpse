/**
 * 닉네임 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface NicknameInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: 'male' | 'female' | 'other';
  onGenderSelect?: (gender: 'male' | 'female' | 'other') => void;
  colors: any;
  t: (key: string) => string;
}

export const NicknameInputField: React.FC<NicknameInputFieldProps> = ({
  value,
  onChange,
  description,
  onDescriptionChange,
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
      <View className="fieldContainer">
        <Text className="label">
          {t('interest:nickname')} *
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder={t('interest:nicknamePlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={value}
          onChangeText={onChange}
          maxLength={20}
        />
        <Text className="charCount">
          {value.length}/20
        </Text>
      </View>

      {description !== undefined && (
        <View className="fieldContainer">
          <Text className="label">
            {t('interest:additionalDescription')}
          </Text>
          <CrossPlatformInput
            className="textArea"
            placeholder={t('interest:descriptionPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={100}
          />
          <Text className="charCount">
            {description.length}/100
          </Text>
        </View>
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


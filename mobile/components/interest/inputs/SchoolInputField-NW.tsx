/**
 * 학교 정보 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';

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
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: 'male' | 'female' | 'other';
  onGenderSelect?: (gender: 'male' | 'female' | 'other') => void;
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
        {t('interest:schoolLevel')} *
      </Text>
      <View className="levelButtons">
        {SCHOOL_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            className="levelButton"
            onPress={() => onLevelSelect(level.id)}
          >
            <Text className="levelButtonText">
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="fieldContainer">
        <Text className="label">
          {t('interest:schoolName')} *
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder={t('interest:schoolPlaceholder')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={schoolName}
          onChangeText={onSchoolNameChange}
        />
      </View>

      {(selectedLevel === 'university' || selectedLevel === 'graduate') && major !== undefined && (
        <View className="fieldContainer">
          <Text className="label">
            {t('interest:major')}
          </Text>
          <CrossPlatformInput
            className="input"
            placeholder={t('interest:majorPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={major}
            onChangeText={onMajorChange}
          />
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


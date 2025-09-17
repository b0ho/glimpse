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
  t,
}) => {
  const genderOptions = [
    { id: 'male' as const, label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'female' as const, label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'other' as const, label: t('common:gender.other'), icon: 'help-outline' },
  ];
  return (
    <View className="space-y-4">
      <View className="space-y-3">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:schoolLevel')} *
        </Text>
        <View className="flex-row flex-wrap space-x-2">
          {SCHOOL_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => onLevelSelect(level.id)}
              style={{
                backgroundColor: selectedLevel === level.id ? '#EF4444' : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: selectedLevel === level.id ? '#EF4444' : '#D1D5DB',
                marginBottom: 8
              }}
            >
              <Text 
                style={{
                  color: selectedLevel === level.id ? '#FFFFFF' : '#6B7280',
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="space-y-2">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:schoolName')} *
        </Text>
        <CrossPlatformInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={t('interest:schoolPlaceholder')}
          placeholderTextColor="#D1D5DB"
          value={schoolName}
          onChangeText={onSchoolNameChange}
        />
      </View>

      {(selectedLevel === 'university' || selectedLevel === 'graduate') && major !== undefined && (
        <View className="space-y-2">
          <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
            {t('interest:major')}
          </Text>
          <CrossPlatformInput
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
            placeholder={t('interest:majorPlaceholder')}
            placeholderTextColor="#D1D5DB"
            value={major}
            onChangeText={onMajorChange}
          />
        </View>
      )}

      {/* 이름 입력 필드 (선택) */}
      <View className="space-y-2">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:labels.nameOptional')}
        </Text>
        <CrossPlatformInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={t('interest:placeholders.nameOptional')}
          placeholderTextColor="#D1D5DB"
          value={name}
          onChangeText={onNameChange}
          maxLength={50}
        />
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {t('interest:hints.nameDescription')}
        </Text>
      </View>

      {/* 성별 선택 */}
      <View className="space-y-3">
        <Text className="text-base font-medium text-gray-900 dark:text-white">
          찾고자 하는 성별 <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row space-x-3">
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              className="flex-row items-center space-x-2 flex-1"
              onPress={() => onGenderSelect?.(option.id)}
              style={{
                backgroundColor: selectedGender === option.id ? '#EF4444' : 'transparent',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedGender === option.id ? '#EF4444' : '#D1D5DB'
              }}
            >
              <Icon 
                name={option.icon} 
                size={20} 
                color={selectedGender === option.id ? '#FFFFFF' : '#6B7280'} 
              />
              <Text 
                style={{
                  color: selectedGender === option.id ? '#FFFFFF' : '#6B7280',
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};


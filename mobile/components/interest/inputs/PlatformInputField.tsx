/**
 * 플랫폼 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { Gender } from '@/types';

interface PlatformInputFieldProps {
  platformName: string;
  onPlatformNameChange: (value: string) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: Gender;
  onGenderSelect?: (gender: Gender) => void;
  t: (key: string) => string;
}

export const PlatformInputField: React.FC<PlatformInputFieldProps> = ({
  platformName,
  onPlatformNameChange,
  userId,
  onUserIdChange,
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
    <View className="space-y-4">
      <View className="space-y-2">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:platformName')} *
        </Text>
        <CrossPlatformInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={t('interest:platformNamePlaceholder')}
          placeholderTextColor="#D1D5DB"
          value={platformName}
          onChangeText={onPlatformNameChange}
        />
      </View>

      <View className="space-y-2">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:userId')} *
        </Text>
        <CrossPlatformInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={t('interest:userIdPlaceholder')}
          placeholderTextColor="#D1D5DB"
          value={userId}
          onChangeText={onUserIdChange}
          autoCapitalize="none"
        />
      </View>

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


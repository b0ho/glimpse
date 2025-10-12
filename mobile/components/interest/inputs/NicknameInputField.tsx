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
  t,
}) => {
  const genderOptions = [
    { id: 'male' as const, label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'female' as const, label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'other' as const, label: t('common:gender.other'), icon: 'help-outline' },
  ];

  return (
    <View className="space-y-4">
      <View>
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:nickname')} *
        </Text>
        <CrossPlatformInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={t('interest:nicknamePlaceholder')}
          placeholderTextColor="#D1D5DB"
          value={value}
          onChangeText={onChange}
          maxLength={20}
        />
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-right">
          {value.length}/20
        </Text>
      </View>

      {description !== undefined && (
        <View>
          <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
            {t('interest:additionalDescription')}
          </Text>
          <CrossPlatformInput
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white min-h-[80px]"
            placeholder={t('interest:descriptionPlaceholder')}
            placeholderTextColor="#D1D5DB"
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={100}
          />
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-right">
            {description.length}/100
          </Text>
        </View>
      )}

      {/* 이름 입력 필드 (선택) */}
      <View className="mt-4">
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
        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('interest:hints.nameDescription')}
        </Text>
      </View>

      {/* 성별 선택 */}
      <View className="mt-4">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          찾고자 하는 성별 <Text className="text-red-500">*</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selectedGender === option.id ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 1,
                borderColor: selectedGender === option.id ? '#EF4444' : '#D1D5DB',
                borderRadius: 8,
                paddingVertical: 12
              }}
              onPress={() => onGenderSelect?.(option.id)}
            >
              <Icon 
                name={option.icon} 
                size={20} 
                color={selectedGender === option.id ? "#EF4444" : "#6B7280"} 
              />
              <Text className="ml-2 text-gray-900 dark:text-white font-medium">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};


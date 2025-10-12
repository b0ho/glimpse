/**
 * 전화번호 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { formatPhoneNumber } from '@/utils/interest/formValidation';
import { Gender } from '@/types';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onContactPress?: () => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: Gender;
  onGenderSelect?: (gender: Gender) => void;
  t: (key: string) => string;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  onChange,
  onContactPress,
  name = '',
  onNameChange,
  selectedGender = 'MALE',
  onGenderSelect,
  t,
}) => {
  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChange(formatted);
  };

  const genderOptions: Array<{ id: Gender; label: string; icon: string }> = [
    { id: 'MALE', label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'FEMALE', label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'OTHER', label: t('common:gender.other'), icon: 'help-outline' },
  ];

  return (
    <View className="space-y-4">
      <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
        {t('interest:placeholders.phone')}
      </Text>
      <CrossPlatformInput
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
        placeholder="010-1234-5678"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        maxLength={13}
        autoComplete="tel"
      />
      {onContactPress && (
        <TouchableOpacity
          className="flex-row items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-2"
          onPress={onContactPress}
        >
          <Icon name="person-add-outline" size={20} color="#EF4444" />
          <Text className="text-red-600 dark:text-red-400 ml-2 font-medium">
            {t('interest:selectContact')}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* 이름 입력 필드 (선택) */}
      <View className="mt-4">
        <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {t('interest:labels.nameOptional')}
        </Text>
        <CrossPlatformInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={t('interest:placeholders.nameOptional')}
          placeholderTextColor="#9CA3AF"
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


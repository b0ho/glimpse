/**
 * 기간 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface DurationSelectorProps {
  selectedDuration: '3days' | '2weeks' | 'unlimited';
  onDurationSelect: (duration: '3days' | '2weeks' | 'unlimited') => void;
  expiresAt: Date;
  onExpiresAtChange: (date: Date) => void;
  isUnlimitedAllowed: boolean;
  t: (key: string) => string;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationSelect,
  expiresAt,
  onExpiresAtChange,
  isUnlimitedAllowed,
  t,
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const durationOptions = [
    { 
      id: '3days' as const, 
      label: t('interest:duration.3days'),
      description: t('interest:duration.3daysDesc'),
      icon: 'time-outline',
      isPremium: false,
    },
    { 
      id: '2weeks' as const, 
      label: t('interest:duration.2weeks'),
      description: t('interest:duration.2weeksDesc'),
      icon: 'calendar-outline',
      isPremium: false,
    },
    { 
      id: 'unlimited' as const, 
      label: t('interest:duration.unlimited'),
      description: t('interest:duration.unlimitedDesc'),
      icon: 'infinite-outline',
      isPremium: true,
    },
  ];

  const handleDurationChange = (duration: '3days' | '2weeks' | 'unlimited') => {
    onDurationSelect(duration);
    
    const now = new Date();
    let newDate = new Date();
    
    switch (duration) {
      case '3days':
        newDate.setDate(now.getDate() + 3);
        break;
      case '2weeks':
        newDate.setDate(now.getDate() + 14);
        break;
      case 'unlimited':
        newDate.setFullYear(now.getFullYear() + 100);
        break;
    }
    
    onExpiresAtChange(newDate);
  };

  const handleDateChange = () => {
    // 웹에서는 기본 날짜 입력 사용
    // 네이티브에서만 DateTimePicker 사용
    alert('날짜 선택 기능은 모바일 앱에서 사용 가능합니다');
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('interest:selectDuration')}
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {durationOptions.map((option) => {
          const isDisabled = option.isPremium && !isUnlimitedAllowed;
          const isSelected = selectedDuration === option.id;
          
          return (
            <TouchableOpacity
              key={option.id}
              style={{ 
                flex: 1, 
                minWidth: 100, 
                backgroundColor: isSelected ? '#3B82F6' : '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 2,
                borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                opacity: isDisabled ? 0.5 : 1
              }}
              onPress={() => !isDisabled && handleDurationChange(option.id)}
              disabled={isDisabled}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Icon 
                  name={option.icon} 
                  size={24} 
                  color={isSelected ? "#3B82F6" : "#6B7280"} 
                />
                {option.isPremium && (
                  <View className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    <Text className="text-xs font-bold text-yellow-800 dark:text-yellow-200">
                      PRO
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-1">
                {option.label}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {option.description}
              </Text>
              {isSelected && (
                <Icon 
                  name="checkmark-circle" 
                  size={20} 
                  color="#3B82F6" 
                  className="absolute top-2 right-2"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDuration !== 'unlimited' && (
        <TouchableOpacity
          className="flex-row items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-3"
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar" size={20} color="#3B82F6" />
          <Text className="text-gray-700 dark:text-gray-300 ml-2">
            {t('interest:customDate')}: {expiresAt.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      )}

      {/* 날짜 선택기는 네이티브 플랫폼에서만 사용 가능 */}
      {showDatePicker && Platform.OS !== 'web' && (
        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
          날짜 선택 기능은 모바일 앱에서만 사용 가능합니다
        </Text>
      )}
    </View>
  );
};


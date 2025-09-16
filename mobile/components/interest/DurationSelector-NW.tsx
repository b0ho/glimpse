/**
 * 기간 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity Platform } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface DurationSelectorProps {
  selectedDuration: '3days' | '2weeks' | 'unlimited';
  onDurationSelect: (duration: '3days' | '2weeks' | 'unlimited') => void;
  expiresAt: Date;
  onExpiresAtChange: (date: Date) => void;
  isUnlimitedAllowed: boolean;
  colors: any;
  t: (key: string) => string;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationSelect,
  expiresAt,
  onExpiresAtChange,
  isUnlimitedAllowed,
  colors,
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
    <View className="container">
      <Text className="title">
        {t('interest:selectDuration')}
      </Text>
      
      <View className="optionsContainer">
        {durationOptions.map((option) => {
          const isDisabled = option.isPremium && !isUnlimitedAllowed;
          const isSelected = selectedDuration === option.id;
          
          return (
            <TouchableOpacity
              key={option.id}
              className="optionCard"
              onPress={() => !isDisabled && handleDurationChange(option.id)}
              disabled={isDisabled}
            >
              <View className="optionHeader">
                <Icon 
                  name={option.icon} 
                  size={24} 
                  color={isSelected ? colors.PRIMARY : colors.TEXT.SECONDARY} 
                />
                {option.isPremium && (
                  <View className="premiumBadge">
                    <Text className="premiumBadgeText">
                      PRO
                    </Text>
                  </View>
                )}
              </View>
              <Text className="optionLabel">
                {option.label}
              </Text>
              <Text className="optionDescription">
                {option.description}
              </Text>
              {isSelected && (
                <Icon 
                  name="checkmark-circle" 
                  size={20} 
                  color={colors.PRIMARY} 
                  className="checkIcon"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDuration !== 'unlimited' && (
        <TouchableOpacity
          className="customDateButton"
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar" size={20} color={colors.PRIMARY} />
          <Text className="customDateText">
            {t('interest:customDate')}: {expiresAt.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      )}

      {/* 날짜 선택기는 네이티브 플랫폼에서만 사용 가능 */}
      {showDatePicker && Platform.OS !== 'web' && (
        <Text className="datePickerText">
          날짜 선택 기능은 모바일 앱에서만 사용 가능합니다
        </Text>
      )}
    </View>
  );
};


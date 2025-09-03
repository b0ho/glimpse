/**
 * 기간 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
        {t('interest:selectDuration')}
      </Text>
      
      <View style={styles.optionsContainer}>
        {durationOptions.map((option) => {
          const isDisabled = option.isPremium && !isUnlimitedAllowed;
          const isSelected = selectedDuration === option.id;
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected ? colors.PRIMARY + '10' : colors.SURFACE,
                  borderColor: isSelected ? colors.PRIMARY : colors.BORDER,
                  opacity: isDisabled ? 0.5 : 1,
                }
              ]}
              onPress={() => !isDisabled && handleDurationChange(option.id)}
              disabled={isDisabled}
            >
              <View style={styles.optionHeader}>
                <Icon 
                  name={option.icon} 
                  size={24} 
                  color={isSelected ? colors.PRIMARY : colors.TEXT.SECONDARY} 
                />
                {option.isPremium && (
                  <View style={[styles.premiumBadge, { backgroundColor: colors.PREMIUM }]}>
                    <Text style={[styles.premiumBadgeText, { color: colors.TEXT.WHITE }]}>
                      PRO
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.optionLabel,
                { color: isSelected ? colors.PRIMARY : colors.TEXT.PRIMARY }
              ]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.TEXT.SECONDARY }]}>
                {option.description}
              </Text>
              {isSelected && (
                <Icon 
                  name="checkmark-circle" 
                  size={20} 
                  color={colors.PRIMARY} 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDuration !== 'unlimited' && (
        <TouchableOpacity
          style={[styles.customDateButton, { backgroundColor: colors.SURFACE }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar" size={20} color={colors.PRIMARY} />
          <Text style={[styles.customDateText, { color: colors.TEXT.PRIMARY }]}>
            {t('interest:customDate')}: {expiresAt.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      )}

      {/* 날짜 선택기는 네이티브 플랫폼에서만 사용 가능 */}
      {showDatePicker && Platform.OS !== 'web' && (
        <Text style={[styles.datePickerText, { color: colors.TEXT.SECONDARY }]}>
          날짜 선택 기능은 모바일 앱에서만 사용 가능합니다
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    position: 'relative',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
  },
  premiumBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  customDateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  datePickerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
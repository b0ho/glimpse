/**
 * 관심상대 유형 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { InterestType } from '@/types/interest';
import { INTEREST_TYPE_CONFIG } from '@/constants/interest/interestTypes';
import { cn } from '@/lib/utils';

interface InterestTypeSelectorProps {
  selectedType: InterestType | null;
  onTypeSelect: (type: InterestType) => void;
  t: (key: string) => string;
}

export const InterestTypeSelector: React.FC<InterestTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  t,
}) => {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {t('interest:selectMethodTitle')}
      </Text>
      <ScrollView 
        contentContainerClassName="flex-row flex-wrap justify-between"
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_TYPE_CONFIG.map((config) => (
          <TouchableOpacity
            key={config.type}
            className={cn(
              "w-[48%] bg-white dark:bg-gray-800 rounded-xl p-4 mb-3",
              "border-2",
              selectedType === config.type
                ? "border-red-500"
                : "border-gray-200 dark:border-gray-700"
            )}
            onPress={() => onTypeSelect(config.type)}
            activeOpacity={0.7}
          >
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mb-2">
                <Icon
                  name={config.icon}
                  size={24}
                  color={config.color}
                />
              </View>
              <Text className="text-sm text-gray-700 dark:text-gray-300 text-center">
                {t(`interest:types.${config.type}`)}
              </Text>
              {selectedType === config.type && (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                  <Icon name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};


/**
 * 빈 섹션 표시 컴포넌트 - NativeWind 버전
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { cn } from '@/lib/utils';

interface EmptySectionProps {
  title: string;
  description: string;
  type: 'search' | 'match';
  colors?: any;
  onAddPress?: () => void;
  t: (key: string) => string;
}

export const EmptySection: React.FC<EmptySectionProps> = ({
  title,
  description,
  type,
  onAddPress,
  t,
}) => {
  return (
    <View
      className="p-10 items-center rounded-xl mx-4 my-2 bg-white dark:bg-gray-800 shadow-xl self-stretch"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        maxWidth: 600,
      }}
    >
      <Icon
        name={type === 'search' ? 'search-outline' : 'heart-outline'}
        size={48}
        color="#9CA3AF"
      />
      <Text className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100 text-center w-full px-4">
        {title}
      </Text>
      <Text className="text-sm text-center leading-5 text-gray-600 dark:text-gray-400 w-full px-8" style={{ maxWidth: 280 }}>
        {description}
      </Text>
      {type === 'search' && onAddPress && (
        <TouchableOpacity
          className={cn(
            "flex-row items-center justify-center px-5 py-2.5 rounded-full mt-5 shadow-lg",
            "bg-primary dark:bg-primary-dark"
          )}
          onPress={onAddPress}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
            minWidth: 140,
          }}
        >
          <Icon name="add-outline" size={20} color="#FFFFFF" />
          <Text className="text-sm font-semibold ml-2 text-white" style={{ whiteSpace: 'nowrap' }}>
            {t('search.addNew')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
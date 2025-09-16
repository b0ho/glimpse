/**
 * 공통 빈 상태 컴포넌트 - NativeWind v4
 */
import React from 'react';
import { View, Text } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  action,
}) => {
  const { colors } = useTheme();
  
  return (
    <View className="flex-1 justify-center items-center p-8">
      <Icon name={icon} size={64} color={colors.TEXT.LIGHT} />
      <Text className="text-lg font-semibold mt-4 text-center text-gray-900 dark:text-white">
        {title}
      </Text>
      {description && (
        <Text className="text-sm mt-2 text-center leading-5 text-gray-600 dark:text-gray-400">
          {description}
        </Text>
      )}
      {action && (
        <View className="mt-6">
          {action}
        </View>
      )}
    </View>
  );
};
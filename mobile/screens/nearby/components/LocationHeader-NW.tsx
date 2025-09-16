import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface LocationHeaderProps {
  address?: string;
  nearbyCount: number;
  onRefresh: () => void;
}

export const LocationHeader = ({
  address,
  nearbyCount,
  onRefresh,
}) => {
  const { t } = useAndroidSafeTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <View className={cn(
      "flex-row justify-between items-center px-5 py-3 border-b",
"bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
    )}>
      <View className="flex-1 flex-row items-center">
        <Icon 
          name="location" 
          size={20} 
          color="#2563EB" 
        />
        <Text 
          className={cn(
            "ml-2 flex-1 text-base",
"text-gray-900 dark:text-white"
          )}
          numberOfLines={1}
        >
          {address || t('nearbyusers:location.loading')}
        </Text>
      </View>
      <TouchableOpacity onPress={onRefresh} className="p-2">
        <Icon 
          name="refresh" 
          size={20} 
          color="#2563EB" 
        />
      </TouchableOpacity>
    </View>
  );
};
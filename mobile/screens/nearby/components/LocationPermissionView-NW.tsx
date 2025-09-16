import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface LocationPermissionViewProps {
  isLoading: boolean;
  onRequestPermission: () => void;
}

export const LocationPermissionView = ({
  isLoading,
  onRequestPermission,
}) => {
  const { t } = useAndroidSafeTranslation();
  const { colors, isDarkMode } = useTheme();
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator 
          size="large" 
          color="#2563EB" 
        />
        <Text className={cn(
          "mt-3 text-base",
"text-gray-600 dark:text-gray-400"
        )}>
          {t('nearbyusers:permission.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center p-6">
      <Icon 
        name="location-outline" 
        size={80} 
        color={colors.PRIMARY} 
      />
      <Text className={cn(
        "text-xl font-bold mt-5 mb-2",
"text-gray-900 dark:text-white"
      )}>
        {t('nearbyusers:permission.title')}
      </Text>
      <Text className={cn(
        "text-base text-center mb-6 leading-6",
        "text-gray-600 dark:text-gray-400"
      )}>
        {t('nearbyusers:permission.description')}
      </Text>
      <TouchableOpacity 
        className="bg-blue-500 px-6 py-3 rounded-full"
        onPress={onRequestPermission}
      >
        <Text className="text-white text-base font-semibold">
          {t('nearbyusers:permission.allowButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
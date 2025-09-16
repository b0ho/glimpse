import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface RadiusSelectorProps {
  radiusOptions: number[];
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
}

export const RadiusSelector = ({
  radiusOptions,
  selectedRadius,
  onRadiusChange,
}) => {
  const { t } = useAndroidSafeTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <View className="py-3 px-5 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <Text className="text-sm mb-2 text-gray-600 dark:text-gray-400">
        {t('nearbyusers:radius.label')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {radiusOptions.map((radius) => (
            <TouchableOpacity
              key={radius}
              className={cn(
                "px-5 py-2 rounded-full border",
                selectedRadius === radius 
                  ? "bg-blue-500 border-blue-500" 
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              )}
              onPress={() => onRadiusChange(radius)}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  selectedRadius === radius 
                    ? "text-white" 
                    : "text-gray-900 dark:text-gray-300"
                )}
              >
                {t('nearbyusers:radius.distance', { distance: radius })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
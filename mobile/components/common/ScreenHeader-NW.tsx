/**
 * 공통 스크린 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useNavigation } from '@react-navigation/native';

interface ScreenHeaderProps {
  title?: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
  colors?: any; // Optional for backward compatibility
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBackPress,
  rightComponent,
  showBackButton = true,
  colors, // No longer used with NativeWind
}) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Icon name="arrow-back" size={24} color={colors?.TEXT?.PRIMARY || '#000000'} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
      
      {title && (
        <Text className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-center">
          {title}
        </Text>
      )}
      
      {rightComponent ? (
        <View className="min-w-[40px]">
          {rightComponent}
        </View>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
};


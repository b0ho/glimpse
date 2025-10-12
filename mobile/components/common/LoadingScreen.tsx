/**
 * 공통 로딩 스크린 컴포넌트 - NativeWind v4
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
}) => {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.PRIMARY} />
        {message && (
          <Text className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};
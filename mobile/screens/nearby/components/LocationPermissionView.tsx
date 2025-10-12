/**
 * 위치 권한 요청 뷰 컴포넌트 (NativeWind v4 버전)
 *
 * @module LocationPermissionView
 * @description 위치 권한이 없을 때 표시되는 권한 요청 화면 컴포넌트
 */
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

/**
 * LocationPermissionView Props 인터페이스
 *
 * @interface LocationPermissionViewProps
 */
interface LocationPermissionViewProps {
  /** 로딩 상태 */
  isLoading: boolean;
  /** 위치 권한 요청 콜백 함수 */
  onRequestPermission: () => void;
}

/**
 * 위치 권한 요청 뷰 컴포넌트
 *
 * @component
 * @param {LocationPermissionViewProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 위치 권한 요청 UI
 *
 * @description
 * 사용자에게 위치 권한이 필요한 이유를 설명하고 권한을 요청하는 화면을 표시합니다.
 * - 로딩 상태일 때 ActivityIndicator 표시
 * - 위치 아이콘과 설명 텍스트
 * - 권한 허용 버튼
 * - 다크모드 지원
 *
 * @example
 * ```tsx
 * <LocationPermissionView
 *   isLoading={false}
 *   onRequestPermission={requestLocationPermission}
 * />
 * ```
 *
 * @category Component
 * @subcategory Nearby
 */
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
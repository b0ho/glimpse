/**
 * 위치 헤더 컴포넌트 (NativeWind v4 버전)
 *
 * @module LocationHeader
 * @description 현재 위치 정보를 표시하고 새로고침 기능을 제공하는 헤더 컴포넌트
 */
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

/**
 * LocationHeader Props 인터페이스
 *
 * @interface LocationHeaderProps
 */
interface LocationHeaderProps {
  /** 현재 위치의 주소 정보 */
  address?: string;
  /** 주변 항목 수 (현재 미사용) */
  nearbyCount: number;
  /** 위치 정보 새로고침 콜백 함수 */
  onRefresh: () => void;
}

/**
 * 위치 헤더 컴포넌트
 *
 * @component
 * @param {LocationHeaderProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 위치 정보와 새로고침 버튼이 포함된 헤더
 *
 * @description
 * 현재 위치 정보를 아이콘과 함께 표시하고, 사용자가 위치를 새로고침할 수 있는 버튼을 제공합니다.
 * - 위치 아이콘과 주소 표시
 * - 새로고침 버튼
 * - 다크모드 지원
 *
 * @example
 * ```tsx
 * <LocationHeader
 *   address="서울특별시 강남구"
 *   nearbyCount={5}
 *   onRefresh={() => updateLocation()}
 * />
 * ```
 *
 * @category Component
 * @subcategory Nearby
 */
export const LocationHeader = ({
  address,
  nearbyCount,
  onRefresh,
}) => {
  const { t } = useAndroidSafeTranslation();
  const { isDark } = useTheme();
  
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
/**
 * 반경 선택 컴포넌트 (NativeWind v4 버전)
 *
 * @module RadiusSelector
 * @description 주변 검색 반경을 선택할 수 있는 컴포넌트
 */
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

/**
 * RadiusSelector Props 인터페이스
 *
 * @interface RadiusSelectorProps
 */
interface RadiusSelectorProps {
  /** 선택 가능한 반경 옵션 배열 (km 단위) */
  radiusOptions: number[];
  /** 현재 선택된 반경 (km) */
  selectedRadius: number;
  /** 반경 변경 콜백 함수 */
  onRadiusChange: (radius: number) => void;
}

/**
 * 반경 선택 컴포넌트
 *
 * @component
 * @param {RadiusSelectorProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 반경 선택 UI
 *
 * @description
 * 주변 검색 반경을 선택할 수 있는 수평 스크롤 가능한 버튼 그룹을 제공합니다.
 * - 여러 반경 옵션 표시 (예: 1km, 2km, 5km, 10km)
 * - 선택된 반경 강조 표시
 * - 수평 스크롤 지원
 * - 다크모드 지원
 *
 * @example
 * ```tsx
 * <RadiusSelector
 *   radiusOptions={[1, 2, 5, 10]}
 *   selectedRadius={2}
 *   onRadiusChange={(radius) => setRadius(radius)}
 * />
 * ```
 *
 * @category Component
 * @subcategory Nearby
 */
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
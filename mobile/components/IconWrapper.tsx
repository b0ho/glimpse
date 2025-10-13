import React from 'react';
import { View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * IconWrapper Props
 *
 * @interface IconWrapperProps
 */
interface IconWrapperProps {
  /** Ionicons 아이콘 이름 */
  name: string;
  /** 아이콘 크기 (기본값: 24) */
  size?: number;
  /** 아이콘 색상 (기본값: #000) */
  color?: string;
  /** 포커스 상태 (탭 네비게이션용) */
  focused?: boolean;
  /** Tailwind CSS 클래스명 (NativeWind) */
  className?: string;
}

/**
 * 아이콘 래퍼 컴포넌트 (NativeWind 버전)
 *
 * @description NativeWind v4를 사용한 아이콘 래퍼.
 *              포커스 상태에 따른 색상 변경 기능 제공.
 *
 * @component UI
 * @props IconWrapperProps
 * @usage Tab Navigator 아이콘 (NativeWind 마이그레이션 버전)
 *
 * @example
 * <IconWrapper name="home" size={24} focused={isActive} />
 */
export const IconWrapper = ({ name, size = 24, color = '#000', focused, className }: IconWrapperProps) => {
  return (
    <View className={className || "container"}>
      <Icon name={name} size={size} color={focused ? '#FF6B6B' : color} />
    </View>
  );
};


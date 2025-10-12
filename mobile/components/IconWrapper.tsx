import React from 'react';
import { View, StyleSheet } from 'react-native';
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
}

/**
 * 아이콘 래퍼 컴포넌트
 *
 * @description Ionicons 아이콘을 래핑하여 포커스 상태에 따른
 *              색상 변경 기능을 제공하는 간단한 래퍼 컴포넌트.
 *
 * @component UI
 * @props IconWrapperProps
 * @usage Tab Navigator 아이콘, 버튼 아이콘
 *
 * @example
 * <IconWrapper
 *   name="home"
 *   size={24}
 *   color="#666"
 *   focused={isActive}
 * />
 */
export const IconWrapper = ({ name, size = 24, color = '#000', focused }: IconWrapperProps) => {
  return (
    <View style={styles.container}>
      <Icon name={name} size={size} color={focused ? '#FF6B6B' : color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
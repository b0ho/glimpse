import { Platform, ViewStyle } from 'react-native';

interface ShadowOptions {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * 플랫폼별 그림자 스타일을 생성합니다.
 * iOS/Android는 native shadow props 사용, 웹은 boxShadow 사용
 */
export const createShadowStyle = (options: ShadowOptions): ViewStyle => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.1,
    shadowRadius = 4,
    elevation = 4,
  } = options;

  if (Platform.OS === 'web') {
    // 웹에서는 boxShadow 사용
    const offsetX = shadowOffset.width;
    const offsetY = shadowOffset.height;
    const blur = shadowRadius * 2; // shadow radius를 blur로 변환
    const color = `rgba(0, 0, 0, ${shadowOpacity})`;
    
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}`,
    } as ViewStyle;
  }

  if (Platform.OS === 'android') {
    // Android는 elevation만 사용
    return {
      elevation,
    };
  }

  // iOS는 모든 shadow props 사용
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
};

/**
 * 미리 정의된 그림자 스타일
 */
export const shadowStyles = {
  small: createShadowStyle({
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  }),
  
  medium: createShadowStyle({
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  }),
  
  large: createShadowStyle({
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  }),
  
  card: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  }),
  
  button: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 5,
  }),
};
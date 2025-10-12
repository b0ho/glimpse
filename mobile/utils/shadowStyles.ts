/**
 * 그림자 스타일 유틸리티
 * @module utils/shadowStyles
 * @description 크로스 플랫폼 그림자 스타일 생성 (LEGACY - platformStyles.ts 사용 권장)
 *
 * ⚠️ **DEPRECATED**: 이 파일은 레거시 코드입니다.
 * 새로운 코드에서는 `@/utils/styles/platformStyles`의 `createShadow`를 사용하세요.
 *
 * 주요 기능:
 * - iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * - Android: elevation
 * - Web: boxShadow CSS 속성
 *
 * @see {@link module:utils/styles/platformStyles} - 권장되는 대체 모듈
 */
import { Platform, ViewStyle } from 'react-native';

/**
 * 그림자 옵션 인터페이스
 * @interface ShadowOptions
 */
interface ShadowOptions {
  /** 그림자 색상 (기본: '#000') */
  shadowColor?: string;
  /** 그림자 오프셋 (기본: {width: 0, height: 2}) */
  shadowOffset?: { width: number; height: number };
  /** 그림자 불투명도 (기본: 0.1) */
  shadowOpacity?: number;
  /** 그림자 반경 (기본: 4) */
  shadowRadius?: number;
  /** Android elevation (기본: 4) */
  elevation?: number;
}

/**
 * 플랫폼별 그림자 스타일을 생성합니다
 *
 * @deprecated 대신 `@/utils/styles/platformStyles`의 `createShadow` 사용
 *
 * @param {ShadowOptions} options - 그림자 설정 옵션
 * @returns {ViewStyle} 플랫폼에 맞는 그림자 스타일
 *
 * @example
 * const shadow = createShadowStyle({
 *   shadowOffset: { width: 0, height: 4 },
 *   shadowOpacity: 0.15,
 *   elevation: 5
 * });
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
 * 미리 정의된 그림자 스타일 프리셋
 * @constant shadowStyles
 * @deprecated 대신 `@/utils/styles/platformStyles`의 `shadowPresets` 사용
 *
 * @example
 * <View style={shadowStyles.card}>...</View>
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
/**
 * 크로스 플랫폼 스타일 유틸리티
 * @module platformStyles
 * @description Web, iOS, Android에서 일관된 스타일 제공
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';

/**
 * 그림자 스타일 옵션
 */
interface ShadowOptions {
  /** 그림자 색상 */
  color?: string;
  /** X축 오프셋 */
  offsetX?: number;
  /** Y축 오프셋 */
  offsetY?: number;
  /** 그림자 반경 */
  radius?: number;
  /** 불투명도 (0-1) */
  opacity?: number;
  /** Android elevation */
  elevation?: number;
}

/**
 * 크로스 플랫폼 그림자 스타일 생성
 * @param {ShadowOptions} options - 그림자 옵션
 * @returns {ViewStyle} 플랫폼별 그림자 스타일
 * @description 각 플랫폼에 최적화된 그림자 스타일 반환
 * @example
 * const shadowStyle = createShadow({ 
 *   color: '#000', 
 *   offsetY: 2, 
 *   radius: 4, 
 *   opacity: 0.1,
 *   elevation: 3 
 * });
 */
export const createShadow = (options: ShadowOptions = {}): ViewStyle => {
  const {
    color = '#000',
    offsetX = 0,
    offsetY = 2,
    radius = 4,
    opacity = 0.1,
    elevation = 3,
  } = options;

  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: {
        width: offsetX,
        height: offsetY,
      },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    web: {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(0, 0, 0, ${opacity})`,
    } as any,
    default: {},
  }) as ViewStyle;
};

/**
 * 텍스트 그림자 옵션
 */
interface TextShadowOptions {
  /** 그림자 색상 */
  color?: string;
  /** X축 오프셋 */
  offsetX?: number;
  /** Y축 오프셋 */
  offsetY?: number;
  /** 그림자 반경 */
  radius?: number;
}

/**
 * 크로스 플랫폼 텍스트 그림자 스타일 생성
 * @param {TextShadowOptions} options - 텍스트 그림자 옵션
 * @returns {TextStyle} 플랫폼별 텍스트 그림자 스타일
 * @example
 * const textShadowStyle = createTextShadow({
 *   color: '#000',
 *   offsetY: 1,
 *   radius: 2
 * });
 */
export const createTextShadow = (options: TextShadowOptions = {}): TextStyle => {
  const {
    color = '#000',
    offsetX = 0,
    offsetY = 1,
    radius = 2,
  } = options;

  return Platform.select({
    ios: {
      textShadowColor: color,
      textShadowOffset: {
        width: offsetX,
        height: offsetY,
      },
      textShadowRadius: radius,
    },
    android: {
      textShadowColor: color,
      textShadowOffset: {
        width: offsetX,
        height: offsetY,
      },
      textShadowRadius: radius,
    },
    web: {
      textShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}`,
    } as any,
    default: {},
  }) as TextStyle;
};

/**
 * 공통 그림자 프리셋
 */
export const shadowPresets = {
  /** 작은 그림자 */
  small: createShadow({
    offsetY: 1,
    radius: 2,
    opacity: 0.08,
    elevation: 2,
  }),
  
  /** 중간 그림자 */
  medium: createShadow({
    offsetY: 2,
    radius: 4,
    opacity: 0.1,
    elevation: 3,
  }),
  
  /** 큰 그림자 */
  large: createShadow({
    offsetY: 4,
    radius: 8,
    opacity: 0.15,
    elevation: 5,
  }),
  
  /** 매우 큰 그림자 */
  extraLarge: createShadow({
    offsetY: 8,
    radius: 16,
    opacity: 0.2,
    elevation: 8,
  }),
  
  /** 카드 그림자 */
  card: createShadow({
    offsetY: 2,
    radius: 6,
    opacity: 0.12,
    elevation: 4,
  }),
  
  /** 버튼 그림자 */
  button: createShadow({
    offsetY: 1,
    radius: 3,
    opacity: 0.1,
    elevation: 2,
  }),
  
  /** 플로팅 액션 버튼 그림자 */
  fab: createShadow({
    offsetY: 6,
    radius: 12,
    opacity: 0.25,
    elevation: 6,
  }),
};

/**
 * 플랫폼별 스타일 조정
 * @param {ViewStyle | TextStyle} baseStyle - 기본 스타일
 * @returns {ViewStyle | TextStyle} 플랫폼에 최적화된 스타일
 * @description deprecated 속성을 플랫폼별 적절한 속성으로 변환
 */
export const adjustStyleForPlatform = (baseStyle: any): any => {
  const adjustedStyle = { ...baseStyle };
  
  // shadow* 속성 변환
  if (Platform.OS === 'web') {
    // iOS/Android shadow 속성을 web의 boxShadow로 변환
    if (adjustedStyle.shadowColor || adjustedStyle.shadowOffset) {
      const shadowColor = adjustedStyle.shadowColor || '#000';
      const shadowOffset = adjustedStyle.shadowOffset || { width: 0, height: 0 };
      const shadowOpacity = adjustedStyle.shadowOpacity || 0.1;
      const shadowRadius = adjustedStyle.shadowRadius || 4;
      
      adjustedStyle.boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`;
      
      // 웹에서 사용하지 않는 속성 제거
      delete adjustedStyle.shadowColor;
      delete adjustedStyle.shadowOffset;
      delete adjustedStyle.shadowOpacity;
      delete adjustedStyle.shadowRadius;
      delete adjustedStyle.elevation;
    }
    
    // textShadow* 속성 변환
    if (adjustedStyle.textShadowColor || adjustedStyle.textShadowOffset) {
      const textShadowColor = adjustedStyle.textShadowColor || '#000';
      const textShadowOffset = adjustedStyle.textShadowOffset || { width: 0, height: 0 };
      const textShadowRadius = adjustedStyle.textShadowRadius || 2;
      
      adjustedStyle.textShadow = `${textShadowOffset.width}px ${textShadowOffset.height}px ${textShadowRadius}px ${textShadowColor}`;
      
      // 웹에서 사용하지 않는 속성 제거
      delete adjustedStyle.textShadowColor;
      delete adjustedStyle.textShadowOffset;
      delete adjustedStyle.textShadowRadius;
    }
  }
  
  // Android에서 iOS shadow 속성 제거 (elevation만 사용)
  if (Platform.OS === 'android' && adjustedStyle.elevation) {
    delete adjustedStyle.shadowColor;
    delete adjustedStyle.shadowOffset;
    delete adjustedStyle.shadowOpacity;
    delete adjustedStyle.shadowRadius;
  }
  
  return adjustedStyle;
};

/**
 * 플랫폼 체크 유틸리티
 */
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;

/**
 * 플랫폼별 조건부 스타일
 * @param {ViewStyle | TextStyle} webStyle - 웹 스타일
 * @param {ViewStyle | TextStyle} nativeStyle - 네이티브 스타일
 * @returns {ViewStyle | TextStyle} 현재 플랫폼에 맞는 스타일
 */
export const platformStyle = <T extends ViewStyle | TextStyle>(
  webStyle: T,
  nativeStyle: T
): T => {
  return Platform.select({
    web: webStyle,
    default: nativeStyle,
  }) as T;
};

export default {
  createShadow,
  createTextShadow,
  shadowPresets,
  adjustStyleForPlatform,
  isWeb,
  isIOS,
  isAndroid,
  isNative,
  platformStyle,
};
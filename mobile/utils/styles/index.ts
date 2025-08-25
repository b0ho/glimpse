/**
 * 스타일 유틸리티 모듈
 * @module styles
 * @description 크로스 플랫폼 스타일링 솔루션
 */

export {
  createShadow,
  createTextShadow,
  shadowPresets,
  adjustStyleForPlatform,
  isWeb,
  isIOS,
  isAndroid,
  isNative,
  platformStyle,
} from './platformStyles';

export type { default as PlatformStylesType } from './platformStyles';
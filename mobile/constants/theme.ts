/**
 * 테마 상수
 * @module constants/theme
 * @description 애플리케이션 전체에서 사용되는 디자인 테마 상수
 */

import { ColorPalette } from '@/types/theme';

/**
 * 라이트 모드 색상 팔레트
 * @constant LIGHT_COLORS
 * @description 라이트 모드에서 사용되는 색상 정의 (WCAG AA 준수)
 */
export const LIGHT_COLORS: ColorPalette = {
  PRIMARY: '#E85555', // 더 진한 레드로 대비 향상
  SECONDARY: '#3FB8B0', // 더 진한 시안으로 대비 향상
  SUCCESS: '#2FA8C0', // 더 진한 블루로 대비 향상
  WARNING: '#FF9800', // 더 진한 오렌지로 대비 향상
  ERROR: '#E53935', // 더 진한 레드로 대비 향상
  INFO: '#42A5C0',
  BACKGROUND: '#F5F5F5', // 약간 더 어두운 배경 (눈부심 감소)
  SURFACE: '#FFFFFF',
  TEXT: {
    PRIMARY: '#1A1A1A', // 더 진한 검정색 (대비 향상)
    SECONDARY: '#5A5A5A', // 더 진한 회색 (대비 향상)
    TERTIARY: '#8A8A8A', // 중간 회색 (대비 개선)
    LIGHT: '#8A8A8A',
    WHITE: '#FFFFFF',
    MUTED: '#999999', // 뮤트 색상 대비 개선
  },
  BORDER: '#D0D0D0', // 더 진한 보더 (가시성 향상)
  BLACK: '#000000',
  TRANSPARENT: 'transparent',
  SHADOW: '#000',
  OVERLAY: 'rgba(0, 0, 0, 0.6)', // 더 어두운 오버레이
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.35)',
  // 추가 색상들
  primary: '#E85555',
  text: '#1A1A1A',
  textSecondary: '#5A5A5A',
  white: '#FFFFFF',
  gray50: '#F5F5F5',
  gray200: '#D0D0D0',
  gray300: '#BDBDBD',
  gray500: '#8A8A8A',
  premium: '#F5B800', // 더 진한 골드 (대비 향상)
  WHITE: '#FFFFFF',
};

/**
 * 다크 모드 색상 팔레트
 * @constant DARK_COLORS
 * @description 다크 모드에서 사용되는 색상 정의 (OLED 최적화, WCAG AA 준수)
 */
export const DARK_COLORS: ColorPalette = {
  PRIMARY: '#FF9999', // 더 밝은 핑크로 가시성 향상 (대비비 개선)
  SECONDARY: '#70DDE8', // 더 밝은 시안으로 가시성 향상
  SUCCESS: '#5FD4CA', // 성공 색상 더 밝게 (대비비 개선)
  WARNING: '#FFD56B', // 경고 색상 더 밝게 (대비비 개선)
  ERROR: '#FF8888', // 에러 색상 더 밝게 (대비비 개선)
  INFO: '#7BD4F0',
  BACKGROUND: '#000000', // 진짜 검은색 (OLED 최적화)
  SURFACE: '#1E1E1E', // 카드/표면 더 밝게 (가시성 향상)
  TEXT: {
    PRIMARY: '#FFFFFF', // 순백색 텍스트 (최고 대비)
    SECONDARY: '#E0E0E0', // 보조 텍스트 더 밝게 (대비비 개선)
    TERTIARY: '#B8B8B8', // 3차 텍스트 더 밝게
    LIGHT: '#B8B8B8', // 연한 텍스트 더 밝게
    WHITE: '#FFFFFF',
    MUTED: '#B0B0B0', // 뮤트된 텍스트 더 밝게 (대비비 개선)
  },
  BORDER: '#555555', // 보더 더 밝게 (가시성 향상)
  BLACK: '#000000',
  TRANSPARENT: 'transparent',
  SHADOW: '#000',
  OVERLAY: 'rgba(0, 0, 0, 0.85)', // 오버레이 더 어둡게
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.65)',
  // 추가 색상들
  primary: '#FF9999',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  white: '#FFFFFF',
  gray50: '#1E1E1E',
  gray200: '#555555',
  gray300: '#6E6E6E',
  gray500: '#B8B8B8',
  premium: '#FFE55C', // 골드 색상 더 밝게 (대비비 개선)
  WHITE: '#FFFFFF',
};

/**
 * 레거시 색상 (호환성)
 * @constant COLORS
 * @description 기존 코드 호환성을 위한 색상 (기본 라이트 모드)
 */
export const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  black: '#1E1F20',
  white: '#FFFFFF',
  lightGray: '#F5F5F6',
  lightGray2: '#F6F6F7',
  lightGray3: '#EFEFF1',
  lightGray4: '#F8F8F9',
  gray: '#898B9A',
  gray2: '#BBBDC1',
  gray3: '#CFD0D7',
  gray4: '#E9ECEF',
  darkgray: '#525C67',
  darkgray2: '#757D85',
  darkgray3: '#898B9A',
  darkgray4: '#BBBDC1',
  transparent: 'transparent',
  transparentBlack: 'rgba(0, 0, 0, 0.5)',
  transparentWhite: 'rgba(255, 255, 255, 0.7)',
  transparentWhite2: 'rgba(255, 255, 255, 0.5)',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  info: '#17A2B8',
  text: '#1E1F20',
  textLight: '#6C757D',
  primaryLight: '#FFE5E5',
  border: '#E9ECEF',
  disabled: '#CED4DA',
  infoBackground: '#E7F5FF',
};

/**
 * 크기 및 간격 상수
 * @constant SIZES
 * @description 레이아웃, 폰트 크기, 여백 등 UI 크기 값
 */
export const SIZES = {
  base: 8,
  font: 14,
  radius: 12,
  padding: 16,
  padding2: 24,
  margin: 16,
  margin2: 24,

  // font sizes
  largeTitle: 50,
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 20,
  body3: 16,
  body4: 14,
  body5: 12,

  // app dimensions
  width: 375,
  height: 812,
};

/**
 * 폰트 스타일
 * @constant FONTS
 * @description 타이포그래피 스타일 정의
 */
export const FONTS = {
  largeTitle: { fontSize: SIZES.largeTitle, lineHeight: 55 },
  h1: { fontSize: SIZES.h1, lineHeight: 36, fontWeight: '700' as const },
  h2: { fontSize: SIZES.h2, lineHeight: 30, fontWeight: '600' as const },
  h3: { fontSize: SIZES.h3, lineHeight: 22, fontWeight: '600' as const },
  h4: { fontSize: SIZES.h4, lineHeight: 22, fontWeight: '600' as const },
  body1: { fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontSize: SIZES.body4, lineHeight: 22 },
  body5: { fontSize: SIZES.body5, lineHeight: 22 },
};

/**
 * 앱 테마 객체
 * @constant appTheme
 * @description 모든 테마 상수를 포함하는 통합 테마 객체
 */
const appTheme = { COLORS, SIZES, FONTS };
export default appTheme;
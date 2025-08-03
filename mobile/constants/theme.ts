/**
 * 테마 상수
 * @module constants/theme
 * @description 애플리케이션 전체에서 사용되는 디자인 테마 상수
 */

/**
 * 색상 테마
 * @constant COLORS
 * @description 브랜드 아이덴티티와 UI 일관성을 위한 색상 팔레트
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
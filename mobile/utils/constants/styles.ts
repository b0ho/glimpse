import { Platform } from 'react-native';

// 폰트 패밀리
export const FONT_FAMILY = {
  REGULAR: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
  MEDIUM: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
  }),
  SEMIBOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
  }),
  BOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
  }),
} as const;

// 폰트 스타일
export const FONTS = {
  h1: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FONT_FAMILY.SEMIBOLD,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontFamily: FONT_FAMILY.SEMIBOLD,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body1: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  body3: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  body4: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  caption: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
} as const;

// 사이즈 상수
export const SIZES = {
  // 기본 크기
  base: 8,
  font: 14,
  radius: 12,
  padding: 16,

  // 폰트 크기
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  caption: 12,

  // 마진과 패딩
  margin: 16,
  section: 24,

  // 아이콘 크기
  icon: 24,
  iconSmall: 20,
  iconLarge: 32,

  // 버튼 크기
  buttonHeight: 48,
  buttonSmallHeight: 36,

  // 입력 필드
  inputHeight: 48,
  inputRadius: 8,

  // 그림자
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

// 색상 확장
export const COLORS_EXTENDED = {
  // 기본 색상
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  success: '#45B7D1',
  warning: '#FFA726',
  error: '#EF5350',
  
  // 배경 색상
  background: '#F8F9FA',
  surface: '#FFFFFF',
  
  // 텍스트 색상
  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  
  // 테두리 색상
  border: '#E9ECEF',
  
  // 기타
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // 프리미엄
  premium: '#FFD700',
} as const;
/**
 * 테마 관련 타입 정의
 * @module types/theme
 * @description 다크모드/라이트모드 테마 시스템을 위한 타입 정의
 */

/**
 * 테마 모드
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 색상 팔레트 인터페이스
 */
export interface ColorPalette {
  PRIMARY: string;
  SECONDARY: string;
  SUCCESS: string;
  WARNING: string;
  ERROR: string;
  BACKGROUND: string;
  SURFACE: string;
  TEXT: {
    PRIMARY: string;
    SECONDARY: string;
    LIGHT: string;
    WHITE: string;
    MUTED: string;
  };
  BORDER: string;
  BLACK: string;
  TRANSPARENT: string;
  SHADOW: string;
  OVERLAY: string;
  OVERLAY_LIGHT: string;
  // 추가 색상들
  primary: string;
  text: string;
  textSecondary: string;
  white: string;
  gray50: string;
  gray200: string;
  gray300: string;
  gray500: string;
  premium: string;
  WHITE: string;
}

/**
 * 테마 상태 인터페이스
 */
export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorPalette;
}

/**
 * 테마 액션 인터페이스
 */
export interface ThemeActions {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => Promise<void>;
}

/**
 * 테마 스토어 인터페이스
 */
export interface ThemeStore extends ThemeState, ThemeActions {}
/**
 * 테마 관련 훅
 * @module hooks/useTheme
 * @description 테마 상태 및 색상에 쉽게 접근할 수 있는 커스텀 훅
 */

import { useEffect } from 'react';
import { useThemeStore, themeSelectors } from '@/store/slices/themeSlice';
import { ThemeMode, ColorPalette } from '@/types/theme';

/**
 * 테마 훅 반환값 인터페이스
 */
interface UseThemeReturn {
  /** 현재 테마 모드 */
  mode: ThemeMode;
  /** 다크 모드 여부 */
  isDark: boolean;
  /** 현재 테마 색상 팔레트 */
  colors: ColorPalette;
  /** 시스템 모드 여부 */
  isSystem: boolean;
  /** 테마 변경 함수 */
  setTheme: (mode: ThemeMode) => void;
  /** 테마 토글 함수 (light -> dark -> system -> light) */
  toggleTheme: () => void;
}

/**
 * 테마 훅
 * @returns {UseThemeReturn} 테마 관련 상태 및 함수들
 * @description 컴포넌트에서 테마를 쉽게 사용할 수 있도록 하는 훅
 * 
 * @example
 * ```tsx
 * const { colors, isDark, setTheme } = useTheme();
 * 
 * return (
 *   <View style={{ backgroundColor: colors.BACKGROUND }}>
 *     <Text style={{ color: colors.TEXT.PRIMARY }}>
 *       현재 모드: {isDark ? '다크' : '라이트'}
 *     </Text>
 *     <Button onPress={() => setTheme('dark')}>
 *       다크모드로 변경
 *     </Button>
 *   </View>
 * );
 * ```
 */
export const useTheme = (): UseThemeReturn => {
  // 스토어에서 상태와 액션 가져오기
  const mode = useThemeStore(themeSelectors.mode());
  const isDark = useThemeStore(themeSelectors.isDark());
  const colors = useThemeStore(themeSelectors.colors());
  const isSystem = useThemeStore(themeSelectors.isSystem());
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  // 앱 시작 시 테마 초기화
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return {
    mode,
    isDark,
    colors,
    isSystem,
    setTheme,
    toggleTheme,
  };
};

/**
 * 색상만 필요한 경우를 위한 경량 훅
 * @returns {ColorPalette} 현재 테마 색상 팔레트
 * 
 * @example
 * ```tsx
 * const colors = useColors();
 * 
 * return (
 *   <View style={{ backgroundColor: colors.BACKGROUND }}>
 *     <Text style={{ color: colors.TEXT.PRIMARY }}>Hello</Text>
 *   </View>
 * );
 * ```
 */
export const useColors = (): ColorPalette => {
  return useThemeStore(themeSelectors.colors());
};

/**
 * 다크 모드 상태만 필요한 경우를 위한 경량 훅
 * @returns {boolean} 다크 모드 여부
 * 
 * @example
 * ```tsx
 * const isDark = useIsDark();
 * 
 * return (
 *   <StatusBar style={isDark ? 'light' : 'dark'} />
 * );
 * ```
 */
export const useIsDark = (): boolean => {
  return useThemeStore(themeSelectors.isDark());
};

/**
 * 테마 모드만 필요한 경우를 위한 경량 훅
 * @returns {ThemeMode} 현재 테마 모드
 * 
 * @example
 * ```tsx
 * const mode = useThemeMode();
 * 
 * return (
 *   <Text>{mode === 'system' ? '시스템' : mode === 'dark' ? '다크' : '라이트'}</Text>
 * );
 * ```
 */
export const useThemeMode = (): ThemeMode => {
  return useThemeStore(themeSelectors.mode());
};
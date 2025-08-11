import { Platform, TextStyle } from 'react-native';
import { getCurrentLanguage } from '../services/i18n/i18n';

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';

const FONT_FAMILIES: Record<SupportedLanguage, string> = {
  ko: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto',
  en: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  ja: 'Hiragino Sans, Meiryo, sans-serif',
  zh: 'PingFang SC, Microsoft YaHei, sans-serif',
  vi: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  th: 'Sukhumvit Set, Kanit, sans-serif',
  es: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  fr: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
};

/**
 * 언어별 최적화된 폰트 설정
 */
export const getLanguageOptimizedFont = (
  baseStyle: TextStyle = {},
  language?: SupportedLanguage
): TextStyle => {
  const currentLang = language || getCurrentLanguage();
  const fontFamily = FONT_FAMILIES[currentLang];
  
  // 언어별 폰트 크기 조정
  const fontSizeMultiplier = getFontSizeMultiplier(currentLang);
  const lineHeightMultiplier = getLineHeightMultiplier(currentLang);
  
  return {
    ...baseStyle,
    fontFamily: Platform.select({
      ios: fontFamily,
      android: fontFamily.split(',')[0].trim(), // Android는 첫 번째 폰트만 사용
    }),
    fontSize: baseStyle.fontSize ? baseStyle.fontSize * fontSizeMultiplier : undefined,
    lineHeight: baseStyle.lineHeight ? baseStyle.lineHeight * lineHeightMultiplier : undefined,
    // CJK 언어의 경우 letter spacing 조정
    letterSpacing: getCJKLetterSpacing(currentLang, baseStyle.letterSpacing),
  };
};

/**
 * 언어별 폰트 크기 배율
 */
const getFontSizeMultiplier = (language: SupportedLanguage): number => {
  switch (language) {
    case 'ja':
    case 'zh':
      return 0.95; // CJK 문자는 약간 작게
    case 'th':
      return 1.05; // 태국어는 약간 크게 (톤 마크 때문)
    default:
      return 1;
  }
};

/**
 * 언어별 줄 높이 배율
 */
const getLineHeightMultiplier = (language: SupportedLanguage): number => {
  switch (language) {
    case 'ja':
    case 'zh':
      return 1.3; // CJK 문자는 줄 간격 넓게
    case 'th':
      return 1.4; // 태국어는 톤 마크 때문에 더 넓게
    case 'ko':
      return 1.2;
    default:
      return 1.15;
  }
};

/**
 * CJK 언어 letter spacing 조정
 */
const getCJKLetterSpacing = (
  language: SupportedLanguage,
  baseSpacing?: number
): number | undefined => {
  if (['ja', 'zh', 'ko'].includes(language)) {
    return baseSpacing !== undefined ? baseSpacing * 0.8 : 0.5;
  }
  return baseSpacing;
};

/**
 * 텍스트 길이에 따른 동적 폰트 크기 조정
 */
export const getDynamicFontSize = (
  text: string,
  baseFontSize: number,
  maxWidth: number,
  language?: SupportedLanguage
): number => {
  const currentLang = language || getCurrentLanguage();
  const charWidth = getAverageCharWidth(currentLang);
  const estimatedWidth = text.length * charWidth * baseFontSize;
  
  if (estimatedWidth > maxWidth) {
    return Math.max(
      baseFontSize * (maxWidth / estimatedWidth),
      baseFontSize * 0.7 // 최소 70% 크기 유지
    );
  }
  
  return baseFontSize;
};

/**
 * 언어별 평균 문자 너비 (상대값)
 */
const getAverageCharWidth = (language: SupportedLanguage): number => {
  switch (language) {
    case 'ja':
    case 'zh':
      return 1.0; // 한자는 정사각형에 가까움
    case 'ko':
      return 0.9; // 한글은 약간 좁음
    case 'th':
      return 0.6; // 태국어는 좁은 편
    default:
      return 0.5; // 라틴 문자
  }
};

/**
 * RTL 언어 지원 (향후 확장용)
 */
export const getTextAlign = (
  language?: SupportedLanguage
): 'left' | 'right' | 'center' => {
  const currentLang = language || getCurrentLanguage();
  // 현재는 RTL 언어가 없지만 향후 아랍어 등 추가 시 사용
  const rtlLanguages: SupportedLanguage[] = [];
  
  if (rtlLanguages.includes(currentLang)) {
    return 'right';
  }
  return 'left';
};

/**
 * 언어별 텍스트 스타일 프리셋
 */
export const TextStyles = {
  // 제목
  heading1: (language?: SupportedLanguage): TextStyle => 
    getLanguageOptimizedFont({
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    }, language),
    
  heading2: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    }, language),
    
  heading3: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    }, language),
    
  // 본문
  body: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    }, language),
    
  bodySmall: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    }, language),
    
  // 캡션
  caption: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 16,
    }, language),
    
  // 버튼
  button: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0.5,
    }, language),
    
  buttonSmall: (language?: SupportedLanguage): TextStyle =>
    getLanguageOptimizedFont({
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.25,
    }, language),
};

/**
 * 언어별 최대 텍스트 길이 (UI 요소별)
 */
export const getMaxTextLength = (
  elementType: 'button' | 'label' | 'title' | 'description',
  language?: SupportedLanguage
): number => {
  const currentLang = language || getCurrentLanguage();
  
  // 언어별 텍스트 확장 비율 (영어 대비)
  const expansionRates: Record<SupportedLanguage, number> = {
    ko: 0.8,  // 한국어는 더 간결
    en: 1.0,  // 기준
    ja: 0.9,  // 일본어도 간결
    zh: 0.7,  // 중국어는 매우 간결
    vi: 1.2,  // 베트남어는 조금 긴 편
    th: 1.1,  // 태국어도 약간 긴 편
    es: 1.15, // 스페인어는 영어보다 약간 김
    fr: 1.2,  // 프랑스어는 영어보다 김
  };
  
  const baseLength = {
    button: 20,
    label: 30,
    title: 50,
    description: 200,
  };
  
  return Math.ceil(baseLength[elementType] * expansionRates[currentLang]);
};

/**
 * 텍스트 truncate 헬퍼
 */
export const truncateText = (
  text: string,
  maxLength: number,
  language?: SupportedLanguage
): string => {
  const currentLang = language || getCurrentLanguage();
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // 언어별 말줄임표
  const ellipsis = getEllipsis(currentLang);
  
  // CJK 언어는 단어 단위로 자르지 않고 문자 단위로 자름
  if (['ja', 'zh', 'ko'].includes(currentLang)) {
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }
  
  // 라틴 문자 언어는 단어 단위로 자름
  const truncated = text.substring(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + ellipsis;
  }
  
  return truncated + ellipsis;
};

/**
 * 언어별 말줄임표
 */
const getEllipsis = (language: SupportedLanguage): string => {
  switch (language) {
    case 'zh':
    case 'ja':
      return '…'; // CJK는 단일 문자 말줄임표
    case 'ko':
      return '...';
    default:
      return '...';
  }
};
/**
 * 타이포그래피 유틸리티
 * @module utils/typography
 * @description 다국어 지원 폰트 및 텍스트 스타일 관리
 *
 * 주요 기능:
 * - 언어별 최적화된 폰트 패밀리 제공
 * - CJK(한중일) 언어 특화 레이아웃 조정
 * - 동적 폰트 크기 계산
 * - 텍스트 말줄임 처리
 * - RTL(Right-to-Left) 언어 대응 준비
 */

import { Platform, TextStyle } from 'react-native';
import { getCurrentLanguage } from '../services/i18n/i18n';

/**
 * 지원되는 언어 타입
 */
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';

/**
 * 언어별 폰트 패밀리 매핑
 * @constant
 * @description 각 언어에 최적화된 시스템 폰트 조합
 */
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
 * 언어별 최적화된 폰트 스타일을 생성합니다
 *
 * @description
 * 현재 언어에 맞는 폰트 패밀리, 크기, 줄 높이를 자동으로 조정합니다.
 * CJK 언어는 약간 작은 크기와 넓은 줄 간격을 사용하고,
 * 태국어는 톤 마크를 고려한 조정을 합니다.
 *
 * @param {TextStyle} baseStyle - 기본 텍스트 스타일
 * @param {SupportedLanguage} [language] - 타겟 언어 (미지정시 현재 언어)
 * @returns {TextStyle} 최적화된 텍스트 스타일
 *
 * @example
 * const optimizedStyle = getLanguageOptimizedFont({
 *   fontSize: 16,
 *   lineHeight: 24
 * }, 'ko');
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
 * 언어별 폰트 크기 배율을 반환합니다
 *
 * @description
 * CJK 문자는 정사각형 형태로 작아 보이므로 0.95배,
 * 태국어는 톤 마크로 인해 높이가 필요하므로 1.05배로 조정
 *
 * @param {SupportedLanguage} language - 타겟 언어
 * @returns {number} 폰트 크기 배율 (0.95 ~ 1.05)
 *
 * @example
 * getFontSizeMultiplier('ja'); // 0.95
 * getFontSizeMultiplier('th'); // 1.05
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
 * 언어별 줄 높이 배율을 반환합니다
 *
 * @description
 * CJK 문자와 태국어는 수직 공간이 더 필요하므로
 * 라틴 문자보다 넓은 줄 간격을 적용합니다
 *
 * @param {SupportedLanguage} language - 타겟 언어
 * @returns {number} 줄 높이 배율 (1.15 ~ 1.4)
 *
 * @example
 * getLineHeightMultiplier('th'); // 1.4 (가장 넓음)
 * getLineHeightMultiplier('en'); // 1.15 (기본)
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
 * CJK 언어의 자간(letter spacing)을 조정합니다
 *
 * @description
 * 한중일 문자는 라틴 문자보다 조밀하게 배치되어야 가독성이 좋으므로
 * 자간을 80% 수준으로 줄입니다
 *
 * @param {SupportedLanguage} language - 타겟 언어
 * @param {number} [baseSpacing] - 기본 자간 값
 * @returns {number | undefined} 조정된 자간 값 또는 undefined
 *
 * @example
 * getCJKLetterSpacing('ko', 1.0); // 0.8
 * getCJKLetterSpacing('en', 1.0); // 1.0
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
 * 텍스트 길이에 맞춰 폰트 크기를 동적으로 조정합니다
 *
 * @description
 * 지정된 너비에 텍스트가 맞지 않으면 폰트 크기를 자동으로 줄입니다.
 * 최소 70%까지 축소 가능하며, 언어별 평균 문자 너비를 고려합니다.
 *
 * @param {string} text - 표시할 텍스트
 * @param {number} baseFontSize - 기본 폰트 크기
 * @param {number} maxWidth - 최대 너비 (픽셀)
 * @param {SupportedLanguage} [language] - 타겟 언어
 * @returns {number} 조정된 폰트 크기
 *
 * @example
 * // 긴 텍스트가 200px에 맞지 않으면 폰트 크기 축소
 * const fontSize = getDynamicFontSize('매우 긴 텍스트입니다', 16, 200, 'ko');
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
 * 언어별 평균 문자 너비를 반환합니다 (상대값)
 *
 * @description
 * 한자는 정사각형(1.0), 한글은 약간 좁음(0.9),
 * 라틴 문자는 가장 좁음(0.5)
 *
 * @param {SupportedLanguage} language - 타겟 언어
 * @returns {number} 문자 너비 비율 (0.5 ~ 1.0)
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
 * 언어별 텍스트 정렬 방향을 반환합니다
 *
 * @description
 * RTL(Right-to-Left) 언어 지원을 위한 함수.
 * 현재는 모든 언어가 LTR이지만 향후 아랍어 등 추가 가능
 *
 * @param {SupportedLanguage} [language] - 타겟 언어
 * @returns {'left' | 'right' | 'center'} 텍스트 정렬 방향
 *
 * @example
 * getTextAlign('ko'); // 'left'
 * // 향후: getTextAlign('ar'); // 'right'
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
 * @constant
 * @description 앱 전체에서 사용할 수 있는 사전 정의된 텍스트 스타일
 *
 * @example
 * import { TextStyles } from '@/utils/typography';
 * <Text style={TextStyles.heading1()}>제목</Text>
 * <Text style={TextStyles.body('ko')}>본문 내용</Text>
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
 * UI 요소별 최대 텍스트 길이를 반환합니다
 *
 * @description
 * 언어별 텍스트 확장 비율을 고려한 최대 길이.
 * 중국어는 가장 간결(0.7배), 프랑스어는 가장 김(1.2배)
 *
 * @param {'button' | 'label' | 'title' | 'description'} elementType - UI 요소 타입
 * @param {SupportedLanguage} [language] - 타겟 언어
 * @returns {number} 최대 문자 수
 *
 * @example
 * getMaxTextLength('button', 'ko'); // 16 (20 * 0.8)
 * getMaxTextLength('title', 'fr'); // 60 (50 * 1.2)
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
 * 텍스트를 지정된 길이로 자르고 말줄임표를 추가합니다
 *
 * @description
 * CJK 언어는 문자 단위로, 라틴 문자는 단어 단위로 자릅니다.
 * 언어별 적절한 말줄임표(... 또는 …)를 사용합니다.
 *
 * @param {string} text - 원본 텍스트
 * @param {number} maxLength - 최대 길이
 * @param {SupportedLanguage} [language] - 타겟 언어
 * @returns {string} 잘린 텍스트 + 말줄임표
 *
 * @example
 * truncateText('This is a long text', 10, 'en'); // 'This is...'
 * truncateText('이것은 긴 텍스트입니다', 10, 'ko'); // '이것은 긴 텍스...'
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
 * 언어별 말줄임표 문자를 반환합니다
 *
 * @description
 * CJK 언어는 단일 문자 말줄임표(…),
 * 나머지 언어는 세 점(...)을 사용
 *
 * @param {SupportedLanguage} language - 타겟 언어
 * @returns {string} 말줄임표 문자
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
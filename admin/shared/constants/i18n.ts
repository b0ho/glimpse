import { LanguageInfo, SupportedLanguage } from '../types/i18n';

// 지원 언어 목록
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    flag: '🇹🇭',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
};

// 기본 언어
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko';

// 폴백 언어 (번역이 없을 때 사용)
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

// 언어별 날짜 포맷
export const DATE_FORMATS: Record<SupportedLanguage, string> = {
  ko: 'YYYY년 MM월 DD일',
  en: 'MM/DD/YYYY',
  ja: 'YYYY年MM月DD日',
  zh: 'YYYY年MM月DD日',
  vi: 'DD/MM/YYYY',
  th: 'DD/MM/YYYY',
  es: 'DD/MM/YYYY',
  fr: 'DD/MM/YYYY',
};

// 언어별 시간 포맷
export const TIME_FORMATS: Record<SupportedLanguage, string> = {
  ko: 'HH:mm',
  en: 'hh:mm A',
  ja: 'HH:mm',
  zh: 'HH:mm',
  vi: 'HH:mm',
  th: 'HH:mm',
  es: 'HH:mm',
  fr: 'HH:mm',
};

// 언어별 통화 설정
export const CURRENCY_SETTINGS = {
  ko: { currency: 'KRW', symbol: '₩', decimalPlaces: 0 },
  en: { currency: 'USD', symbol: '$', decimalPlaces: 2 },
  ja: { currency: 'JPY', symbol: '¥', decimalPlaces: 0 },
  zh: { currency: 'CNY', symbol: '¥', decimalPlaces: 2 },
  vi: { currency: 'VND', symbol: '₫', decimalPlaces: 0 },
  th: { currency: 'THB', symbol: '฿', decimalPlaces: 2 },
  es: { currency: 'EUR', symbol: '€', decimalPlaces: 2 },
  fr: { currency: 'EUR', symbol: '€', decimalPlaces: 2 },
};

// 언어 감지 설정
export const LANGUAGE_DETECTION_CONFIG = {
  // 브라우저/디바이스 언어 감지
  detectBrowserLanguage: true,
  // 위치 기반 언어 감지
  detectLocationLanguage: false,
  // 저장된 사용자 설정 우선
  useStoredPreference: true,
  // 언어 감지 우선순위
  detectionOrder: ['stored', 'browser', 'location', 'default'],
};

// 번역 네임스페이스
export const TRANSLATION_NAMESPACES = [
  'common',
  'auth',
  'group',
  'matching',
  'chat',
  'payment',
  'profile',
  'settings',
  'errors',
  'notifications',
] as const;

// RTL 언어 (아랍어 등 향후 지원시)
export const RTL_LANGUAGES: SupportedLanguage[] = [];

// 언어별 글꼴 설정 (필요시)
export const FONT_FAMILIES: Record<SupportedLanguage, string> = {
  ko: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto',
  en: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  ja: 'Hiragino Sans, Meiryo, sans-serif',
  zh: 'PingFang SC, Microsoft YaHei, sans-serif',
  vi: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  th: 'Sukhumvit Set, Kanit, sans-serif',
  es: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  fr: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
};
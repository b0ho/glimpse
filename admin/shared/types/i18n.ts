// 지원 언어 타입
export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';

// 언어 정보 인터페이스
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

// 번역 키 네임스페이스
export type TranslationNamespace = 
  | 'common'
  | 'auth'
  | 'group'
  | 'matching'
  | 'chat'
  | 'payment'
  | 'profile'
  | 'settings'
  | 'errors'
  | 'notifications';

// 번역 리소스 타입
export interface TranslationResource {
  [namespace: string]: {
    [key: string]: string | TranslationResource;
  };
}

// 사용자 언어 설정
export interface UserLanguagePreference {
  language: SupportedLanguage;
  autoDetect: boolean;
  fallbackLanguage: SupportedLanguage;
}

// API 응답 다국어 지원
export interface LocalizedResponse<T> {
  data: T;
  message?: string;
  locale: SupportedLanguage;
}

// 다국어 에러 메시지
export interface LocalizedError {
  code: string;
  message: string;
  localizedMessage?: string;
  locale?: SupportedLanguage;
}

// 다국어 콘텐츠 (그룹 설명, 프로필 등)
export interface LocalizedContent {
  ko: string;
  en?: string;
  ja?: string;
  zh?: string;
  vi?: string;
  th?: string;
  es?: string;
  fr?: string;
}

// 날짜/시간 포맷 설정
export interface DateTimeFormat {
  locale: SupportedLanguage;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
}

// 통화 포맷 설정
export interface CurrencyFormat {
  locale: SupportedLanguage;
  currency: 'KRW' | 'USD' | 'JPY' | 'CNY' | 'EUR';
  symbol: string;
  decimalPlaces: number;
}
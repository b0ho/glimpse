import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import from shared - use relative path for now
const DEFAULT_LANGUAGE = 'ko' as const;
const FALLBACK_LANGUAGE = 'en' as const;
const STORAGE_KEYS = { USER_LANGUAGE: 'user_language' } as const;

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';

const SUPPORTED_LANGUAGES = {
  ko: { code: 'ko' as SupportedLanguage, name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  en: { code: 'en' as SupportedLanguage, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ja: { code: 'ja' as SupportedLanguage, name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  zh: { code: 'zh' as SupportedLanguage, name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  vi: { code: 'vi' as SupportedLanguage, name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  th: { code: 'th' as SupportedLanguage, name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  es: { code: 'es' as SupportedLanguage, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr' as SupportedLanguage, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
};

// Import translations - with fallbacks for missing files
let koCommon, koAuth, koGroup, koMatching, koChat, koPayment, koProfile, koSettings, koMatches, koPremium, koLocation, koNavigation;
let enCommon, enAuth, enGroup, enProfile, enMatching, enSettings, enMatches, enChat, enPremium, enLocation, enNavigation;

try {
  koCommon = require('../../locales/ko/common.json');
  koAuth = require('../../locales/ko/auth.json');
  koGroup = require('../../locales/ko/group.json');
  koMatching = require('../../locales/ko/matching.json');
  koChat = require('../../locales/ko/chat.json');
  koPayment = require('../../locales/ko/payment.json');
  koProfile = require('../../locales/ko/profile.json');
  koSettings = require('../../locales/ko/settings.json');
  koMatches = require('../../locales/ko/matches.json');
  koPremium = require('../../locales/ko/premium.json');
  koLocation = require('../../locales/ko/location.json');
  koNavigation = require('../../locales/ko/navigation.json');
  
  enCommon = require('../../locales/en/common.json');
  enAuth = require('../../locales/en/auth.json');
  enGroup = require('../../locales/en/group.json');
  enProfile = require('../../locales/en/profile.json');
  enMatching = require('../../locales/en/matching.json');
  enSettings = require('../../locales/en/settings.json');
  enMatches = require('../../locales/en/matches.json');
  enChat = require('../../locales/en/chat.json');
  enPremium = require('../../locales/en/premium.json');
  enLocation = require('../../locales/en/location.json');
  enNavigation = require('../../locales/en/navigation.json');
} catch (error) {
  console.warn('Some translation files are missing, using defaults');
  // Default fallbacks
  koCommon = koCommon || { app: { name: 'Glimpse' } };
  koAuth = koAuth || {};
  koGroup = koGroup || {};
  koMatching = koMatching || {};
  koChat = koChat || {};
  koPayment = koPayment || {};
  koProfile = koProfile || {};
  koSettings = koSettings || {};
  koMatches = koMatches || {};
  koPremium = koPremium || {};
  koLocation = koLocation || {};
  koNavigation = koNavigation || {};
  
  enCommon = enCommon || { app: { name: 'Glimpse' } };
  enAuth = enAuth || {};
  enGroup = enGroup || {};
  enProfile = enProfile || {};
  enMatching = enMatching || {};
  enSettings = enSettings || {};
  enMatches = enMatches || {};
  enChat = enChat || {};
  enPremium = enPremium || {};
  enLocation = enLocation || {};
  enNavigation = enNavigation || {};
}

// Translation resources
const resources = {
  ko: {
    common: koCommon,
    auth: koAuth,
    group: koGroup,
    matching: koMatching,
    chat: koChat,
    payment: koPayment,
    profile: koProfile,
    settings: koSettings,
    matches: koMatches,
    premium: koPremium,
    location: koLocation,
    navigation: koNavigation,
    home: (() => { try { return require('../../locales/ko/home.json'); } catch { return {}; } })(),
  },
  en: {
    common: enCommon,
    auth: enAuth,
    group: enGroup,
    profile: enProfile,
    matching: enMatching,
    settings: enSettings,
    matches: enMatches,
    chat: enChat,
    premium: enPremium,
    location: enLocation,
    navigation: enNavigation,
    home: (() => { try { return require('../../locales/en/home.json'); } catch { return {}; } })(),
    payment: {},
  },
  // Other languages with safe fallbacks
  ja: {
    common: (() => { try { return require('../../locales/ja/common.json'); } catch { return {}; } })(),
    auth: {},
    group: {},
    matching: {},
    chat: {},
    payment: {},
    profile: {},
    settings: {},
    home: {},
    matches: {},
    premium: {},
    location: {},
    navigation: {},
  },
  zh: {
    common: (() => { try { return require('../../locales/zh/common.json'); } catch { return {}; } })(),
    auth: {},
    group: {},
    matching: {},
    chat: {},
    payment: {},
    profile: {},
    settings: {},
    home: {},
    matches: {},
    premium: {},
    location: {},
    navigation: {},
  },
  vi: {
    common: {},
    auth: {},
    group: {},
    matching: {},
    chat: {},
    payment: {},
    profile: {},
    settings: {},
    home: {},
    matches: {},
    premium: {},
    location: {},
    navigation: {},
  },
  th: {
    common: {},
    auth: {},
    group: {},
    matching: {},
    chat: {},
    payment: {},
    profile: {},
    settings: {},
    home: {},
    matches: {},
    premium: {},
    location: {},
    navigation: {},
  },
  es: {
    common: {},
    auth: {},
    group: {},
    matching: {},
    chat: {},
    payment: {},
    profile: {},
    settings: {},
    home: {},
    matches: {},
    premium: {},
    location: {},
    navigation: {},
  },
  fr: {
    common: {},
    auth: {},
    group: {},
    matching: {},
    chat: {},
    payment: {},
    profile: {},
    settings: {},
    home: {},
    matches: {},
    premium: {},
    location: {},
    navigation: {},
  },
};

// Storage helper for web compatibility
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  }
  return AsyncStorage.getItem(key);
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  return AsyncStorage.setItem(key, value);
};

// Language detection function
const detectUserLanguage = async (): Promise<SupportedLanguage> => {
  try {
    // 1. Check stored preference
    const storedLanguage = await getStorageItem(STORAGE_KEYS.USER_LANGUAGE);
    if (storedLanguage && storedLanguage in SUPPORTED_LANGUAGES) {
      return storedLanguage as SupportedLanguage;
    }

    // 2. Check device locale
    const deviceLocale = Localization.locale;
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    
    // Map device locale to supported language
    const languageMap: Record<string, SupportedLanguage> = {
      'ko': 'ko',
      'en': 'en',
      'ja': 'ja',
      'zh': 'zh',
      'vi': 'vi',
      'th': 'th',
      'es': 'es',
      'fr': 'fr',
    };

    if (languageCode in languageMap) {
      return languageMap[languageCode];
    }

    // 3. Return default language
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('Error detecting language:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Initialize i18n
export const initI18n = async () => {
  const detectedLanguage = await detectUserLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: detectedLanguage,
      fallbackLng: FALLBACK_LANGUAGE,
      defaultNS: 'common',
      ns: ['common', 'auth', 'group', 'matching', 'chat', 'payment', 'profile', 'settings', 'home', 'matches', 'premium', 'location', 'navigation'],
      
      interpolation: {
        escapeValue: false, // React Native already escapes values
      },
      
      react: {
        useSuspense: false,
      },
      
      debug: __DEV__,
      
      // Pluralization
      pluralSeparator: '_',
      contextSeparator: '_',
      
      // Missing key handler
      saveMissing: __DEV__,
      missingKeyHandler: (lngs, ns, key, fallbackValue) => {
        if (__DEV__) {
          console.warn(`Missing translation: ${lngs.join(', ')} - ${ns}:${key}`);
        }
      },
    });

  return i18n;
};

// Change language function
export const changeLanguage = async (language: SupportedLanguage) => {
  try {
    await setStorageItem(STORAGE_KEYS.USER_LANGUAGE, language);
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language || DEFAULT_LANGUAGE) as SupportedLanguage;
};

// Format number based on locale
export const formatNumber = (num: number): string => {
  const locale = getCurrentLanguage();
  return new Intl.NumberFormat(locale).format(num);
};

// Format currency based on locale
export const formatCurrency = (amount: number, currency?: string): string => {
  const locale = getCurrentLanguage();
  const currencyMap: Record<SupportedLanguage, string> = {
    'ko': 'KRW',
    'en': 'USD',
    'ja': 'JPY',
    'zh': 'CNY',
    'vi': 'VND',
    'th': 'THB',
    'es': 'EUR',
    'fr': 'EUR',
  };
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || currencyMap[locale] || 'KRW',
  }).format(amount);
};

// Format date based on locale
export const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const locale = getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } else {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(dateObj);
  }
};

// Format relative time
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return i18n.t('common:time.justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return i18n.t('common:time.minute', { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return i18n.t('common:time.hour', { count: hours });
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return i18n.t('common:time.day', { count: days });
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return i18n.t('common:time.week', { count: weeks });
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return i18n.t('common:time.month', { count: months });
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return i18n.t('common:time.year', { count: years });
  }
};

export default i18n;
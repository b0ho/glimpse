import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
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
let koCommon, koAuth, koGroup, koMatching, koChat, koPayment, koProfile, koSettings, koMatches, koPremium, koLocation, koNavigation, koCall, koStory, koDev, koPersona, koNotification, koNearbyGroups;
let enCommon, enAuth, enGroup, enProfile, enMatching, enSettings, enMatches, enChat, enPremium, enLocation, enNavigation, enCall, enStory, enDev, enPersona, enNotification, enNearbyGroups;

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
  koCall = require('../../locales/ko/call.json');
  koStory = require('../../locales/ko/story.json');
  koDev = require('../../locales/ko/dev.json');
  koPersona = require('../../locales/ko/persona.json');
  koNotification = require('../../locales/ko/notification.json');
  koNearbyGroups = require('../../locales/ko/nearbygroups.json');
  
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
  enCall = require('../../locales/en/call.json');
  enStory = require('../../locales/en/story.json');
  enDev = require('../../locales/en/dev.json');
  enPersona = require('../../locales/en/persona.json');
  enNotification = require('../../locales/en/notification.json');
  enNearbyGroups = require('../../locales/en/nearbygroups.json');
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
  koCall = koCall || {};
  koStory = koStory || {};
  koDev = koDev || {};
  koPersona = koPersona || {};
  koNotification = koNotification || {};
  koNearbyGroups = koNearbyGroups || {};
  
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
  enCall = enCall || {};
  enStory = enStory || {};
  enDev = enDev || {};
  enPersona = enPersona || {};
  enNotification = enNotification || {};
  enNearbyGroups = enNearbyGroups || {};
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
    call: koCall,
    story: koStory,
    dev: koDev,
    persona: koPersona,
    notification: koNotification,
    nearbygroups: koNearbyGroups,
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
    call: enCall,
    story: enStory,
    dev: enDev,
    persona: enPersona,
    notification: enNotification,
    nearbygroups: enNearbyGroups,
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

// Language detection function with Android-specific handling
const detectUserLanguage = async (): Promise<SupportedLanguage> => {
  try {
    // 1. Check stored preference
    const storedLanguage = await getStorageItem(STORAGE_KEYS.USER_LANGUAGE);
    if (storedLanguage && storedLanguage in SUPPORTED_LANGUAGES) {
      console.log('[i18n] Using stored language:', storedLanguage);
      return storedLanguage as SupportedLanguage;
    }

    // 2. Android-specific locale detection
    let deviceLocale = 'ko'; // Default to Korean
    
    if (Platform.OS === 'android') {
      // Android sometimes has issues with Localization.getLocales()
      try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
          deviceLocale = locales[0]?.languageTag || 'ko';
        } else {
          // Fallback for Android when getLocales() returns empty
          deviceLocale = Localization.locale || 'ko';
        }
      } catch (androidError) {
        console.warn('[i18n] Android locale detection failed, using Korean:', androidError);
        deviceLocale = 'ko';
      }
    } else {
      // iOS and Web
      const locales = Localization.getLocales();
      deviceLocale = locales[0]?.languageTag || Localization.locale || 'ko';
    }
    
    console.log('[i18n] Detected device locale:', deviceLocale);
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
      console.log('[i18n] Mapped to supported language:', languageMap[languageCode]);
      return languageMap[languageCode];
    }

    // 3. Return default language (Korean for Korean market)
    console.log('[i18n] Using default language:', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('[i18n] Error detecting language:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Initialize i18n with Android-specific handling
export const initI18n = async () => {
  const detectedLanguage = await detectUserLanguage();

  // Android-specific: Set RTL for languages that need it
  if (Platform.OS === 'android') {
    const isRTL = ['ar', 'he', 'fa', 'ur'].includes(detectedLanguage);
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: detectedLanguage,
      fallbackLng: FALLBACK_LANGUAGE,
      defaultNS: 'common',
      ns: ['common', 'auth', 'group', 'matching', 'chat', 'payment', 'profile', 'settings', 'home', 'matches', 'premium', 'location', 'navigation', 'call', 'story', 'dev', 'persona', 'notification', 'nearbygroups'],
      
      interpolation: {
        escapeValue: false, // React Native already escapes values
      },
      
      react: {
        useSuspense: false,
        // Android-specific: Ensure re-render on language change
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '', // Prevent undefined text on Android
        transSupportBasicHtmlNodes: false, // Disable HTML parsing for Android compatibility
      },
      
      debug: __DEV__ && Platform.OS === 'android', // Extra debugging for Android
      
      // Pluralization
      pluralSeparator: '_',
      contextSeparator: '_',
      
      // Android-specific: More aggressive fallback
      load: Platform.OS === 'android' ? 'currentOnly' : 'languageOnly',
      nonExplicitSupportedLngs: true,
      cleanCode: true,
      
      // Missing key handler with Android-specific logging
      saveMissing: __DEV__,
      missingKeyHandler: (lngs, ns, key, fallbackValue) => {
        if (__DEV__) {
          console.warn(`[i18n][${Platform.OS}] Missing translation: ${lngs.join(', ')} - ${ns}:${key}`);
        }
      },
      
      // Android-specific: Return key as fallback instead of empty string
      returnEmptyString: false,
      returnNull: false,
      
      // Android compatibility options
      compatibilityJSON: 'v3',
      simplifyPluralSuffix: true,
    });

  console.log('[i18n] Initialized with language:', detectedLanguage);
  return i18n;
};

// Change language function with Android-specific handling
export const changeLanguage = async (language: SupportedLanguage) => {
  try {
    await setStorageItem(STORAGE_KEYS.USER_LANGUAGE, language);
    
    // Android-specific: Force immediate language change
    if (Platform.OS === 'android') {
      // Clear any cached translations
      i18n.services.resourceStore.data = {};
      
      // Reload resources for the new language
      Object.keys(resources[language] || {}).forEach(ns => {
        i18n.addResourceBundle(language, ns, resources[language][ns], true, true);
      });
    }
    
    await i18n.changeLanguage(language);
    
    // Android-specific: Ensure RTL is updated
    if (Platform.OS === 'android') {
      const isRTL = ['ar', 'he', 'fa', 'ur'].includes(language);
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
    
    console.log('[i18n] Language changed to:', language);
    return true;
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
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

// Format relative time with fallback for Android
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Android-specific: Provide fallbacks when translations are not loaded
  const safeT = (key: string, options?: any) => {
    const translation = i18n.t(key, options);
    // If translation returns the key itself, provide a fallback
    if (translation === key) {
      if (key.includes('justNow')) return '방금 전';
      if (key.includes('minute')) return `${options?.count || 1}분 전`;
      if (key.includes('hour')) return `${options?.count || 1}시간 전`;
      if (key.includes('day')) return `${options?.count || 1}일 전`;
      if (key.includes('week')) return `${options?.count || 1}주 전`;
      if (key.includes('month')) return `${options?.count || 1}개월 전`;
      if (key.includes('year')) return `${options?.count || 1}년 전`;
    }
    return translation;
  };
  
  if (diffInSeconds < 60) {
    return safeT('common:time.justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return safeT('common:time.minute', { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return safeT('common:time.hour', { count: hours });
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return safeT('common:time.day', { count: days });
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return safeT('common:time.week', { count: weeks });
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return safeT('common:time.month', { count: months });
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return safeT('common:time.year', { count: years });
  }
};

// Android-specific: Helper function to ensure i18n is ready
export const ensureI18nReady = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Wait for i18n to be fully initialized
    let retries = 0;
    while (!i18n.isInitialized && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (!i18n.isInitialized) {
      console.warn('[i18n] Android: Failed to initialize after retries');
      // Force initialization with default language
      await initI18n();
    }
  }
  return i18n.isInitialized;
};

// Android-specific: Safe translation function
export const safeTranslate = (key: string, options?: any): string => {
  try {
    const translation = i18n.t(key, options);
    // If translation returns the key itself on Android, try with fallback
    if (Platform.OS === 'android' && translation === key) {
      // Try with namespace prefix if not already included
      if (!key.includes(':')) {
        const commonTranslation = i18n.t(`common:${key}`, options);
        if (commonTranslation !== `common:${key}`) {
          return commonTranslation;
        }
      }
      // Return a user-friendly fallback
      console.warn(`[i18n][Android] Missing translation for: ${key}`);
      return key.split('.').pop() || key; // Return last part of the key as fallback
    }
    return translation;
  } catch (error) {
    console.error(`[i18n] Translation error for key ${key}:`, error);
    return key.split('.').pop() || key;
  }
};

export default i18n;
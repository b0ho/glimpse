import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

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

// Import translations using static imports
import koCommon from '../../locales/ko/common.json';
import koAuth from '../../locales/ko/auth.json';
import koGroup from '../../locales/ko/group.json';
import koMatching from '../../locales/ko/matching.json';
import koChat from '../../locales/ko/chat.json';
import koPayment from '../../locales/ko/payment.json';
import koProfile from '../../locales/ko/profile.json';
import koSettings from '../../locales/ko/settings.json';
import koMatches from '../../locales/ko/matches.json';
import koPremium from '../../locales/ko/premium.json';
import koLocation from '../../locales/ko/location.json';
import koNavigation from '../../locales/ko/navigation.json';
import koCall from '../../locales/ko/call.json';
import koStory from '../../locales/ko/story.json';
import koDev from '../../locales/ko/dev.json';
import koPersona from '../../locales/ko/persona.json';
import koNotification from '../../locales/ko/notification.json';
import koNearbyGroups from '../../locales/ko/nearbygroups.json';
import koHome from '../../locales/ko/home.json';
import koPost from '../../locales/ko/post.json';
import koCommunity from '../../locales/ko/community.json';
import koGroupChat from '../../locales/ko/groupchat.json';
import koInstant from '../../locales/ko/instant.json';
import koInterest from '../../locales/ko/interest.json';
import koMap from '../../locales/ko/map.json';
import koMyInfo from '../../locales/ko/myinfo.json';
import koNearbyUsers from '../../locales/ko/nearbyusers.json';
import koNotifications from '../../locales/ko/notifications.json';
import koOnboarding from '../../locales/ko/onboarding.json';
import koProfileMode from '../../locales/ko/profilemode.json';
import koPrivacy from '../../locales/ko/privacy.json';
import koSupport from '../../locales/ko/support.json';
import koTerms from '../../locales/ko/terms.json';

import enCommon from '../../locales/en/common.json';
import enAuth from '../../locales/en/auth.json';
import enGroup from '../../locales/en/group.json';
import enProfile from '../../locales/en/profile.json';
import enMatching from '../../locales/en/matching.json';
import enSettings from '../../locales/en/settings.json';
import enMatches from '../../locales/en/matches.json';
import enChat from '../../locales/en/chat.json';
import enPremium from '../../locales/en/premium.json';
import enLocation from '../../locales/en/location.json';
import enNavigation from '../../locales/en/navigation.json';
import enCall from '../../locales/en/call.json';
import enStory from '../../locales/en/story.json';
import enDev from '../../locales/en/dev.json';
import enPersona from '../../locales/en/persona.json';
import enNotification from '../../locales/en/notification.json';
import enNearbyGroups from '../../locales/en/nearbygroups.json';
import enHome from '../../locales/en/home.json';
import enPost from '../../locales/en/post.json';
import enCommunity from '../../locales/en/community.json';
import enGroupChat from '../../locales/en/groupchat.json';
import enInstant from '../../locales/en/instant.json';
import enInterest from '../../locales/en/interest.json';
import enMap from '../../locales/en/map.json';
import enMyInfo from '../../locales/en/myinfo.json';
import enNearbyUsers from '../../locales/en/nearbyusers.json';
import enNotifications from '../../locales/en/notifications.json';
import enOnboarding from '../../locales/en/onboarding.json';
import enProfileMode from '../../locales/en/profilemode.json';
import enPrivacy from '../../locales/en/privacy.json';
import enSupport from '../../locales/en/support.json';
import enTerms from '../../locales/en/terms.json';
import enPayment from '../../locales/en/payment.json';
import koMyGroups from '../../locales/ko/mygroups.json';
import enMyGroups from '../../locales/en/mygroups.json';

// Translation resources
console.log('[i18n] Initializing with languages:', Object.keys({ ko: {}, en: {} }));
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
    home: koHome,
    call: koCall,
    story: koStory,
    dev: koDev,
    persona: koPersona,
    notification: koNotification,
    nearbygroups: koNearbyGroups,
    post: koPost,
    community: koCommunity,
    groupchat: koGroupChat,
    instant: koInstant,
    interest: koInterest,
    map: koMap,
    myinfo: koMyInfo,
    nearbyusers: koNearbyUsers,
    notifications: koNotifications,
    onboarding: koOnboarding,
    profilemode: koProfileMode,
    privacy: koPrivacy,
    support: koSupport,
    terms: koTerms,
    mygroups: koMyGroups,
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
    home: enHome,
    payment: enPayment,
    call: enCall,
    story: enStory,
    dev: enDev,
    persona: enPersona,
    notification: enNotification,
    nearbygroups: enNearbyGroups,
    post: enPost,
    community: enCommunity,
    groupchat: enGroupChat,
    instant: enInstant,
    interest: enInterest,
    map: enMap,
    myinfo: enMyInfo,
    nearbyusers: enNearbyUsers,
    notifications: enNotifications,
    onboarding: enOnboarding,
    profilemode: enProfileMode,
    privacy: enPrivacy,
    support: enSupport,
    terms: enTerms,
    mygroups: enMyGroups,
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
      console.log('[i18n] Using stored language:', storedLanguage);
      return storedLanguage as SupportedLanguage;
    }

    // 2. Device locale detection
    let deviceLocale = 'ko'; // Default to Korean
    
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        deviceLocale = locales[0]?.languageTag || 'ko';
      } else {
        // Fallback to locale property with type assertion for compatibility
        deviceLocale = (Localization as any).locale || 'ko';
      }
    } catch (localizationError) {
      console.warn('[i18n] Locale detection failed, using Korean:', localizationError);
      deviceLocale = 'ko';
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

    console.log('[i18n] Using default language:', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('[i18n] Error detecting language:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Initialize i18n
export const initI18n = async () => {
  const detectedLanguage = await detectUserLanguage();

  // Debug: Log what resources are available
  console.log('[i18n] Available namespaces for en:', Object.keys(resources.en));
  console.log('[i18n] Home namespace exists?', !!resources.en.home);
  console.log('[i18n] Navigation namespace exists?', !!resources.en.navigation);
  console.log('[i18n] Navigation content (first 200 chars):', JSON.stringify(resources.en.navigation).substring(0, 200));
  console.log('[i18n] Home content (first 200 chars):', JSON.stringify(resources.en.home).substring(0, 200));
  console.log('[i18n] Common time exists?', !!resources.en.common?.time);
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: detectedLanguage,
      fallbackLng: FALLBACK_LANGUAGE,
      defaultNS: 'common',
      ns: [
        'common', 'auth', 'group', 'matching', 'chat', 'payment', 'profile', 
        'settings', 'home', 'matches', 'premium', 'location', 'navigation', 
        'call', 'story', 'dev', 'persona', 'notification', 'nearbygroups',
        'post', 'community', 'groupchat', 'instant', 'interest', 'map', 
        'myinfo', 'nearbyusers', 'notifications', 'onboarding', 'profilemode', 
        'privacy', 'support', 'terms', 'mygroups'
      ],
      
      interpolation: {
        escapeValue: false,
      },
      
      react: {
        useSuspense: false,
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
      },
      
      debug: __DEV__,
      
      // Missing key handler
      saveMissing: __DEV__,
      missingKeyHandler: (lngs, ns, key, _fallbackValue) => {
        if (__DEV__) {
          console.warn(`[i18n][${Platform.OS}] Missing translation: ${lngs.join(', ')} - ${ns}:${key}`);
        }
      },
      
      returnEmptyString: false,
      returnNull: false,
    });

  console.log('[i18n] Initialized with language:', detectedLanguage);
  return i18n;
};

// Change language function
export const changeLanguage = async (language: SupportedLanguage) => {
  try {
    await setStorageItem(STORAGE_KEYS.USER_LANGUAGE, language);
    await i18n.changeLanguage(language);
    console.log('[i18n] Language changed to:', language);
    return true;
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
    return false;
  }
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language || DEFAULT_LANGUAGE) as SupportedLanguage;
};

// Ensure i18n is ready
export const ensureI18nReady = async (): Promise<void> => {
  if (!i18n.isInitialized) {
    await initI18n();
  }
};

export default i18n;
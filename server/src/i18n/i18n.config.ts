import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';
import path from 'path';
// Type definitions for i18n
export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko';
export const FALLBACK_LANGUAGE: SupportedLanguage = 'ko';

// Initialize i18next for server
export const initI18n = async () => {
  await i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      },
      detection: {
        order: ['header', 'querystring', 'cookie'],
        lookupHeader: 'accept-language',
        lookupQuerystring: 'lang',
        lookupCookie: 'i18next',
        caches: ['cookie'],
      },
      fallbackLng: FALLBACK_LANGUAGE,
      preload: ['ko', 'en', 'ja', 'zh', 'vi', 'th', 'es', 'fr'],
      ns: ['common', 'errors', 'success', 'notifications'],
      defaultNS: 'common',
      saveMissing: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18next;
};

// Get middleware
export const getI18nMiddleware = () => i18nextMiddleware.handle(i18next);

// Helper function to get localized message
export const getLocalizedMessage = (
  req: any,
  key: string,
  namespace: string = 'common',
  options?: any
): string => {
  return req.t(`${namespace}:${key}`, options);
};

// Helper function to get user's preferred language
export const getUserLanguage = (req: any): SupportedLanguage => {
  const detectedLang = req.language || DEFAULT_LANGUAGE;
  const supportedLangs: SupportedLanguage[] = ['ko', 'en', 'ja', 'zh', 'vi', 'th', 'es', 'fr'];
  
  // Check if detected language is supported
  if (supportedLangs.includes(detectedLang as SupportedLanguage)) {
    return detectedLang as SupportedLanguage;
  }
  
  // Check if language code matches (e.g., 'en-US' -> 'en')
  const langCode = detectedLang.split('-')[0];
  if (supportedLangs.includes(langCode as SupportedLanguage)) {
    return langCode as SupportedLanguage;
  }
  
  return DEFAULT_LANGUAGE;
};

// Format localized response
export const formatLocalizedResponse = <T>(
  req: any,
  data: T,
  messageKey?: string,
  namespace: string = 'success'
) => {
  const locale = getUserLanguage(req);
  const message = messageKey ? getLocalizedMessage(req, messageKey, namespace) : undefined;
  
  return {
    success: true,
    data,
    message,
    locale,
  };
};

// Format localized error
export const formatLocalizedError = (
  req: any,
  errorKey: string,
  statusCode: number = 400,
  namespace: string = 'errors'
) => {
  const locale = getUserLanguage(req);
  const message = getLocalizedMessage(req, errorKey, namespace);
  
  return {
    success: false,
    error: {
      code: errorKey,
      message,
      statusCode,
    },
    locale,
  };
};
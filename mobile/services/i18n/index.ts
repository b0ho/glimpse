// Re-export i18n utilities that are actually exported from i18n.ts
export {
  initI18n,
  changeLanguage,
  getCurrentLanguage,
  ensureI18nReady,
} from './i18n';

// Export i18n instance as default
import i18n from './i18n';
export default i18n;
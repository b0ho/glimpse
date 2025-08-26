// Re-export all i18n utilities
export {
  initI18n,
  changeLanguage,
  getCurrentLanguage,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  ensureI18nReady,
  safeTranslate,
  default
} from './i18n';

// Export i18n instance as default
import i18n from './i18n';
export default i18n;
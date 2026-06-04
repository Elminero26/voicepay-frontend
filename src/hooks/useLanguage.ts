import { useTranslation } from 'react-i18next';

export type SupportedLanguage = 'es' | 'en';

/**
 * Custom hook that wraps useTranslation and exposes a typed `changeLanguage`
 * helper for switching between the supported languages.
 *
 * Usage:
 *   const { t, language, changeLanguage } = useLanguage();
 *   t('users.title')            // → "User Management" / "Gestión de Usuarios"
 *   changeLanguage('en')        // persisted via LanguageDetector → localStorage
 */
export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return {
    t,
    i18n,
    language: i18n.language as SupportedLanguage,
    changeLanguage,
  };
};

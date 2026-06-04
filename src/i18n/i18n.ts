import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';

/**
 * VP-17: i18n Infrastructure Configuration
 *
 * Supports: 'es' (Spanish, default) and 'en' (English).
 * Language is auto-detected from the browser and persisted in localStorage.
 * Fallback language is Spanish ('es').
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Inline resource bundles — no HTTP backend needed (Vite bundles them)
    resources: {
      es: { translation: es },
      en: { translation: en },
    },

    // Supported languages
    supportedLngs: ['es', 'en'],

    // Fallback to Spanish if detected language is not supported
    fallbackLng: 'es',

    // Language detection configuration
    detection: {
      // Detection order: localStorage → browser navigator language
      order: ['localStorage', 'navigator'],
      // Key used to persist the selected language in localStorage
      lookupLocalStorage: 'voicepay_language',
      // Cache detected language in localStorage
      caches: ['localStorage'],
    },

    interpolation: {
      // React already escapes values — no need for i18next to do it too
      escapeValue: false,
    },

    // Namespace configuration — using single default namespace
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;

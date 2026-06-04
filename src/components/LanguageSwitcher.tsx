import React from 'react';
import { cn } from '../utils/cn';
import { useLanguage, type SupportedLanguage } from '../hooks/useLanguage';

interface LanguageSwitcherProps {
  /** Display as compact pill buttons (default) or as a dropdown */
  variant?: 'pill' | 'dropdown';
  className?: string;
}

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

/**
 * LanguageSwitcher — VP-17
 *
 * Renders a compact pill toggle for switching between Spanish and English.
 * The active language is persisted via i18next-browser-languagedetector
 * (stored in `voicepay_language` localStorage key).
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'pill',
  className,
}) => {
  const { language, changeLanguage } = useLanguage();

  if (variant === 'dropdown') {
    return (
      <select
        id="language-switcher-select"
        value={language}
        onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
        className={cn(
          'bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
          className
        )}
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-secondary">
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-0.5 bg-black/20 p-0.5 rounded-lg border border-border',
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          id={`lang-btn-${lang.code}`}
          type="button"
          onClick={() => changeLanguage(lang.code)}
          aria-pressed={language === lang.code}
          title={lang.code === 'es' ? 'Español' : 'English'}
          className={cn(
            'flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-200',
            language === lang.code
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
};

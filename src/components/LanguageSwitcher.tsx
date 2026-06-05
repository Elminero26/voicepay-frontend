import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { useLanguage, type SupportedLanguage } from '../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSwitcherProps {
  /** Display as compact pill buttons (default), as a dropdown, or as a floating button */
  variant?: 'pill' | 'dropdown' | 'floating';
  className?: string;
}

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

/**
 * LanguageSwitcher — VP-17 & VP-18
 *
 * Renders a compact pill toggle, dropdown, or premium floating button
 * for switching between Spanish and English.
 * The active language is persisted via i18next-browser-languagedetector
 * (stored in `voicepay_language` localStorage key).
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'pill',
  className,
}) => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

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

  if (variant === 'floating') {
    const activeLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
    return (
      <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5', className)}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="glass border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[140px] flex flex-col gap-1.5 backdrop-blur-xl bg-background/90"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-wider',
                    language === lang.code
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 border border-primary/40'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base select-none">{lang.flag}</span>
                    <span>{lang.code === 'es' ? 'Español' : 'English'}</span>
                  </span>
                  {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          id="floating-lang-switcher"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full glass border border-white/10 hover:border-primary/40 flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-[#0e1017]/85 hover:bg-[#131722]/95 relative group cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Toggle language menu"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="flex items-center justify-center select-none text-xl"
          >
            {activeLang.flag}
          </motion.div>
        </button>
      </div>
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


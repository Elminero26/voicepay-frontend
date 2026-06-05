import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../utils/cn';

interface ThemeSwitcherProps {
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      id="theme-switcher-btn"
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center p-2 rounded-xl border border-border bg-black/10 hover:bg-black/20 transition-all duration-300 group cursor-pointer overflow-hidden w-9 h-9',
        className
      )}
      title={theme === 'light' ? t('common.theme.dark') : t('common.theme.light')}
      aria-label={t('common.theme.toggle')}
    >
      <motion.div
        key={theme}
        initial={{ y: -20, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center justify-center"
      >
        {theme === 'light' ? (
          <Sun size={18} className="text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
        ) : (
          <Moon size={18} className="text-indigo-400 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </motion.div>
    </button>
  );
};

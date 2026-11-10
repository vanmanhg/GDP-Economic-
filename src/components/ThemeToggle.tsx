import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDarkMode, toggleTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 transition-all ${className}`}
      role="group"
      aria-label="Theme mode switcher"
    >
      {/* Light Mode Option Button */}
      <button
        type="button"
        id="theme-toggle-light-btn"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
          !isDarkMode
            ? 'bg-white text-amber-950 dark:text-slate-100 shadow-2xs border border-amber-200/80'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Switch to Light Mode (Press D)"
        aria-pressed={!isDarkMode}
        aria-label="Light mode"
      >
        <Sun
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            !isDarkMode ? 'text-amber-500 scale-110 rotate-12' : 'text-slate-400'
          }`}
        />
        <span className="hidden sm:inline text-xs font-medium">
          {t('lightMode')}
        </span>
      </button>

      {/* Dark Mode Option Button */}
      <button
        type="button"
        id="theme-toggle-dark-btn"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
          isDarkMode
            ? 'bg-slate-900 text-indigo-200 shadow-2xs border border-indigo-500/40'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Switch to Dark Mode (Press D)"
        aria-pressed={isDarkMode}
        aria-label="Dark mode"
      >
        <Moon
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            isDarkMode ? 'text-indigo-400 scale-110 -rotate-12' : 'text-slate-400'
          }`}
        />
        <span className="hidden sm:inline text-xs font-medium">
          {t('darkMode')}
        </span>
      </button>

      {/* Keyboard Shortcut Hint Tag */}
      <kbd
        className="hidden xl:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-white/70 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200/80 dark:border-slate-700/80 ml-1 mr-0.5 cursor-pointer"
        onClick={toggleTheme}
        title="Click or press 'D' on keyboard to toggle theme mode anytime"
      >
        D
      </kbd>
    </div>
  );
}

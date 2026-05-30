'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 shadow-sm"
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <Sun className="h-5 w-5 text-amber-500 animate-spin-slow" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600" />
      )}
    </button>
  );
};

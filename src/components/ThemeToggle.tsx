'use client';

import React from 'react';
import { Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  return (
    <div
      className="p-2.5 rounded-xl border border-slate-800/50 bg-slate-900/60 text-indigo-400 shadow-sm flex items-center justify-center select-none"
      title="Dark Mode Permanently Active"
    >
      <Moon className="h-5 w-5 text-indigo-400" />
    </div>
  );
};

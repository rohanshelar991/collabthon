'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const resolvedTheme =
      storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(resolvedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [mounted, theme]);

  const value = useMemo(
    () => ({ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeToggleButton() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  return (
    <button
      onClick={ctx.toggle}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-600 shadow-[0_14px_32px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
      aria-label="Toggle theme"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
        {ctx.theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
      </span>
      <span className="hidden sm:inline">{ctx.theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}

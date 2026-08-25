'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ThemeToggle({ className = '', size = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={`h-9 w-9 rounded-2xl ${className}`}
        aria-label="Ganti Tema"
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`h-9 w-9 rounded-2xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer ${className}`}
      title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      aria-label="Ganti Tema Tampilan"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700 animate-in spin-in-180 duration-200" />
      )}
    </Button>
  );
}

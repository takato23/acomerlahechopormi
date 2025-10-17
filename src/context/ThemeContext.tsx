import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Leer el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    // Determinar el tema real basado en la preferencia del sistema
    const getSystemTheme = (): 'light' | 'dark' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    let newActualTheme: 'light' | 'dark';

    if (theme === 'system') {
      newActualTheme = getSystemTheme();
    } else {
      newActualTheme = theme;
    }

    setActualTheme(newActualTheme);

    // Aplicar el tema al DOM
    root.classList.remove('light', 'dark');
    root.classList.add(newActualTheme);

    // Guardar en localStorage
    localStorage.setItem('theme', theme);

  }, [theme]);

  // Escuchar cambios en la preferencia del sistema cuando el tema está en 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const root = window.document.documentElement;
      const newActualTheme = mediaQuery.matches ? 'dark' : 'light';

      setActualTheme(newActualTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(newActualTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

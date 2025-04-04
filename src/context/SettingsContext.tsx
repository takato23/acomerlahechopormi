import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage'; // Importamos el hook

// 1. Definición de Tipos
export type FontSize = 'normal' | 'large' | 'extra-large';

interface Settings {
  fontSize: FontSize;
}

interface SettingsContextProps {
  settings: Settings;
  setFontSize: (size: FontSize) => void;
}

// Valor inicial por defecto para el contexto (cuando no hay Provider)
const defaultSettings: Settings = {
  fontSize: 'normal',
};

// 2. Crear el Contexto
// Usamos un valor inicial que indique que no se está dentro de un Provider si es null
const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

// 3. Crear el Provider
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Usamos useLocalStorage para persistir la preferencia fontSize
  const [fontSize, setFontSizeInternal] = useLocalStorage<FontSize>(
    'app-settings-fontSize', // Key para localStorage
    defaultSettings.fontSize // Valor inicial
  );

  // Creamos el objeto de settings actual
  const settings: Settings = {
    fontSize,
  };

  // Función memoizada para actualizar el tamaño de fuente
  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeInternal(size);
  }, [setFontSizeInternal]);

  // Valor a proveer por el contexto
  const contextValue: SettingsContextProps = {
    settings,
    setFontSize,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// 4. Crear el Hook Consumidor
export const useSettings = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    // Error si se usa fuera del Provider
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
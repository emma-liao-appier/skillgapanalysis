import React, { createContext, useContext, ReactNode } from 'react';
import translations from '../lib/translations';
import { LanguageCode } from '../types';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, replacements?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode; value: Omit<LanguageContextType, 't'> }> = ({ children, value }) => {
  const t = (key: string, replacements?: { [key: string]: string }) => {
    let translation = translations[value.language]?.[key] || translations.en[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        });
    }
    return translation;
  };
  
  const contextValue = { ...value, t };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

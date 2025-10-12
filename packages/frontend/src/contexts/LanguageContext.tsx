import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type SupportedLanguage = 'en' | 'hi' | 'as';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const supportedLanguages: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    direction: 'ltr',
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    direction: 'ltr',
  },
];

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  languageInfo: LanguageInfo;
  changeLanguage: (language: SupportedLanguage) => void;
  supportedLanguages: LanguageInfo[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Initialize language from i18n
    const initialLanguage = i18n.language as SupportedLanguage;
    if (supportedLanguages.some(lang => lang.code === initialLanguage)) {
      setCurrentLanguage(initialLanguage);
    }
  }, [i18n.language]);

  const changeLanguage = async (language: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Update document direction and language attributes
      const languageInfo = supportedLanguages.find(lang => lang.code === language);
      if (languageInfo) {
        document.documentElement.lang = language;
        document.documentElement.dir = languageInfo.direction;
      }
      
      // Store preference in localStorage
      localStorage.setItem('preferred-language', language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const languageInfo = supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];
  const isRTL = languageInfo.direction === 'rtl';

  const value: LanguageContextType = {
    currentLanguage,
    languageInfo,
    changeLanguage,
    supportedLanguages,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
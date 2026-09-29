import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupportedLanguages, getLanguageByCode, setCurrentLanguage, getCurrentLanguage } from './languages';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => getCurrentLanguage());

  useEffect(() => {
    setCurrentLanguage(language.code);
    document.documentElement.lang = language.code;
  }, [language.code]);

  const setLanguage = useCallback((code) => {
    const lang = getLanguageByCode(code);
    setLanguageState(lang);
  }, []);

  const t = useCallback((translations, fallbackLang = 'en') => {
    if (!translations) return '';
    if (translations[language.code]) return translations[language.code];
    if (translations[fallbackLang]) return translations[fallbackLang];
    const firstKey = Object.keys(translations)[0];
    return translations[firstKey] || '';
  }, [language.code]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: getSupportedLanguages() }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
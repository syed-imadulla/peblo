import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('peblo_pref_lang');
    return saved ? saved.toLowerCase() : 'en';
  });

  const setLanguage = (lang) => {
    const normalized = (lang || 'en').toLowerCase();
    setCurrentLang(normalized);
    localStorage.setItem('peblo_pref_lang', normalized);
  };

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'peblo_pref_lang' && e.newValue) {
        setCurrentLang(e.newValue.toLowerCase());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      currentLang: (localStorage.getItem('peblo_pref_lang') || 'en').toLowerCase(),
      setLanguage: (lang) => localStorage.setItem('peblo_pref_lang', (lang || 'en').toLowerCase()),
    };
  }
  return context;
};

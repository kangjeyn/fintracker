import { createContext, useContext, useState, useEffect } from 'react';
import idLang from '../i18n/id';
import enLang from '../i18n/en';

const LanguageContext = createContext();

const languages = { id: idLang, en: enLang };

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('finTracker_lang') || 'id');

  useEffect(() => {
    localStorage.setItem('finTracker_lang', lang);
  }, [lang]);

  const t = (key) => languages[lang]?.[key] || key;

  const toggleLang = () => setLang(prev => prev === 'id' ? 'en' : 'id');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);

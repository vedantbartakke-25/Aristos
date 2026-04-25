import { createContext, useContext, useState } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import mr from "../locales/mr.json";

const locales = { EN: en, HI: hi, MR: mr };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("EN");
  const t = locales[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

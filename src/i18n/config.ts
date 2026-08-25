import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import it from './locales/it.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ar from './locales/ar.json';
import ka from './locales/ka.json';
import hi from './locales/hi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      de: { translation: de },
      zh: { translation: zh },
      ja: { translation: ja },
      ar: { translation: ar },
      ka: { translation: ka },
      hi: { translation: hi }
    },
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;

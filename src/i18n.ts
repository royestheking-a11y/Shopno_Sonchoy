import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import bnTranslation from './locales/bn.json';

// Retrieve saved language from localStorage, default to English
const savedLanguage = localStorage.getItem('shopno_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      bn: {
        translation: bnTranslation
      }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Save to localStorage when language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('shopno_lang', lng);
});

export default i18n;

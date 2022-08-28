import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import i18nextHttpBackend from 'i18next-http-backend';

i18n.use(i18nextHttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        whitelist: ['en', 'es'],
        supportedLngs: ['en', 'es'],
        nonExplicitSupportedLngs: true,
        fallbackLng: 'en',
        load: 'languageOnly',
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: `${process.env.PUBLIC_URL}/locales/{{lng}}/{{ns}}.json`,
        },
    });

export default i18n;

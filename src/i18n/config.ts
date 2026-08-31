import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// L'italiano è il fallback e serve sempre: resta nel bundle iniziale.
// Le altre nove lingue venivano importate staticamente qui, quindi ~80 KB di
// JSON viaggiavano con la prima schermata anche per chi ne usa una sola.
import it from './locales/it.json';

export const SUPPORTED_LANGUAGES = ['it', 'en', 'fr', 'es', 'de', 'zh', 'ja', 'ar', 'ka', 'hi'] as const;

// import.meta.glob senza `eager`: Vite trasforma ogni file in un chunk a parte,
// scaricato solo quando la lingua viene effettivamente richiesta.
// it.json e escluso: e gia importato staticamente sopra e includerlo qui
// produrrebbe solo un avviso di import dinamico inefficace.
const loaders = import.meta.glob<{ default: Record<string, unknown> }>([
  './locales/*.json',
  '!./locales/it.json',
]);

async function loadLanguage(lng: string): Promise<void> {
  if (lng === 'it' || i18n.hasResourceBundle(lng, 'translation')) return;

  const loader = loaders[`./locales/${lng}.json`];
  if (!loader) return;

  try {
    const mod = await loader();
    i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
  } catch (err) {
    // Rete assente o chunk mancante: si resta sul fallback italiano.
    console.warn(`Traduzioni non caricate per "${lng}":`, err);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { it: { translation: it } },
    supportedLngs: SUPPORTED_LANGUAGES,
    // Normalizza it-IT / en-GB a it / en, così la chiave combacia col file.
    load: 'languageOnly',
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
    react: {
      // Senza questo react-i18next non si accorge di addResourceBundle e i
      // testi resterebbero in italiano finché non si cambia lingua a mano.
      bindI18nStore: 'added',
    },
  });

// Lingua rilevata all'avvio, e ogni cambio successivo.
void loadLanguage(i18n.language);
i18n.on('languageChanged', (lng) => {
  void loadLanguage(lng);
});

// Senza questo l'arabo resta impaginato da sinistra e <html lang> mente a Google
const applicaLingua = (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
};

applicaLingua(i18n.resolvedLanguage || 'it');
i18n.on('languageChanged', applicaLingua);

export default i18n;

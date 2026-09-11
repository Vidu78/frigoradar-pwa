// Istruzione di lingua da accodare ai prompt Gemini: i testi liberi seguono la
// lingua dell'app, i valori a scelta fissa (category, storage_type, health_score...)
// restano quelli dello schema perche' il client li usa come chiavi.
const NOMI: Record<string, string> = {
  it: 'italiano', en: 'English', fr: 'français', es: 'español', de: 'Deutsch',
  zh: '中文 (简体)', ja: '日本語', ar: 'العربية', ka: 'ქართული', hi: 'हिन्दी',
};

export function nomeLingua(language?: string): string {
  const code = String(language || 'it').toLowerCase().split('-')[0];
  return NOMI[code] || NOMI.it;
}

export function istruzioneLingua(language?: string): string {
  return `
LINGUA DI OUTPUT: ${nomeLingua(language)}. Tutti i testi liberi destinati all'utente (nomi, descrizioni, ingredienti, titoli, passaggi, note) vanno scritti in questa lingua.
ECCEZIONE: i campi a valori fissi indicati nello schema (category, storage_type, health_score, date_source, difficulty, unit) restano ESATTAMENTE con i valori elencati nello schema, senza tradurli.
`;
}

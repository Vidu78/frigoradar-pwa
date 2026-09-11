import type { TFunction } from 'i18next';

// Categorie e giudizi salute sono salvati in italiano nel DB (e prodotti dall'AI):
// il valore resta quello, cambia solo come lo mostriamo.
export const CATEGORY_KEYS: Record<string, string> = {
  'Carni e Salumi': 'meat',
  'Verdure e Frutta': 'produce',
  'Latticini e Uova': 'dairy',
  'Latticini e Ovuova': 'dairy',
  'Pesce e Frutti di Mare': 'fish',
  'Pane e Pasta': 'bakery',
  'Conserve e Sughi': 'canned',
  'Dolci e Snack': 'sweets',
  'Bevande': 'drinks',
  'Altro': 'other',
};

export function categoryLabel(category: string | null | undefined, t: TFunction): string {
  if (!category) return t('categories.other');
  const key = CATEGORY_KEYS[category];
  return key ? t(`categories.${key}`) : category;
}

const HEALTH_KEYS: Record<string, string> = {
  'Sano': 'good',
  'Moderato': 'moderate',
  'Da Limitare': 'limit',
  'Poco Sano': 'limit',
  'Sconosciuto': 'unknown',
};

export function healthLabel(value: string | null | undefined, t: TFunction): string {
  if (!value) return t('health.unknown');
  const key = HEALTH_KEYS[value];
  return key ? t(`health.${key}`) : value;
}

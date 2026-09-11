// Formati che sappiamo ridisegnare sul retro della carta (react-barcode + QR)
export type CardCodeFormat = 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'CODE39' | 'ITF14' | 'QR';

const FROM_DETECTOR: Record<string, CardCodeFormat> = {
  ean_13: 'EAN13',
  ean_8: 'EAN8',
  upc_a: 'UPC',
  upc_e: 'UPC',
  code_128: 'CODE128',
  code_39: 'CODE39',
  itf: 'ITF14',
  qr_code: 'QR',
};

/** Converte il formato riportato dal BarcodeDetector nel nostro */
export function formatFromDetector(format?: string | null): CardCodeFormat | null {
  if (!format) return null;
  return FROM_DETECTOR[format] || null;
}

const eanChecksumOk = (digits: string): boolean => {
  const body = digits.slice(0, -1);
  const check = Number(digits.at(-1));
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const weight = (body.length - i) % 2 === 0 ? 1 : 3;
    sum += Number(body[i]) * weight;
  }
  return (10 - (sum % 10)) % 10 === check;
};

/**
 * Se lo scanner non ha detto il formato (inserimento a mano, fallback iOS),
 * lo deduciamo dal valore: EAN valido → EAN, altrimenti CODE128 che accetta tutto.
 */
export function guessFormat(value: string): CardCodeFormat {
  const v = value.trim();
  if (/^\d{13}$/.test(v) && eanChecksumOk(v)) return 'EAN13';
  if (/^\d{12}$/.test(v) && eanChecksumOk(v)) return 'UPC';
  if (/^\d{8}$/.test(v) && eanChecksumOk(v)) return 'EAN8';
  if (/^https?:\/\//i.test(v) || v.length > 40) return 'QR';
  return 'CODE128';
}

/** Formato da usare al rendering: quello salvato se valido, altrimenti dedotto */
export function resolveFormat(saved: string | null | undefined, value: string): CardCodeFormat {
  const known: CardCodeFormat[] = ['EAN13', 'EAN8', 'UPC', 'CODE128', 'CODE39', 'ITF14', 'QR'];
  if (saved && known.includes(saved as CardCodeFormat)) return saved as CardCodeFormat;
  return guessFormat(value);
}

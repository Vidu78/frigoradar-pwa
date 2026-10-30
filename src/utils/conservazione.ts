// Quanto dura un alimento dopo l'apertura (in frigo) e in freezer, per categoria.
// Valori prudenziali dalle linee guida comuni (USDA FoodKeeper, EFSA): sono stime,
// l'etichetta del prodotto vince sempre. freezerMesi null = sconsigliato congelare.
const DURATE: Record<string, { apertoGiorni: number; freezerMesi: number | null }> = {
  'Carni e Salumi': { apertoGiorni: 3, freezerMesi: 3 },
  'Verdure e Frutta': { apertoGiorni: 3, freezerMesi: 8 },
  'Latticini e Ovuova': { apertoGiorni: 4, freezerMesi: 3 },
  'Pesce e Frutti di Mare': { apertoGiorni: 1, freezerMesi: 3 },
  'Pane e Pasta': { apertoGiorni: 3, freezerMesi: 3 },
  'Conserve e Sughi': { apertoGiorni: 4, freezerMesi: 3 },
  'Dolci e Snack': { apertoGiorni: 7, freezerMesi: 3 },
  'Bevande': { apertoGiorni: 3, freezerMesi: null },
  'Altro': { apertoGiorni: 3, freezerMesi: 3 },
};

export const durate = (categoria?: string | null) => DURATE[categoria || ''] || DURATE['Altro'];

const isoTra = (giorni: number, mesi = 0): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + mesi);
  d.setDate(d.getDate() + giorni);
  // data locale, non toISOString: dopo mezzanotte in Italia UTC e' ancora ieri
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Aperto oggi: la scadenza si accorcia, mai si allunga oltre quella stampata
export function scadenzaDopoApertura(categoria: string | null | undefined, scadenza: string | null): string {
  const nuova = isoTra(durate(categoria).apertoGiorni);
  return scadenza && scadenza.slice(0, 10) < nuova ? scadenza.slice(0, 10) : nuova;
}

export function scadenzaInFreezer(categoria: string | null | undefined): string | null {
  const mesi = durate(categoria).freezerMesi;
  return mesi === null ? null : isoTra(0, mesi);
}

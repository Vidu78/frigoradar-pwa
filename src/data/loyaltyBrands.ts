// Catalogo delle carte fedeltà riconosciute: colori del marchio e logo locale
// (public/brands, crediti in public/brands/CREDITS.md). Tutto bundlato, funziona offline.
export interface LoyaltyBrand {
  id: string;
  name: string;
  /** Nome del programma fedeltà stampato sulla carta */
  program: string;
  /** Colore di sfondo della carta */
  color: string;
  /** Colore del testo sulla carta */
  text: string;
  /** Percorso del logo in public/, assente = logo testuale */
  logo?: string;
  /** Come il logo va appoggiato: 'plate' su targhetta bianca, 'bare' direttamente sul colore */
  logoStyle?: 'plate' | 'bare';
  category: 'super' | 'casa' | 'moda' | 'bellezza' | 'tech' | 'carburante' | 'altro';
  /** Nomi con cui la stessa carta può essere stata salvata in passato */
  aliases?: string[];
}

export const LOYALTY_BRANDS: LoyaltyBrand[] = [
  // Supermercati
  { id: 'esselunga', name: 'Esselunga', program: 'Fìdaty', color: '#0B3C8C', text: '#fff', logo: '/brands/esselunga.svg', category: 'super' },
  { id: 'coop', name: 'Coop', program: 'Socio Coop', color: '#E30613', text: '#fff', logo: '/brands/coop.svg', category: 'super', aliases: ['Ipercoop', 'Coop Alleanza', 'Unicoop'] },
  { id: 'conad', name: 'Conad', program: 'Carta Insieme', color: '#EE7203', text: '#fff', logo: '/brands/conad.png', logoStyle: 'bare', category: 'super' },
  { id: 'carrefour', name: 'Carrefour', program: 'Carta SpesAmica', color: '#004E9F', text: '#fff', logo: '/brands/carrefour.png', logoStyle: 'bare', category: 'super', aliases: ['Carrefour Market', 'Carrefour Express'] },
  { id: 'lidl', name: 'Lidl', program: 'Lidl Plus', color: '#0050AA', text: '#fff', logo: '/brands/lidl.svg', logoStyle: 'bare', category: 'super' },
  { id: 'md', name: 'MD', program: 'Carta MD', color: '#E30613', text: '#fff', logo: '/brands/md.svg', logoStyle: 'bare', category: 'super', aliases: ['MD Discount'] },
  { id: 'penny', name: 'Penny', program: 'Carta fedeltà', color: '#CD1719', text: '#fff', logo: '/brands/penny.svg', logoStyle: 'bare', category: 'super', aliases: ['Penny Market'] },
  { id: 'pam', name: 'Pam Panorama', program: 'Carta Per Te', color: '#009540', text: '#fff', logo: '/brands/pam.svg', category: 'super', aliases: ['Pam', 'Panorama'] },
  { id: 'despar', name: 'Despar', program: 'Despar Tribù', color: '#00843D', text: '#fff', logo: '/brands/despar.svg', category: 'super', aliases: ['Eurospar', 'Interspar', 'Spar'] },
  { id: 'famila', name: 'Famila', program: 'Famila Card', color: '#E30613', text: '#fff', logo: '/brands/famila.svg', category: 'super' },
  { id: 'crai', name: 'CRAI', program: 'Carta CRAI', color: '#E2001A', text: '#fff', logo: '/brands/crai.svg', category: 'super', aliases: ['Crai'] },
  { id: 'bennet', name: 'Bennet', program: 'Bennet Club', color: '#004990', text: '#fff', logo: '/brands/bennet.svg', category: 'super' },
  { id: 'iper', name: 'Iper', program: 'Carta Vantaggi', color: '#E30613', text: '#fff', logo: '/brands/iper.svg', category: 'super', aliases: ['Iper La grande i'] },
  { id: 'todis', name: 'Todis', program: 'Carta Todis', color: '#E5322D', text: '#fff', logo: '/brands/todis.svg', category: 'super' },
  { id: 'eurospin', name: 'Eurospin', program: 'Carta fedeltà', color: '#0055A5', text: '#fff', logo: '/brands/eurospin.svg', category: 'super' },
  { id: 'ilgigante', name: 'Il Gigante', program: 'Gigante Card', color: '#004990', text: '#fff', logo: '/brands/ilgigante.png', logoStyle: 'bare', category: 'super' },
  { id: 'unes', name: 'Unes', program: 'Carta U!', color: '#005CA9', text: '#fff', category: 'super', aliases: ['U2 Supermercato', 'U2'] },
  { id: 'tigros', name: 'Tigros', program: 'Tigros Card', color: '#00A94F', text: '#fff', category: 'super' },
  { id: 'ali', name: 'Alì', program: 'Alì Card', color: '#0069B4', text: '#fff', category: 'super', aliases: ['Alìper', 'Ali'] },
  { id: 'basko', name: 'Basko', program: 'Basko Card', color: '#F7941D', text: '#fff', category: 'super' },
  { id: 'sigma', name: 'Sigma', program: 'Carta Sigma', color: '#E3001B', text: '#fff', category: 'super' },
  { id: 'deco', name: 'Decò', program: 'Decò Card', color: '#FFD200', text: '#111', category: 'super' },
  // Casa e fai da te
  { id: 'ikea', name: 'IKEA', program: 'IKEA Family', color: '#0058A3', text: '#fff', logo: '/brands/ikea.svg', logoStyle: 'bare', category: 'casa' },
  { id: 'leroymerlin', name: 'Leroy Merlin', program: 'Idea Più', color: '#78BE20', text: '#fff', logo: '/brands/leroymerlin.svg', logoStyle: 'bare', category: 'casa' },
  { id: 'obi', name: 'OBI', program: 'OBI Card', color: '#FF7300', text: '#fff', logo: '/brands/obi.svg', category: 'casa' },
  { id: 'maxizoo', name: 'Maxi Zoo', program: 'Friends', color: '#E4032E', text: '#fff', category: 'casa' },
  { id: 'arcaplanet', name: 'Arcaplanet', program: 'Arcacard', color: '#F26522', text: '#fff', logo: '/brands/arcaplanet.png', logoStyle: 'bare', category: 'casa' },
  // Moda
  { id: 'ovs', name: 'OVS', program: 'OVS Card', color: '#111111', text: '#fff', logo: '/brands/ovs.svg', category: 'moda' },
  { id: 'coin', name: 'Coin', program: 'CoinCard', color: '#111111', text: '#fff', logo: '/brands/coin.png', category: 'moda' },
  { id: 'hm', name: 'H&M', program: 'H&M Member', color: '#E50010', text: '#fff', logo: '/brands/hm.svg', category: 'moda' },
  { id: 'kiabi', name: 'Kiabi', program: 'Kiabi Card', color: '#E4007C', text: '#fff', logo: '/brands/kiabi.svg', category: 'moda' },
  { id: 'rinascente', name: 'Rinascente', program: 'Rinascente Card', color: '#111111', text: '#fff', logo: '/brands/rinascente.svg', category: 'moda' },
  { id: 'pittarosso', name: 'PittaRosso', program: 'PittaRosso Card', color: '#E30613', text: '#fff', logo: '/brands/pittarosso.png', category: 'moda' },
  { id: 'cisalfa', name: 'Cisalfa Sport', program: 'Cisalfa Card', color: '#003876', text: '#fff', logo: '/brands/cisalfa.svg', category: 'moda' },
  { id: 'decathlon', name: 'Decathlon', program: 'Decathlon Membership', color: '#3643BA', text: '#fff', logo: '/brands/decathlon.svg', category: 'moda' },
  // Bellezza e cura
  { id: 'tigota', name: 'Tigotà', program: 'Tigotà Card', color: '#E4007C', text: '#fff', logo: '/brands/tigota.png', category: 'bellezza' },
  { id: 'acquaesapone', name: 'Acqua & Sapone', program: 'Carta fedeltà', color: '#0072BC', text: '#fff', logo: '/brands/acquaesapone.svg', category: 'bellezza' },
  { id: 'douglas', name: 'Douglas', program: 'Douglas Beauty Card', color: '#001E2B', text: '#fff', logo: '/brands/douglas.svg', category: 'bellezza' },
  { id: 'sephora', name: 'Sephora', program: 'Sephora Card', color: '#111111', text: '#fff', logo: '/brands/sephora.svg', category: 'bellezza' },
  { id: 'yvesrocher', name: 'Yves Rocher', program: 'Carta Yves Rocher', color: '#006D3C', text: '#fff', logo: '/brands/yvesrocher.svg', category: 'bellezza' },
  { id: 'bottegaverde', name: 'Bottega Verde', program: 'Bottega Verde Card', color: '#006F44', text: '#fff', category: 'bellezza' },
  // Tecnologia e libri
  { id: 'mediaworld', name: 'MediaWorld', program: 'MediaWorld Club', color: '#DF0000', text: '#fff', category: 'tech' },
  { id: 'unieuro', name: 'Unieuro', program: 'Unieuro Club', color: '#003F8A', text: '#fff', logo: '/brands/unieuro.png', logoStyle: 'bare', category: 'tech' },
  { id: 'euronics', name: 'Euronics', program: 'Euronics Card', color: '#0050A0', text: '#fff', logo: '/brands/euronics.svg', category: 'tech' },
  { id: 'feltrinelli', name: 'laFeltrinelli', program: 'Carta Più', color: '#E2001A', text: '#fff', logo: '/brands/feltrinelli.svg', category: 'tech', aliases: ['Feltrinelli', 'La Feltrinelli'] },
  { id: 'mondadori', name: 'Mondadori Store', program: 'Mondadori Card', color: '#B4121B', text: '#fff', logo: '/brands/mondadori.svg', category: 'tech', aliases: ['Mondadori'] },
  // Carburante e multi-insegna
  { id: 'q8', name: 'Q8', program: 'ClubQ8', color: '#0033A0', text: '#fff', logo: '/brands/q8.svg', category: 'carburante' },
  { id: 'eni', name: 'Eni', program: 'Eni Live', color: '#FFD500', text: '#111', logo: '/brands/eni.svg', category: 'carburante', aliases: ['Agip', 'Eni Station'] },
  { id: 'ip', name: 'IP', program: 'IP Club', color: '#00539B', text: '#fff', logo: '/brands/ip.svg', category: 'carburante', aliases: ['IP Gruppo api'] },
  { id: 'payback', name: 'Payback', program: 'Payback', color: '#003EB0', text: '#fff', logo: '/brands/payback.svg', category: 'altro' },
];

export const OTHER_BRAND: LoyaltyBrand = {
  id: 'altro', name: 'Altro', program: 'Carta fedeltà', color: '#2C3E50', text: '#fff', category: 'altro'
};

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9àèéìòù&]/g, '');

/** Trova il marchio da id oppure, per le carte salvate prima del catalogo, dal nome del negozio */
export function findBrand(brandId?: string | null, storeName?: string | null): LoyaltyBrand | null {
  if (brandId) {
    const byId = LOYALTY_BRANDS.find(b => b.id === brandId);
    if (byId) return byId;
  }
  if (!storeName) return null;
  const n = norm(storeName);
  return LOYALTY_BRANDS.find(b => norm(b.name) === n || b.aliases?.some(a => norm(a) === n)) || null;
}

export function searchBrands(query: string): LoyaltyBrand[] {
  const q = norm(query);
  if (!q) return LOYALTY_BRANDS;
  return LOYALTY_BRANDS.filter(b =>
    norm(b.name).includes(q) || norm(b.program).includes(q) || b.aliases?.some(a => norm(a).includes(q))
  );
}

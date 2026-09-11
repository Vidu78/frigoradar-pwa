import type { LoyaltyBrand } from '../data/loyaltyBrands';

interface Props {
  brand: LoyaltyBrand | null;
  /** Nome da scrivere quando il marchio non ha un logo (carte "Altro") */
  name: string;
  size?: 'sm' | 'md';
}

// Logo del marchio come sulle carte di Stocard/Klarna: su targhetta bianca cosi'
// resta leggibile su qualsiasi colore, oppure "bare" quando il marchio e' un'icona
// gia' pensata per stare sul proprio colore (Conad, Carrefour, IKEA...).
export default function BrandLogo({ brand, name, size = 'md' }: Props) {
  const h = size === 'sm' ? 36 : 52;
  const imgMax = size === 'sm' ? 24 : 36;

  if (brand?.logo && brand.logoStyle === 'bare') {
    return <img src={brand.logo} alt={brand.name} style={{ height: h + 4, maxWidth: size === 'sm' ? 90 : 160, objectFit: 'contain' }} />;
  }

  return (
    <div style={{
      background: '#fff', borderRadius: size === 'sm' ? 8 : 12,
      height: h, minWidth: h + 12, maxWidth: size === 'sm' ? 120 : 190,
      padding: size === 'sm' ? '4px 8px' : '8px 12px', boxSizing: 'border-box',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
    }}>
      {brand?.logo ? (
        <img src={brand.logo} alt={brand.name} style={{ maxHeight: imgMax, maxWidth: size === 'sm' ? 100 : 160, objectFit: 'contain', display: 'block' }} />
      ) : (
        <span style={{
          color: brand?.color || '#2C3E50', fontWeight: 900, letterSpacing: '-0.3px',
          fontSize: size === 'sm' ? '0.8rem' : '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {brand?.name || name}
        </span>
      )}
    </div>
  );
}

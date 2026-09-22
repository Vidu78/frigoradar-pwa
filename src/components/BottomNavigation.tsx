import { Refrigerator, User, ChefHat, ShoppingCart, CreditCard, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'fridge' | 'shopping' | 'recipes' | 'profile' | 'family' | 'loyalty';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddClick?: () => void;
}

// Prima la barra aveva due gruppi, 2 voci a sinistra e 3 a destra, ognuno con
// uno "space-around" sulla propria meta': le icone finivano a distanze diverse
// e la barra sembrava storta. Ora le voci sono una lista sola, tre per lato,
// tutte della stessa larghezza, e la condivisione del frigo e' finalmente
// raggiungibile senza passare dal profilo.
const VOCI: { tab: TabType; icona: typeof Refrigerator; etichetta: string; colore: string; tour?: string }[] = [
  { tab: 'fridge',   icona: Refrigerator, etichetta: 'nav.fridge',   colore: '#00FFAA' },
  { tab: 'shopping', icona: ShoppingCart, etichetta: 'nav.shopping', colore: '#00FFAA', tour: 'nav-shopping' },
  { tab: 'family',   icona: Users,        etichetta: 'nav.family',   colore: '#00FFAA', tour: 'nav-family' },
  { tab: 'recipes',  icona: ChefHat,      etichetta: 'nav.recipes',  colore: '#FFD700', tour: 'nav-recipes' },
  { tab: 'loyalty',  icona: CreditCard,   etichetta: 'nav.loyalty',  colore: '#FFD700', tour: 'nav-loyalty' },
  { tab: 'profile',  icona: User,         etichetta: 'nav.profile',  colore: '#00FFAA' },
];

const META = VOCI.length / 2;

export default function BottomNavigation({ activeTab, onTabChange, onAddClick }: BottomNavigationProps) {
  const { t } = useTranslation();

  const voce = ({ tab, icona: Icona, etichetta, colore, tour }: typeof VOCI[number]) => {
    const attiva = activeTab === tab;
    return (
      <button
        key={tab}
        data-tour={tour}
        onClick={() => onTabChange(tab)}
        aria-label={t(etichetta)}
        aria-current={attiva ? 'page' : undefined}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: 0,
          cursor: 'pointer',
          color: attiva ? colore : 'rgba(255,255,255,0.4)',
          transition: 'color 0.3s',
        }}
      >
        <Icona size={21} strokeWidth={attiva ? 2.5 : 2} />
        <span style={{
          fontSize: '9.5px',
          fontWeight: attiva ? 700 : 500,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{t(etichetta)}</span>
      </button>
    );
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        left: '20px',
        right: '20px',
        height: '74px',
        borderRadius: '24px',
        background: 'linear-gradient(145deg, rgba(40, 42, 45, 0.95) 0%, rgba(15, 16, 18, 0.98) 100%)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {VOCI.slice(0, META).map(voce)}

      {/* Il piu' sta al centro e non entra nel conto delle voci: larghezza fissa,
          cosi' i due lati restano identici qualunque sia la lingua. */}
      <div style={{ flex: '0 0 68px', display: 'flex', justifyContent: 'center', position: 'relative', top: '-15px' }}>
        <button
          data-tour="fab-button"
          onClick={onAddClick}
          style={{
            width: '60px', height: '60px', borderRadius: '30px', border: 'none',
            background: 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)',
            color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(0, 255, 170, 0.4)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      {VOCI.slice(META).map(voce)}
    </nav>
  );
}

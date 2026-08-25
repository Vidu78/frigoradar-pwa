import { Refrigerator, User, ScanBarcode, ChefHat, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'fridge' | 'shopping' | 'recipes' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onScanClick: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onScanClick }: BottomNavigationProps) {
  const { t } = useTranslation();

  return (
    <div style={{
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
      justifyContent: 'space-between',
      padding: '0 16px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      


      {/* --- BOTTONI NAVIGAZIONE (FOREGROUND LAYER) --- */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 1, height: '100%' }}>
        
        <button
          onClick={() => onTabChange('fridge')}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
            color: activeTab === 'fridge' ? '#00FFAA' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: activeTab === 'fridge' ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <Refrigerator size={24} strokeWidth={activeTab === 'fridge' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'fridge' ? 700 : 500, letterSpacing: '0.3px', transition: 'all 0.3s' }}>
            {t('nav.fridge')}
          </span>
        </button>

        <button
          onClick={() => onTabChange('shopping')}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
            color: activeTab === 'shopping' ? '#00FFAA' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: activeTab === 'shopping' ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <ShoppingCart size={24} strokeWidth={activeTab === 'shopping' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'shopping' ? 700 : 500, letterSpacing: '0.3px', transition: 'all 0.3s' }}>
            Spesa
          </span>
        </button>

        <button
          onClick={() => onTabChange('recipes')}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
            color: activeTab === 'recipes' ? '#FFD700' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: activeTab === 'recipes' ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <ChefHat size={24} strokeWidth={activeTab === 'recipes' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'recipes' ? 700 : 500, letterSpacing: '0.3px', transition: 'all 0.3s' }}>
            {t('nav.recipes')}
          </span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
            color: activeTab === 'profile' ? '#00FFAA' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: activeTab === 'profile' ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'profile' ? 700 : 500, letterSpacing: '0.3px', transition: 'all 0.3s' }}>
            {t('nav.profile')}
          </span>
        </button>
      </div>
    </div>
  );
}

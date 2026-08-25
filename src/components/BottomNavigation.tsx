import { Refrigerator, User, ChefHat, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'fridge' | 'shopping' | 'recipes' | 'profile' | 'family';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddClick?: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onAddClick }: BottomNavigationProps) {
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
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      
      {/* --- BOTTONI NAVIGAZIONE (FOREGROUND LAYER) --- */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, height: '100%' }}>
        
        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'space-around' }}>
          <button
            onClick={() => onTabChange('fridge')}
            style={{
              background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
              color: activeTab === 'fridge' ? '#00FFAA' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.4s',
            }}
          >
            <Refrigerator size={24} strokeWidth={activeTab === 'fridge' ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'fridge' ? 700 : 500 }}>{t('nav.fridge')}</span>
          </button>

          <button
            onClick={() => onTabChange('shopping')}
            style={{
              background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
              color: activeTab === 'shopping' ? '#00FFAA' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.4s',
            }}
          >
            <ShoppingCart size={24} strokeWidth={activeTab === 'shopping' ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'shopping' ? 700 : 500 }}>Spesa</span>
          </button>
        </div>

        {/* FAB CENTRALE */}
        <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', margin: '0 10px', position: 'relative', top: '-15px' }}>
          <button
            onClick={onAddClick}
            style={{
              width: '60px', height: '60px', borderRadius: '30px', border: 'none',
              background: 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)',
              color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(0, 255, 170, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'space-around' }}>
          <button
            onClick={() => onTabChange('recipes')}
            style={{
              background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
              color: activeTab === 'recipes' ? '#FFD700' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.4s',
            }}
          >
            <ChefHat size={24} strokeWidth={activeTab === 'recipes' ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'recipes' ? 700 : 500 }}>Chef AI</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            style={{
              background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
              color: activeTab === 'profile' ? '#00FFAA' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.4s',
            }}
          >
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'profile' ? 700 : 500 }}>{t('nav.profile')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

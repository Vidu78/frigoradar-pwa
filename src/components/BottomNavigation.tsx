import { Refrigerator, User, ScanBarcode, ChefHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'fridge' | 'recipes' | 'profile';

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
      
      {/* --- DESIGN FRIGORIFERO (BACKGROUND LAYER) --- */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Fessura Centrale */}
        <div style={{ 
          position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', 
          background: 'rgba(0,0,0,0.8)', boxShadow: '1px 0 0 rgba(255,255,255,0.05)', 
          transform: 'translateX(-50%)' 
        }} />
        
        {/* Maniglia Sinistra */}
        <div style={{ 
          position: 'absolute', top: '16px', bottom: '16px', right: 'calc(50% + 12px)', 
          width: '4px', borderRadius: '4px', 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)', 
          boxShadow: '-1px 0 3px rgba(0,0,0,0.8), inset 1px 0 1px rgba(255,255,255,0.2)' 
        }} />
        
        {/* Maniglia Destra */}
        <div style={{ 
          position: 'absolute', top: '16px', bottom: '16px', left: 'calc(50% + 12px)', 
          width: '4px', borderRadius: '4px', 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)', 
          boxShadow: '1px 0 3px rgba(0,0,0,0.8), inset -1px 0 1px rgba(255,255,255,0.2)' 
        }} />

        {/* Riflesso Metallica Superiore */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
        }} />
      </div>

      {/* --- BOTTONI NAVIGAZIONE (FOREGROUND LAYER) --- */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', zIndex: 1 }}>
        {/* Left Tab: Fridge */}
        <button
          onClick={() => onTabChange('fridge')}
          style={{
            flex: 1, background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
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

        {/* Center: SCANNER BUTTON */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onScanClick}
            style={{
              width: '64px', height: '64px', borderRadius: '32px', background: 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)',
              border: '4px solid var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,255,170,0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
              transform: 'translateY(-16px)', transition: 'transform 0.2s', zIndex: 10
            }}
          >
            <ScanBarcode size={28} color="#0F1012" />
          </button>
        </div>

        {/* Recipes & Profile side-by-side */}
        <div style={{ flex: 1, display: 'flex' }}>
          <button
            onClick={() => onTabChange('recipes')}
            style={{
              flex: 1, background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
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
              flex: 1, background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
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
    </div>
  );
}

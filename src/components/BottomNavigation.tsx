import { Refrigerator, ShoppingCart, Sparkles, User } from 'lucide-react';

export type TabType = 'INVENTORY' | 'SHOPPING' | 'RECIPES' | 'PROFILE';

interface BottomNavigationProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export default function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'INVENTORY', icon: Refrigerator, label: 'Inventario' },
    { id: 'SHOPPING', icon: ShoppingCart, label: 'Spesa' },
    { id: 'RECIPES', icon: Sparkles, label: 'Chef AI', highlight: true },
    { id: 'PROFILE', icon: User, label: 'Profilo' },
  ];

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
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      
      {/* --- DESIGN FRIGORIFERO (BACKGROUND LAYER) --- */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Fessura Centrale (Spacco tra le due ante del frigo) */}
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
      <div style={{ position: 'relative', width: '100%', display: 'flex', zIndex: 1 }}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id as TabType)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: isActive 
                  ? (tab.highlight ? '#FFD700' : 'var(--primary)') 
                  : 'rgba(255,255,255,0.4)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                padding: '0 8px' // evita collisioni con il centro
              }}
            >
              <div style={{ position: 'relative', transition: 'transform 0.3s', transform: isActive ? 'scale(1.15)' : 'scale(1)' }}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Glow Effect per l'icona attiva */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '35px', height: '35px', 
                    background: tab.highlight ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 255, 170, 0.2)',
                    borderRadius: '50%', filter: 'blur(8px)', zIndex: -1
                  }} />
                )}
              </div>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.3px',
                opacity: isActive ? 1 : 0.8
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

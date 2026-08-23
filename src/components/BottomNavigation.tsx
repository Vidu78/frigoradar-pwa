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
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(15, 15, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '12px 20px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      display: 'flex',
      justifyContent: 'space-around',
      zIndex: 100
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id as TabType)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: isActive 
                ? (tab.highlight ? '#FFD700' : 'var(--primary)') 
                : 'var(--text-muted)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={24} />
              {isActive && tab.highlight && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: '40px', height: '40px', background: 'rgba(255, 215, 0, 0.2)',
                  borderRadius: '50%', filter: 'blur(8px)', zIndex: -1
                }}></div>
              )}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 700 : 500 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

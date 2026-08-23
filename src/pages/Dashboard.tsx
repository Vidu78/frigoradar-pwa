import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, ScanBarcode, Refrigerator, Search, Settings } from 'lucide-react';

export default function Dashboard() {
  const { session, signOut } = useAuthStore();

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bentornato,</p>
          <h2 style={{ fontWeight: 600 }}>{session?.user?.email?.split('@')[0]}</h2>
        </div>
        <button onClick={signOut} className="btn-secondary" style={{ padding: '10px' }}>
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '16px', borderRadius: '50%' }}>
            <ScanBarcode size={32} color="var(--primary)" />
          </div>
          <span style={{ fontWeight: 500 }}>Scansiona</span>
        </div>
        
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
          <div style={{ background: 'rgba(255, 107, 91, 0.2)', padding: '16px', borderRadius: '50%' }}>
            <Refrigerator size={32} color="var(--accent)" />
          </div>
          <span style={{ fontWeight: 500 }}>Inventario</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="input-group">
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input-field" placeholder="Cerca nel tuo frigo..." style={{ width: '100%', paddingLeft: '42px', background: 'var(--bg-panel)' }} />
        </div>
      </div>

      {/* Stats/Summary */}
      <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>In Scadenza</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>Nessun prodotto in scadenza a breve.</p>
      </div>

      {/* Bottom Navigation (Fixed) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-panel-solid)', borderTop: '1px solid var(--border)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
          <Refrigerator size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Frigo</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <Search size={24} />
          <span style={{ fontSize: '0.7rem' }}>Cerca</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <Settings size={24} />
          <span style={{ fontSize: '0.7rem' }}>Profilo</span>
        </div>
      </div>

    </div>
  );
}

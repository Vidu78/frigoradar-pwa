// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 100000, background: 'rgba(20,20,20,0.95)', border: '1px solid #FF9F0A',
      backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px',
      display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
      width: 'calc(100% - 40px)', maxWidth: '400px',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ color: 'white', flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#FF9F0A' }}>Aggiornamento Disponibile</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
          È disponibile una nuova versione dell'app.
        </p>
      </div>
      <button 
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#FF9F0A', color: 'black', border: 'none', padding: '10px 16px',
          borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}
      >
        <RefreshCw size={16} />
        Aggiorna
      </button>
      <button onClick={() => setNeedRefresh(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
        <X size={20} />
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

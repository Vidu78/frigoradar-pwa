import { useToastStore } from '../store/toastStore';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
  const { message, type, hideToast } = useToastStore();

  if (!message) return null;

  const config = {
    success: { bg: 'rgba(50, 215, 75, 0.15)', border: 'rgba(50, 215, 75, 0.3)', color: '#32D74B', icon: CheckCircle2 },
    error: { bg: 'rgba(255, 69, 58, 0.15)', border: 'rgba(255, 69, 58, 0.3)', color: '#FF453A', icon: AlertTriangle },
    info: { bg: 'rgba(100, 200, 255, 0.15)', border: 'rgba(100, 200, 255, 0.3)', color: '#64C8FF', icon: Info },
  }[type];

  const Icon = config.icon;

  return (
    <div style={{
      position: 'fixed',
      top: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      borderRadius: '16px',
      background: 'rgba(20, 20, 20, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${config.border}`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
      width: 'calc(100% - 40px)',
      maxWidth: '400px',
      animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ color: config.color, display: 'flex', flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      
      <p style={{ flex: 1, margin: 0, color: 'white', fontSize: '0.85rem', fontWeight: 600, lineHeight: '1.3' }}>
        {message}
      </p>
      
      <button 
        onClick={hideToast} 
        style={{ 
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', 
          cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' 
        }}
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

import { useDialogStore } from '../store/dialogStore';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function PremiumDialog() {
  const { isOpen, options, closeDialog } = useDialogStore();

  if (!isOpen || !options) return null;

  const {
    title,
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    isAlert = false,
    type = 'warning'
  } = options;

  // Scegli icone e colori basati sul type
  let Icon = AlertTriangle;
  let accentColor = '#FF9F0A'; // warning
  let bgColor = 'rgba(255, 159, 10, 0.1)';
  
  if (type === 'danger') {
    Icon = AlertCircle;
    accentColor = '#FF453A';
    bgColor = 'rgba(255, 69, 58, 0.1)';
  } else if (type === 'success') {
    Icon = CheckCircle2;
    accentColor = '#32D74B';
    bgColor = 'rgba(50, 215, 75, 0.1)';
  } else if (type === 'info') {
    Icon = Info;
    accentColor = '#64C8FF';
    bgColor = 'rgba(100, 200, 255, 0.1)';
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1A1C1E 0%, #111214 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px', width: '100%', maxWidth: '360px',
        padding: '28px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px ${accentColor}20`,
        animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        
        {/* Icona circolare animata */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '36px',
          background: bgColor, color: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px', border: `1px solid ${accentColor}40`,
          boxShadow: `0 8px 24px ${bgColor}`
        }}>
          <Icon size={36} strokeWidth={2.5} />
        </div>

        {/* Testo */}
        <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
          {title}
        </h2>
        <div style={{ margin: '0 0 28px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
          {message}
        </div>

        {/* Bottoni */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', flexDirection: isAlert ? 'column' : 'row' }}>
          {!isAlert && (
            <button
              onClick={() => closeDialog(false)}
              style={{
                flex: 1, padding: '16px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => closeDialog(true)}
            style={{
              flex: 1, padding: '16px', borderRadius: '16px',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
              border: 'none', color: '#000', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
              boxShadow: `0 8px 24px ${accentColor}40`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

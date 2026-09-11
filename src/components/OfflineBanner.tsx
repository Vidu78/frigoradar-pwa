import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

// Striscia in alto quando manca la rete: il SW serve l'ultima copia dei dati,
// l'utente deve sapere che quello che vede puo' non essere aggiornato.
export default function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 16px 8px',
      background: 'rgba(255, 159, 10, 0.95)', color: '#000',
      fontSize: '0.8rem', fontWeight: 600
    }}>
      <WifiOff size={16} aria-hidden="true" />
      <span>{t('common.offline')}</span>
    </div>
  );
}

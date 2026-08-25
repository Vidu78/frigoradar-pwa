import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Loader2 } from 'lucide-react';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onSuccess: (decodedText: string) => void;
}

export default function BarcodeScannerModal({ onClose, onSuccess }: BarcodeScannerModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        setLoading(true);
        scanner.clear();
        onSuccess(decodedText);
      },
      (_error) => {
        // Ignora gli errori di mancata lettura frame by frame
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onSuccess]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)', padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-panel-solid)', width: '100%', maxWidth: '400px',
        borderRadius: '24px', padding: '24px', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={24} />
        </button>
        <h2 style={{ marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>Scansiona Codice a Barre</h2>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)' }}>Ricerca nel database mondiale...</span>
          </div>
        ) : (
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
            <div id="reader" style={{ width: '100%' }}></div>
          </div>
        )}
      </div>
      <style>{`
        #reader { border: none !important; }
        #reader__dashboard_section_csr span { color: white !important; }
        #reader__dashboard_section_swaplink { color: var(--primary) !important; text-decoration: none !important; }
        #reader__dashboard_section_csr button { background: var(--primary) !important; color: black !important; border: none !important; padding: 8px 16px !important; border-radius: 12px !important; margin: 10px 0 !important; cursor: pointer !important; font-weight: bold !important; }
      `}</style>
    </div>
  );
}

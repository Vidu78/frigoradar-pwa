import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 10, 
        // Calcolo dinamico del riquadro in base allo schermo (rettangolo largo per barcode)
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdgePercentage = 0.8; 
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: Math.floor(qrboxSize * 0.5) 
          };
        },
        supportedScanTypes: [0] // Forza solo la fotocamera, nasconde l'upload file
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onScan(decodedText);
      },
      () => {
        // Ignoriamo gli errori di "non trovato" continui
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)', zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(10px)'
    }}>
      {/* CSS Globale per sovrascrivere l'interfaccia standard brutta di html5-qrcode */}
      <style>{`
        #reader { border: none !important; width: 100% !important; }
        #reader__dashboard_section_csr span { color: var(--text-muted) !important; font-family: inherit !important; }
        #reader__dashboard_section_csr button { 
          background: var(--primary) !important; 
          color: black !important; 
          border: none !important; 
          padding: 12px 24px !important; 
          border-radius: 12px !important; 
          font-weight: 600 !important;
          margin-top: 16px !important;
          font-family: inherit !important;
          cursor: pointer;
        }
        #reader__dashboard_section_swaplink { display: none !important; }
        #reader__scan_region { background: transparent !important; margin-top: 20px !important;}
        #reader video { object-fit: cover !important; border-radius: 16px !important; width: 100% !important; }
        #reader__camera_selection { padding: 10px; border-radius: 8px; background: #222; color: white; border: 1px solid #444; }
      `}</style>

      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'env(safe-area-inset-top)' }}>
        <h3 style={{ color: 'white', margin: 0, fontWeight: 600 }}>Scansiona Prodotto</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
          <X size={28} />
        </button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div id="reader" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden' }}></div>
      </div>
      
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', marginBottom: 'env(safe-area-inset-bottom)' }}>
        Inquadra il codice a barre del prodotto all'interno del riquadro.
      </p>
    </div>
  );
}

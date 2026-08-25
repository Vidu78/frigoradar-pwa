import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, ScanLine } from 'lucide-react';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onSuccess: (decodedText: string) => void;
}

export default function BarcodeScannerModal({ onClose, onSuccess }: BarcodeScannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Usiamo Html5Qrcode (core) invece di Html5QrcodeScanner per avere il 100% del controllo sulla UI
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" }, // Usa la fotocamera posteriore
      {
        fps: 15,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            setLoading(true);
            onSuccess(decodedText);
          }).catch(console.error);
        }
      },
      (_error) => {
        // ignora gli errori frame by frame
      }
    ).catch((err) => {
      console.error("Camera start error:", err);
      setHasCameraError(true);
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onSuccess]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)', padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, var(--bg-panel-solid) 0%, #051A18 100%)',
        width: '100%', maxWidth: '400px',
        borderRadius: '32px', padding: '0', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: 10 }}>
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <ScanLine color="var(--primary)" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Scansione Prodotto</h2>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '60px 0' }}>
              <Loader2 className="animate-spin" size={56} color="var(--primary)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>Ricerca nel database...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connessione a OpenFoodFacts in corso</div>
              </div>
            </div>
          ) : hasCameraError ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,69,58,0.1)', padding: '16px', borderRadius: '50%' }}>
                  <X size={32} color="#FF453A" />
                </div>
                <div style={{ color: 'white', fontWeight: 600 }}>Impossibile accedere alla fotocamera</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Verifica i permessi del browser per continuare.</div>
             </div>
          ) : (
            <div style={{ width: '100%', position: 'relative', borderRadius: '24px', overflow: 'hidden', background: '#000', border: '2px solid rgba(255,255,255,0.1)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div id="reader" style={{ width: '100%', height: '100%' }}></div>
              
              {/* Premium Overlay Scanner */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                {/* Dark overlay with transparent center */}
                <div style={{ position: 'absolute', inset: 0, border: '50px solid rgba(0,0,0,0.6)' }}></div>
                
                {/* Glowing target corners */}
                <div style={{ position: 'absolute', top: '48px', left: '48px', width: '30px', height: '30px', borderTop: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', borderRadius: '4px 0 0 0', filter: 'drop-shadow(0 0 8px var(--primary))' }}></div>
                <div style={{ position: 'absolute', top: '48px', right: '48px', width: '30px', height: '30px', borderTop: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', borderRadius: '0 4px 0 0', filter: 'drop-shadow(0 0 8px var(--primary))' }}></div>
                <div style={{ position: 'absolute', bottom: '48px', left: '48px', width: '30px', height: '30px', borderBottom: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', borderRadius: '0 0 0 4px', filter: 'drop-shadow(0 0 8px var(--primary))' }}></div>
                <div style={{ position: 'absolute', bottom: '48px', right: '48px', width: '30px', height: '30px', borderBottom: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', borderRadius: '0 0 4px 0', filter: 'drop-shadow(0 0 8px var(--primary))' }}></div>

                {/* Animated scan line */}
                <div style={{ position: 'absolute', top: '50px', left: '50px', right: '50px', height: '2px', background: 'var(--primary)', filter: 'drop-shadow(0 0 10px var(--primary))', animation: 'scan 2s ease-in-out infinite' }}></div>
              </div>
            </div>
          )}
          
          {!loading && !hasCameraError && (
             <div style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
               <ScanLine size={16} /> Inquadra il codice a barre nel riquadro
             </div>
          )}
        </div>
      </div>
      <style>{`
        #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 24px !important; }
        #qr-shaded-region { display: none !important; }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; } 
        }
      `}</style>
    </div>
  );
}

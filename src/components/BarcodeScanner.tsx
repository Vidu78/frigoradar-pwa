import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, FlipHorizontal2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isRunningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (_) {}
      isRunningRef.current = false;
    }
  }, []);

  const startScanner = useCallback(async (facing: 'environment' | 'user') => {
    if (!html5QrCodeRef.current) return;
    await stopScanner();

    try {
      await html5QrCodeRef.current.start(
        { facingMode: { exact: facing } },
        {
          fps: 15,
          qrbox: { width: 260, height: 130 },
          aspectRatio: window.innerHeight / window.innerWidth,
          disableFlip: false,
        },
        (decodedText) => {
          stopScanner().then(() => onScan(decodedText));
        },
        () => { /* ignora errori continui "non trovato" */ }
      );
      isRunningRef.current = true;
      setReady(true);
    } catch {
      // fallback senza exact (utile su alcuni device con una sola camera)
      try {
        await html5QrCodeRef.current.start(
          { facingMode: facing },
          {
            fps: 15,
            qrbox: { width: 260, height: 130 },
            aspectRatio: window.innerHeight / window.innerWidth,
          },
          (decodedText) => {
            stopScanner().then(() => onScan(decodedText));
          },
          () => {}
        );
        isRunningRef.current = true;
        setReady(true);
      } catch (err) {
        console.error('Scanner error:', err);
      }
    }
  }, [stopScanner, onScan]);

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
    startScanner('environment');
    return () => {
      stopScanner();
    };
  }, []);

  const flipCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    await startScanner(newFacing);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {/* CSS per nascondere tutto l'UI di html5-qrcode e fare video fullscreen */}
      <style>{`
        #qr-reader-container {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #qr-reader-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important; left: 0 !important;
        }
        #qr-reader-container img { display: none !important; }
        #qr-reader-container__dashboard { display: none !important; }
        #qr-reader-container__header_message { display: none !important; }
        #qr-reader-container__status_span { display: none !important; }
        #qr-reader-container__scan_region { 
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
        }
      `}</style>

      {/* Camera container */}
      <div id="qr-reader-container" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

      {/* OVERLAY UI — sopra la camera */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        pointerEvents: 'none',
      }}>
        {/* Area scura sopra */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />

        {/* Riga con la cornice di scansione */}
        <div style={{ display: 'flex', alignItems: 'stretch', height: 180 }}>
          {/* Lato scuro sinistro */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />

          {/* Cornice trasparente centrale */}
          <div style={{ width: 270, position: 'relative', flexShrink: 0 }}>
            {/* Angoli della cornice */}
            {/* Top-left */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '4px 0 0 0' }} />
            {/* Top-right */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 4px 0 0' }} />
            {/* Bottom-left */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 4px' }} />
            {/* Bottom-right */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 4px 0' }} />

            {/* Linea di scansione animata */}
            {ready && (
              <div style={{
                position: 'absolute', left: 8, right: 8, height: 2,
                background: 'linear-gradient(90deg, transparent, #00FFAA, transparent)',
                animation: 'scanLine 1.8s ease-in-out infinite',
                borderRadius: '2px',
              }} />
            )}
          </div>

          {/* Lato scuro destro */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
        </div>

        {/* Area scura sotto con testo */}
        <div style={{ flex: 1.5, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, gap: 8 }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '1rem', margin: 0, textAlign: 'center' }}>
            Posiziona il codice a barre
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400, fontSize: '0.85rem', margin: 0, textAlign: 'center', paddingInline: 40 }}>
            Assicurati che l'immagine sia nitida e il codice ben illuminato.
          </p>
        </div>
      </div>

      {/* Pulsante chiudi (top-left) */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: 16,
          pointerEvents: 'auto',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          width: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}
      >
        <X size={22} />
      </button>

      {/* Pulsante flip camera (top-right) */}
      <button
        onClick={flipCamera}
        style={{
          position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 16,
          pointerEvents: 'auto',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          width: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}
      >
        <FlipHorizontal2 size={22} />
      </button>

      {/* Animazione linea scanner */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 12px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 12px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

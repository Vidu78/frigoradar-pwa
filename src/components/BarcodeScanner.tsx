import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, FlipHorizontal2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

/**
 * Scanner professionale: usa getUserMedia per il video (pieno controllo, nessun raddoppio)
 * e Html5Qrcode in modalità "scanFile" su canvas invisibile per il rilevamento.
 * Nessuna UI di html5-qrcode viene mai montata nel DOM visibile.
 */
export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);

  // Ferma stream e detection loop
  const stopAll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    isScanning.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  // Avvia camera con getUserMedia
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopAll();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play();
          setReady(true);
          startDetectionLoop();
        };
      }
    } catch (err) {
      console.error('Errore accesso fotocamera:', err);
    }
  }, [stopAll]); // eslint-disable-line

  // Detection loop: cattura frame dal video → canvas → Html5Qrcode.scanInlineFromElement
  const startDetectionLoop = useCallback(() => {
    // Usiamo BarcodeDetector nativo se disponibile (Chrome Android / Desktop)
    const hasBarcodeDetector = 'BarcodeDetector' in window;

    if (hasBarcodeDetector) {
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'data_matrix'],
      });

      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || !isScanning.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0 && results[0].rawValue) {
            isScanning.current = false;
            onScan(results[0].rawValue);
            return;
          }
        } catch (_) { /* frame non ancora pronto, ignora */ }
        rafRef.current = requestAnimationFrame(detect);
      };

      isScanning.current = true;
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    // Fallback: canvas + Html5Qrcode.scanFile ogni 400ms (iOS Safari e Firefox)
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('__offscreen_qr_scanner__');
    }

    const detectWithFallback = async () => {
      if (!videoRef.current || !canvasRef.current || !isScanning.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detectWithFallback);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob || !isScanning.current) return;
        try {
          const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
          const result = await scannerRef.current!.scanFile(file, false);
          if (result) {
            isScanning.current = false;
            onScan(result);
            return;
          }
        } catch (_) { /* nessun codice in questo frame, continua */ }

        setTimeout(() => {
          if (isScanning.current) {
            rafRef.current = requestAnimationFrame(detectWithFallback);
          }
        }, 300);
      }, 'image/jpeg', 0.8);
    };

    isScanning.current = true;
    rafRef.current = requestAnimationFrame(detectWithFallback);
  }, [onScan]);

  useEffect(() => {
    startCamera('environment');
    return () => {
      stopAll();
      // Cleanup istanza Html5Qrcode offscreen
      scannerRef.current = null;
      const el = document.getElementById('__offscreen_qr_scanner__');
      if (el) el.remove();
    };
  }, []);

  const handleFlip = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  };

  return (
    <>
      {/* Elemento offscreen per Html5Qrcode fallback — invisibile, fuori dalla viewport */}
      <div
        id="__offscreen_qr_scanner__"
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
      />
      {/* Canvas offscreen per cattura frame */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, overflow: 'hidden' }}>

        {/* Video — pieno schermo, nessun canvas sovrapposto */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Overlay: fasce scure attorno alla cornice */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          {/* top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(50% + 90px)', background: 'rgba(0,0,0,0.58)' }} />
          {/* bottom */}
          <div style={{ position: 'absolute', top: 'calc(50% + 90px)', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.58)' }} />
          {/* left */}
          <div style={{ position: 'absolute', top: 'calc(50% - 90px)', bottom: 'calc(50% - 90px)', left: 0, width: 'calc(50% - 135px)', background: 'rgba(0,0,0,0.58)' }} />
          {/* right */}
          <div style={{ position: 'absolute', top: 'calc(50% - 90px)', bottom: 'calc(50% - 90px)', right: 0, width: 'calc(50% - 135px)', background: 'rgba(0,0,0,0.58)' }} />

          {/* Cornice con angoli bianchi (270 × 180, centrata) */}
          <div style={{ position: 'absolute', left: 'calc(50% - 135px)', top: 'calc(50% - 90px)', width: 270, height: 180 }}>
            {/* angolo top-left */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '4px 0 0 0' }} />
            {/* angolo top-right */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 4px 0 0' }} />
            {/* angolo bottom-left */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '0 0 0 4px' }} />
            {/* angolo bottom-right */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 0 4px 0' }} />

            {/* Linea scanner animata — compare solo quando la camera è pronta */}
            {ready && (
              <div style={{
                position: 'absolute', left: 12, right: 12, height: 2,
                background: 'linear-gradient(90deg, transparent, #00FFAA 30%, #00FFAA 70%, transparent)',
                borderRadius: 2,
                animation: 'scanLine 2s ease-in-out infinite',
              }} />
            )}
          </div>

          {/* Testo guida sotto la cornice */}
          <div style={{
            position: 'absolute',
            top: 'calc(50% + 108px)',
            left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '0 48px',
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', textAlign: 'center' }}>
              Posiziona il codice a barre all'interno della cornice
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textAlign: 'center' }}>
              Assicurati che l'immagine sia nitida e il codice ben illuminato.
            </span>
          </div>
        </div>

        {/* Pulsante chiudi — top-left */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
            width: 44, height: 44, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
          }}
        >
          <X size={22} />
        </button>

        {/* Pulsante flip camera — top-right */}
        <button
          onClick={handleFlip}
          style={{
            position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
            width: 44, height: 44, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
          }}
        >
          <FlipHorizontal2 size={22} />
        </button>

        <style>{`
          @keyframes scanLine {
            0%   { top: 10px; opacity: 0; }
            8%   { opacity: 1; }
            92%  { opacity: 1; }
            100% { top: calc(100% - 10px); opacity: 0; }
          }
        `}</style>
      </div>
    </>
  );
}

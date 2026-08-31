import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, FlipHorizontal2, ScanBarcode, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [detected, setDetected] = useState(false);

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
            setDetected(true);
            setTimeout(() => onScan(results[0].rawValue), 300);
            return;
          }
        } catch { /* frame non ancora pronto, ignora */ }
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
            setDetected(true);
            setTimeout(() => onScan(result), 300);
            return;
          }
        } catch { /* nessun codice in questo frame, continua */ }

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
    // eslint-disable-next-line react/set-state-in-effect
    startCamera('environment');
    return () => {
      stopAll();
      // Cleanup istanza Html5Qrcode offscreen
      scannerRef.current = null;
      const el = document.getElementById('__offscreen_qr_scanner__');
      if (el) el.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        {/* Video — pieno schermo */}
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

        {/* Overlay scuro attorno alla cornice */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          {/* fasce scure */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(50% + 90px)', background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% + 90px)', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% - 90px)', bottom: 'calc(50% - 90px)', left: 0, width: 'calc(50% - 135px)', background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% - 90px)', bottom: 'calc(50% - 90px)', right: 0, width: 'calc(50% - 135px)', background: 'rgba(0,0,0,0.65)' }} />

          {/* Cornice premium 270×180 centrata */}
          <div style={{ position: 'absolute', left: 'calc(50% - 135px)', top: 'calc(50% - 90px)', width: 270, height: 180 }}>
            {/* angoli neon verde con glow */}
            {[
              { top: 0, left: 0, borderTop: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderLeft: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderRadius: '6px 0 0 0' },
              { top: 0, right: 0, borderTop: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderRight: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderRadius: '0 6px 0 0' },
              { bottom: 0, left: 0, borderBottom: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderLeft: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderRadius: '0 0 0 6px' },
              { bottom: 0, right: 0, borderBottom: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderRight: `3px solid ${detected ? '#00FFAA' : '#00FFAA'}`, borderRadius: '0 0 6px 0' },
            ].map((style, i) => (
              <div key={i} style={{
                position: 'absolute', width: 36, height: 36,
                boxShadow: detected ? '0 0 12px #00FFAA, 0 0 24px #00FFAA44' : '0 0 8px #00FFAA88',
                ...style
              }} />
            ))}

            {/* Linea scanner animata */}
            {ready && !detected && (
              <div style={{
                position: 'absolute', left: 12, right: 12, height: 2,
                background: 'linear-gradient(90deg, transparent, #00FFAA 30%, #00FFAA 70%, transparent)',
                borderRadius: 2,
                boxShadow: '0 0 8px #00FFAA',
                animation: 'scanLine 2s ease-in-out infinite',
              }} />
            )}

            {/* Feedback visivo: detected */}
            {detected && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,255,170,0.12)',
                borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ color: '#00FFAA', fontSize: '2rem' }}>✓</div>
              </div>
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
              {t('scanner.tip', 'Posiziona il codice a barre all\'interno della cornice')}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textAlign: 'center' }}>
              {t('scanner.tip_sub', 'Assicurati che l\'immagine sia nitida e ben illuminata')}
            </span>
          </div>
        </div>

        {/* HEADER PREMIUM — sopra il video */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 16px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Pulsante chiudi */}
          <button aria-label="Chiudi"
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
            }}
          >
            <X size={22} />
          </button>

          {/* Titolo + Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScanBarcode size={18} color="#00FFAA" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {t('scanner.title', 'Scansiona Barcode')}
              </span>
            </div>
            <div style={{
              background: 'rgba(0,255,170,0.15)', border: '1px solid rgba(0,255,170,0.4)',
              borderRadius: '20px', padding: '2px 10px',
              color: '#00FFAA', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px'
            }}>
              {ready ? (detected ? '✓ LETTO' : '● ATTIVO') : '○ AVVIO...'}
            </div>
          </div>

          {/* Pulsante flip */}
          <button
            onClick={handleFlip}
            style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
            }}
          >
            <FlipHorizontal2 size={22} />
          </button>
        </div>

        {/* PANNELLO INFERIORE GLASS */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)',
          backdropFilter: 'blur(2px)',
          padding: '24px 24px calc(32px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
        }}>
          {/* Indicatori formato supportato */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['EAN-13', 'EAN-8', 'CODE-128', 'QR', 'UPC'].map(fmt => (
              <span key={fmt} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px', padding: '3px 8px',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 600
              }}>{fmt}</span>
            ))}
          </div>

          {/* Stato scanner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color={ready ? '#00FFAA' : 'rgba(255,255,255,0.3)'} />
            <span style={{ color: ready ? '#00FFAA' : 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>
              {detected
                ? '✓ Codice rilevato!'
                : ready
                  ? t('scanner.tip', 'Inquadra il codice a barre')
                  : t('scanner.searching', 'Avvio fotocamera...')}
            </span>
          </div>
        </div>

        <style>{`
          @keyframes scanLine {
            0%   { top: 10px; opacity: 0; }
            8%   { opacity: 1; }
            92%  { opacity: 1; }
            100% { top: calc(100% - 10px); opacity: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}

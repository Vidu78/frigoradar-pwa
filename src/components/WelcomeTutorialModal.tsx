import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface GuidedTourProps {
  onComplete: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  accent: string;
  // target element selector to spotlight (null = center screen)
  targetSelector: string | null;
  // position of the tooltip relative to target
  tooltipPosition: 'top' | 'bottom' | 'center';
  // tab to activate before showing this step
  activateTab?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Benvenuto su FrigoRadar! 👋',
    description: 'Ti mostriamo in 30 secondi come usare l\'app al massimo. Puoi saltare in qualsiasi momento.',
    emoji: '🚀',
    accent: '#00FFAA',
    targetSelector: null,
    tooltipPosition: 'center',
  },
  {
    id: 'scan_receipt',
    title: '📸 Scontrino → Frigo automatico',
    description: 'Tocca il pulsante + al centro, poi scegli "Scansiona Scontrino". L\'AI leggerà tutti i prodotti e le scadenze in automatico.',
    emoji: '🧾',
    accent: '#FF9F0A',
    targetSelector: '[data-tour="fab-button"]',
    tooltipPosition: 'top',
  },
  {
    id: 'add_product',
    title: '🛒 Aggiungi prodotti alla Spesa',
    description: 'Nella scheda Spesa puoi aggiungere prodotti da comprare. L\'app suggerisce automaticamente quelli esauriti nel frigo.',
    emoji: '🛒',
    accent: '#64C8FF',
    targetSelector: '[data-tour="nav-shopping"]',
    tooltipPosition: 'top',
  },
  {
    id: 'recipes',
    title: '👨‍🍳 Chef AI anti-spreco',
    description: 'Tocca Chef AI: l\'intelligenza artificiale vede i prodotti in scadenza e crea ricette su misura, così non butti nulla.',
    emoji: '👨‍🍳',
    accent: '#FF453A',
    targetSelector: '[data-tour="nav-recipes"]',
    tooltipPosition: 'top',
  },
  {
    id: 'barcode',
    title: '📷 Barcode → prodotto completo',
    description: 'Tocca il + poi "Scansiona Barcode": l\'app aggiunge foto, calorie, ingredienti e categoria del prodotto in automatico.',
    emoji: '📷',
    accent: '#BF5AF2',
    targetSelector: '[data-tour="fab-button"]',
    tooltipPosition: 'top',
  },
  {
    id: 'loyalty',
    title: '💳 Carte fedeltà digitali',
    description: 'Nella scheda Carte trovi tutte le tue tessere fedeltà. Aggiungile una volta, usale al supermercato senza portarle fisicamente.',
    emoji: '💳',
    accent: '#FFD700',
    targetSelector: '[data-tour="nav-loyalty"]',
    tooltipPosition: 'top',
  },
];

export default function WelcomeTutorialModal({ onComplete }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [animating, setAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const current = TOUR_STEPS[step];

  // Trova il rect dell'elemento target
  useEffect(() => {
    const selector = current.targetSelector;
    
    // Usiamo setTimeout per evitare l'aggiornamento sincrono (setState in useEffect)
    const updateTarget = () => {
      if (!selector) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(updateTarget, 50);
    return () => clearTimeout(timer);
  }, [step, current.targetSelector]);

  const handleNext = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (step < TOUR_STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        onComplete();
      }
      setAnimating(false);
    }, 200);
  };

  const isLast = step === TOUR_STEPS.length - 1;

  // Calcola posizione tooltip
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || current.tooltipPosition === 'center') {
      return {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '380px',
        zIndex: 10001,
      };
    }

    const padding = 16;
    const tooltipH = 260;
    const screenW = window.innerWidth;

    let top: number;
    let left: number = Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - 160, screenW - 320 - padding));
    const width = Math.min(320, screenW - padding * 2);

    if (current.tooltipPosition === 'top') {
      top = targetRect.top - tooltipH - 24;
      if (top < 80) top = targetRect.bottom + 24;
    } else {
      top = targetRect.bottom + 24;
    }

    return {
      position: 'fixed',
      top: Math.max(80, top),
      left,
      width,
      zIndex: 10001,
    };
  };

  // Spotlight: area illuminata attorno al target
  const getSpotlight = () => {
    if (!targetRect) return null;
    const pad = 12;
    return {
      x: targetRect.left - pad,
      y: targetRect.top - pad,
      w: targetRect.width + pad * 2,
      h: targetRect.height + pad * 2,
      r: 16,
    };
  };

  const spotlight = getSpotlight();
  const W = window.innerWidth;
  const H = window.innerHeight;

  // SVG clip path per spotlight cutout
  const svgMask = spotlight ? `
    <svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>
      <defs>
        <mask id='m'>
          <rect width='${W}' height='${H}' fill='white'/>
          <rect x='${spotlight.x}' y='${spotlight.y}' width='${spotlight.w}' height='${spotlight.h}' rx='${spotlight.r}' fill='black'/>
        </mask>
      </defs>
      <rect width='${W}' height='${H}' fill='rgba(0,0,0,0.75)' mask='url(#m)'/>
    </svg>
  ` : null;

  return (
    <>
      {/* Overlay scuro con spotlight cutout */}
      {svgMask ? (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: svgMask }}
        />
      ) : (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: current.targetSelector ? 'none' : 'blur(4px)',
          pointerEvents: 'none'
        }} />
      )}

      {/* Click blocker con pass-through nella zona spotlight */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'all' }}
        onClick={(e) => {
          // se click dentro lo spotlight, lascia passare
          if (spotlight) {
            const { clientX: x, clientY: y } = e;
            if (x >= spotlight.x && x <= spotlight.x + spotlight.w &&
                y >= spotlight.y && y <= spotlight.y + spotlight.h) {
              e.stopPropagation();
              return;
            }
          }
          handleNext();
        }}
      />

      {/* Bordo neon attorno al target */}
      {spotlight && (
        <div style={{
          position: 'fixed',
          top: spotlight.y - 3,
          left: spotlight.x - 3,
          width: spotlight.w + 6,
          height: spotlight.h + 6,
          borderRadius: spotlight.r + 3,
          border: `2.5px solid ${current.accent}`,
          boxShadow: `0 0 0 4px ${current.accent}30, 0 0 20px ${current.accent}60`,
          zIndex: 10001,
          pointerEvents: 'none',
          animation: 'glowPulse 1.5s ease-in-out infinite'
        }} />
      )}

      {/* Freccia animata che punta al target */}
      {spotlight && (
        <div style={{
          position: 'fixed',
          top: spotlight.y - 48,
          left: spotlight.x + spotlight.w / 2 - 16,
          zIndex: 10002,
          pointerEvents: 'none',
          animation: 'arrowBounce 1s ease-in-out infinite',
          fontSize: '28px',
          filter: `drop-shadow(0 0 8px ${current.accent})`
        }}>
          👆
        </div>
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          ...getTooltipStyle(),
          background: 'linear-gradient(145deg, #0f1a14, #0a1410)',
          border: `1.5px solid ${current.accent}40`,
          borderRadius: '24px',
          padding: '24px',
          boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px ${current.accent}20`,
          animation: animating ? 'fadeOut 0.2s ease' : 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          pointerEvents: 'all',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: `${current.accent}20`, border: `1px solid ${current.accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            flexShrink: 0
          }}>
            {current.emoji}
          </div>
          <button
            onClick={onComplete}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.4)',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              height: '4px',
              width: i === step ? '20px' : '6px',
              borderRadius: '2px',
              background: i <= step ? current.accent : 'rgba(255,255,255,0.12)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {/* Title & desc */}
        <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: 'white', lineHeight: 1.3 }}>
          {current.title}
        </h3>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: '1.5' }}>
          {current.description}
        </p>

        {/* CTA */}
        <button
          onClick={handleNext}
          style={{
            width: '100%', padding: '14px',
            background: `linear-gradient(135deg, ${current.accent}, ${current.accent}bb)`,
            border: 'none', borderRadius: '14px',
            color: '#000', fontWeight: 800, fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: `0 6px 20px ${current.accent}40`,
            transition: 'all 0.2s'
          }}
        >
          {isLast
            ? <><CheckCircle2 size={20} /> Inizia ad usare l'app</>
            : <>Avanti <ChevronRight size={20} /></>}
        </button>

        {/* Skip link */}
        {!isLast && (
          <button onClick={onComplete} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            fontSize: '0.8rem', cursor: 'pointer', width: '100%', marginTop: '10px',
            padding: '4px'
          }}>
            Salta il tutorial
          </button>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          0%  { transform: ${current.tooltipPosition === 'center' ? 'translate(-50%, -50%) scale(0.88)' : 'scale(0.88)'}; opacity: 0; }
          100% { transform: ${current.tooltipPosition === 'center' ? 'translate(-50%, -50%) scale(1)' : 'scale(1)'}; opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 4px ${current.accent}30, 0 0 20px ${current.accent}60; }
          50%       { box-shadow: 0 0 0 8px ${current.accent}20, 0 0 40px ${current.accent}80; }
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
}

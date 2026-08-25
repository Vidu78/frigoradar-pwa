import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🧠',
    gradient: 'linear-gradient(135deg, #00FFAA22, #00997744)',
    accent: '#00FFAA',
    title: 'Il Futuro del Frigo',
    desc: 'FrigoRadar usa l\'AI per eliminare l\'inserimento manuale. Scatta una foto e il frigo si aggiorna da solo.',
    badge: 'Intelligenza Artificiale',
    visual: (
      <div style={{ position: 'relative', width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '80px', filter: 'drop-shadow(0 0 30px #00FFAA88)', animation: 'float 3s ease-in-out infinite' }}>🧠</div>
        {['🥛', '🧀', '🥩', '🥦', '🍳'].map((e, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: '22px',
            top: `${20 + Math.sin(i * 72 * Math.PI / 180) * 60}px`,
            left: `${50 + Math.cos(i * 72 * Math.PI / 180) * 70}%`,
            animation: `orbit${i} 4s linear infinite`,
            opacity: 0.85
          }}>{e}</div>
        ))}
      </div>
    )
  },
  {
    emoji: '🧾',
    gradient: 'linear-gradient(135deg, #FF9F0A22, #FF9F0A44)',
    accent: '#FF9F0A',
    title: 'Magia dello Scontrino',
    desc: 'Scatta una foto alla ricevuta della spesa e l\'AI aggiungerà tutti i prodotti al frigo con le scadenze stimate.',
    badge: 'Scan AI',
    visual: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '20px' }}>
        <div style={{ fontSize: '70px', animation: 'float 3s ease-in-out infinite' }}>🧾</div>
        <div style={{ fontSize: '32px', color: '#FF9F0A', fontWeight: 900 }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {['🥛 Latte 7g', '🧀 Grana 14g', '🥩 Petto 3g'].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.3)',
              borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '0.8rem', fontWeight: 600,
              animation: `slideIn 0.4s ${i * 0.15}s both`
            }}>{item}</div>
          ))}
        </div>
      </div>
    )
  },
  {
    emoji: '📸',
    gradient: 'linear-gradient(135deg, #64C8FF22, #64C8FF44)',
    accent: '#64C8FF',
    title: 'Foto AI & Barcode',
    desc: 'Fotografia la data di scadenza: l\'AI la legge. Scansiona il barcode: prodotto aggiunto con foto, calorie e nutrienti.',
    badge: 'Computer Vision',
    visual: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '8px' }}>📷</div>
          <div style={{ fontSize: '0.7rem', color: '#64C8FF', fontWeight: 700 }}>BARCODE</div>
        </div>
        <div style={{ width: '1px', height: '80px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '8px' }}>🏷️</div>
          <div style={{ fontSize: '0.7rem', color: '#64C8FF', fontWeight: 700 }}>SCADENZA</div>
        </div>
        <div style={{ width: '1px', height: '80px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '8px' }}>🥦</div>
          <div style={{ fontSize: '0.7rem', color: '#64C8FF', fontWeight: 700 }}>A PESO</div>
        </div>
      </div>
    )
  },
  {
    emoji: '👨‍🍳',
    gradient: 'linear-gradient(135deg, #FF453A22, #FF453A44)',
    accent: '#FF453A',
    title: 'Chef AI Anti-Spreco',
    desc: 'Lo Chef AI analizza i prodotti in scadenza nel tuo frigo e crea ricette stellate su misura — zero sprechi.',
    badge: 'Gemini AI',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
        <div style={{ fontSize: '60px', animation: 'float 3s ease-in-out infinite' }}>👨‍🍳</div>
        <div style={{
          background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.3)',
          borderRadius: '12px', padding: '10px 16px', maxWidth: '220px', textAlign: 'center'
        }}>
          <div style={{ color: '#FF453A', fontWeight: 800, fontSize: '0.8rem', marginBottom: '4px' }}>💡 Idea Chef</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
            "Pasta con 🧀 Grana, 🍳 Uovo e 🥓 Pancetta — scade oggi!"
          </div>
        </div>
      </div>
    )
  },
  {
    emoji: '💳',
    gradient: 'linear-gradient(135deg, #FFD70022, #FFD70044)',
    accent: '#FFD700',
    title: 'Carte Fedeltà & Sconti',
    desc: 'Scansiona la tua tessera e portala sempre con te. L\'AI rileva automaticamente punti e coupon dallo scontrino.',
    badge: 'Wallet Digitale',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '10px' }}>
        {[
          { name: 'Conad', color: '#E30613' },
          { name: 'Esselunga', color: '#F7941D' },
          { name: 'Coop', color: '#E2001A' },
        ].map((card, i) => (
          <div key={card.name} style={{
            width: '200px', height: '36px', borderRadius: '8px',
            background: `linear-gradient(135deg, ${card.color}, ${card.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 12px', fontSize: '0.8rem', fontWeight: 700, color: 'white',
            boxShadow: `0 4px 12px ${card.color}44`,
            transform: `translateX(${(i - 1) * 8}px) rotate(${(i - 1) * 2}deg)`,
            animation: `slideIn 0.4s ${i * 0.1}s both`
          }}>
            <span>{card.name}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>● ● ●</span>
          </div>
        ))}
      </div>
    )
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    gradient: 'linear-gradient(135deg, #BF5AF222, #BF5AF244)',
    accent: '#BF5AF2',
    title: 'Frigo Condiviso',
    desc: 'Condividi il frigo con familiari o coinquilini. Tutti vedono i prodotti in tempo reale, aggiungono articoli e collaborano sulla spesa.',
    badge: 'Family Sharing',
    visual: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '0px', position: 'relative' }}>
        {['👩', '🧑', '👦', '👧'].map((avatar, i) => (
          <div key={i} style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: `rgba(191,90,242,${0.1 + i * 0.05})`,
            border: '2px solid rgba(191,90,242,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px',
            marginLeft: i > 0 ? '-12px' : '0',
            zIndex: 4 - i,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>{avatar}</div>
        ))}
        <div style={{
          marginLeft: '16px', background: 'rgba(191,90,242,0.15)', border: '1px solid rgba(191,90,242,0.4)',
          borderRadius: '12px', padding: '10px 14px'
        }}>
          <div style={{ color: '#BF5AF2', fontWeight: 800, fontSize: '0.8rem' }}>🔗 Connessi</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginTop: '2px' }}>4 persone · 1 frigo</div>
        </div>
      </div>
    )
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding } = useAuthStore();
  const navigate = useNavigate();

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  const handleNext = async () => {
    if (!isLast) {
      setCurrentSlide(s => s + 1);
    } else {
      setIsSubmitting(true);
      try {
        await completeOnboarding({});
        navigate('/');
      } catch (err) {
        console.error("Errore durante l'onboarding:", err);
        setIsSubmitting(false);
      }
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({});
      navigate('/');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'radial-gradient(circle at 30% 20%, rgba(0,255,170,0.06), transparent 50%), var(--bg-main)',
      display: 'flex', flexDirection: 'column', color: 'white',
      overflow: 'hidden', position: 'relative'
    }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrentSlide(i)} style={{
              height: '4px',
              width: i === currentSlide ? '24px' : '8px',
              borderRadius: '2px',
              background: i <= currentSlide ? slide.accent : 'rgba(255,255,255,0.15)',
              transition: 'all 0.35s ease',
              cursor: 'pointer'
            }} />
          ))}
        </div>
        <button
          onClick={handleSkip}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}
        >
          Salta
        </button>
      </div>

      {/* Main slide area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 32px' }} key={currentSlide}>
        
        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            background: `${slide.accent}20`, border: `1px solid ${slide.accent}50`,
            borderRadius: '20px', padding: '4px 14px',
            color: slide.accent, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px'
          }}>
            ✦ {slide.badge}
          </div>
        </div>

        {/* Visual area */}
        <div style={{
          background: slide.gradient,
          border: `1px solid ${slide.accent}20`,
          borderRadius: '28px', marginBottom: '28px',
          padding: '24px 16px', overflow: 'hidden',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {slide.visual}
        </div>

        {/* Text */}
        <div style={{ marginBottom: '32px', animation: 'slideUp 0.4s 0.05s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <h1 style={{ margin: '0 0 12px', fontSize: '1.9rem', fontWeight: 900, lineHeight: 1.1 }}>
            {slide.title}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: '1.55' }}>
            {slide.desc}
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '18px',
            background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}99)`,
            border: 'none', borderRadius: '20px',
            color: '#000', fontWeight: 900, fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: `0 12px 32px ${slide.accent}40`,
            transition: 'all 0.2s',
            animation: 'slideUp 0.4s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}
        >
          {isLast
            ? <><CheckCircle2 size={22} /> Inizia Subito</>
            : <>Avanti <ChevronRight size={22} /></>}
        </button>

        {/* Dots below button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === currentSlide ? '20px' : '6px', height: '6px',
              borderRadius: '3px',
              background: i === currentSlide ? slide.accent : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>
      </div>

      {isSubmitting && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 1s ease-in-out infinite' }}>🚀</div>
            <h2 style={{ margin: 0, color: 'white' }}>Configurazione in corso...</h2>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}

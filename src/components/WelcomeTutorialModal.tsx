import { useState } from 'react';
import { Camera, Layers, ScanBarcode, ChevronRight, CheckCircle2 } from 'lucide-react';

interface WelcomeTutorialModalProps {
  onComplete: () => void;
}

export default function WelcomeTutorialModal({ onComplete }: WelcomeTutorialModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Il Frigorifero Magico",
      description: "Benvenuto su FrigoRadar! Qui il tuo inventario si compila (quasi) da solo. Dimentica l'inserimento manuale.",
      icon: <Layers size={48} color="#00FFAA" />,
      color: "rgba(0, 255, 170, 0.2)",
      primary: "#00FFAA"
    },
    {
      title: "1. Scatta & Dimentica",
      description: "Inizia fotografando lo scontrino della spesa. L'Intelligenza Artificiale smisterà i prodotti, stimerà le date di scadenza e li organizzerà in un batter d'occhio.",
      icon: <Camera size={48} color="#64C8FF" />,
      color: "rgba(100, 200, 255, 0.2)",
      primary: "#64C8FF"
    },
    {
      title: "2. Il Tocco Finale",
      description: "Vuoi dettagli perfetti? Apri la scheda di un prodotto nel frigo e scansiona il codice a barre per ottenere foto, NutriScore e calorie automaticamente.",
      icon: <ScanBarcode size={48} color="#FF9F0A" />,
      color: "rgba(255, 159, 10, 0.2)",
      primary: "#FF9F0A"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)', padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, var(--bg-panel-solid) 0%, #051A18 100%)',
        width: '100%', maxWidth: '400px',
        borderRadius: '32px', padding: '32px', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === step ? steps[i].primary : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: steps[step].color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {steps[step].icon}
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center', minHeight: '140px' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>
            {steps[step].title}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
            {steps[step].description}
          </p>
        </div>

        {/* Button */}
        <button 
          onClick={handleNext}
          style={{
            width: '100%', marginTop: '24px', padding: '16px',
            background: steps[step].primary, color: 'black',
            border: 'none', borderRadius: '16px',
            fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: `0 8px 24px ${steps[step].color}`
          }}
        >
          {step === steps.length - 1 ? (
            <> Inizia Subito <CheckCircle2 size={24} /> </>
          ) : (
            <> Avanti <ChevronRight size={24} /> </>
          )}
        </button>

      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

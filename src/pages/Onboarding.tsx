import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { ChevronRight, Target, Users, Leaf, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    id: 'goal',
    title: 'Qual è il tuo obiettivo?',
    subtitle: 'Aiutaci a personalizzare la tua esperienza',
    icon: <Target size={32} color="#FFD700" />,
    options: [
      { id: 'save_money', label: 'Risparmiare sulla spesa', icon: '💰' },
      { id: 'reduce_waste', label: 'Ridurre gli sprechi', icon: '🌍' },
      { id: 'eat_healthy', label: 'Mangiare più sano', icon: '🥗' },
      { id: 'organize', label: 'Organizzare i pasti', icon: '📅' }
    ]
  },
  {
    id: 'people',
    title: 'Per quante persone cucini?',
    subtitle: 'Per dosare le ricette dello Chef AI',
    icon: <Users size={32} color="#00FFAA" />,
    options: [
      { id: '1', label: 'Solo per me', icon: '🧑' },
      { id: '2', label: 'In due', icon: '👫' },
      { id: '3', label: 'In tre', icon: '👨‍👩‍👦' },
      { id: '4plus', label: 'Quattro o più', icon: '👨‍👩‍👧‍👦' }
    ]
  },
  {
    id: 'diet',
    title: 'Segui una dieta in particolare?',
    subtitle: 'Lo Chef AI eviterà ingredienti indesiderati',
    icon: <Leaf size={32} color="#32D74B" />,
    options: [
      { id: 'none', label: 'Nessuna (Onnivoro)', icon: '🍖' },
      { id: 'vegetarian', label: 'Vegetariana', icon: '🥦' },
      { id: 'vegan', label: 'Vegana', icon: '🌱' },
      { id: 'gluten_free', label: 'Senza Glutine', icon: '🌾' }
    ]
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding } = useAuthStore();
  const navigate = useNavigate();

  const handleSelect = async (optionId: string) => {
    const stepId = STEPS[currentStep].id;
    const newPrefs = { ...preferences, [stepId]: optionId };
    setPreferences(newPrefs);

    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setIsSubmitting(true);
      try {
        await completeOnboarding(newPrefs);
        navigate('/');
      } catch (err) {
        console.error("Errore durante l'onboarding:", err);
        setIsSubmitting(false);
      }
    }
  };

  const step = STEPS[currentStep];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top right, rgba(0,255,170,0.1), transparent 40%), var(--bg-main)',
      display: 'flex', flexDirection: 'column', padding: '24px', color: 'white'
    }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', marginTop: '20px' }}>
        {STEPS.map((_, idx) => (
          <div key={idx} style={{ 
            flex: 1, height: '4px', borderRadius: '2px',
            background: idx <= currentStep ? '#FFD700' : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ animation: 'slideUp 0.4s ease' }} key={currentStep}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
              {step.icon}
            </div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', fontWeight: 800 }}>{step.title}</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>{step.subtitle}</p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {step.options.map(opt => {
              const isSelected = preferences[step.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  disabled={isSubmitting}
                  style={{
                    background: isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                    padding: '20px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(0.98)' : 'scale(1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                  </div>
                  <ChevronRight size={20} color={isSelected ? '#FFD700' : 'var(--text-muted)'} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)' }}>
          <div style={{ textAlign: 'center' }}>
            <Sparkles size={40} color="#FFD700" className="animate-pulse" style={{ marginBottom: '16px' }} />
            <h2 style={{ margin: 0 }}>Preparazione profilo...</h2>
          </div>
        </div>
      )}
    </div>
  );
}

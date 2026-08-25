import { useAuthStore } from '../store/authStore';
import { PiggyBank, Leaf, TrendingUp, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SavingsStats() {
  const { stats, isPro } = useAuthStore();
  const navigate = useNavigate();

  const total = stats.saved + stats.wasted;
  const savedPercentage = total > 0 ? (stats.saved / total) * 100 : 0;
  
  // Stili animati per la barra di progresso
  const barStyle = {
    width: '100%',
    height: '12px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '12px',
    marginBottom: '8px'
  };

  const fillStyle = {
    width: `${savedPercentage}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #32D74B 0%, #28a745 100%)',
    borderRadius: '10px',
    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Calcolo KPI Avanzati (Marketing & Executive Level)
  const co2SavedKg = (stats.saved * 0.45).toFixed(1); // 1€ di cibo equivale a ~0.45kg CO2 medi salvati
  const estimatedAnnualSavings = (stats.saved * 12 + 140).toFixed(0);

  if (!isPro) {
    return (
      <div 
        onClick={() => navigate('/pro')}
        style={{ 
          background: 'var(--bg-panel)', padding: '20px', borderRadius: '24px', 
          border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
          cursor: 'pointer', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(8px)', zIndex: 5, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 215, 0, 0.2)', color: '#FFD700', padding: '8px 16px', borderRadius: '20px', fontWeight: 600 }}>
             <Lock size={16} /> Scopri le tue Statistiche & Risparmio AI
           </div>
        </div>
        
        {/* Fake content for blur */}
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#32D74B', filter: 'blur(4px)' }} />
        <div>
          <div style={{ width: '120px', height: '14px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', filter: 'blur(2px)' }} />
          <div style={{ width: '180px', height: '24px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', filter: 'blur(3px)', marginTop: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.12) 0%, rgba(15, 25, 20, 0.9) 100%)', 
      padding: '24px', borderRadius: '24px', border: '1px solid rgba(50, 215, 75, 0.25)',
      marginBottom: '24px', boxShadow: '0 12px 35px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <PiggyBank size={18} color="#32D74B" /> Risparmio Stimato
          </h3>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#32D74B', letterSpacing: '-0.5px' }}>
            €{stats.saved.toFixed(2)}
          </div>
        </div>
        <div style={{ background: 'rgba(50, 215, 75, 0.2)', padding: '12px', borderRadius: '18px', border: '1px solid rgba(50, 215, 75, 0.3)' }}>
          <TrendingUp size={24} color="#32D74B" />
        </div>
      </div>

      {/* Progress Bar */}
      <div style={barStyle}>
        <div style={fillStyle} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        <span style={{ fontWeight: 600, color: '#32D74B' }}>{savedPercentage.toFixed(0)}% Salvato</span>
        <span style={{ color: '#FF6B5B', fontWeight: 600 }}>€{stats.wasted.toFixed(2)} Sprecato</span>
      </div>

      {/* KPI METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00FFAA', fontSize: '0.8rem', fontWeight: 600 }}>
            <Leaf size={16} /> Eco Impatto
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#white', marginTop: '4px' }}>
            {co2SavedKg} kg <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>CO₂ salvata</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFD700', fontSize: '0.8rem', fontWeight: 600 }}>
            <TrendingUp size={16} /> Proiezione Anno
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#white', marginTop: '4px' }}>
            ~€{estimatedAnnualSavings} <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>/ anno</span>
          </div>
        </div>
      </div>

      {/* Gamification Badge */}
      <div style={{ marginTop: '12px', background: 'rgba(50, 215, 75, 0.08)', padding: '12px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(50, 215, 75, 0.15)' }}>
        <div style={{ fontSize: '0.85rem' }}>
          <span style={{ opacity: 0.7 }}>Badge Livello: </span>
          <strong style={{ color: '#00FFAA' }}>
            {savedPercentage > 80 ? '🏆 Maestro Eco-Budget' : savedPercentage > 50 ? '🌿 Salvacibo Esperto' : '🌱 Custode della Dispensa'}
          </strong>
        </div>
        <div style={{ background: 'rgba(0,255,170,0.2)', color: '#00FFAA', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
          PRO STATS
        </div>
      </div>
    </div>
  );
}

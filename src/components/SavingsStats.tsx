import { useAuthStore } from '../store/authStore';
import { PiggyBank, Leaf, TrendingUp, AlertTriangle, Lock } from 'lucide-react';
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
             <Lock size={16} /> Scopri quanto potresti risparmiare
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
      background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.1) 0%, rgba(20, 30, 20, 0.6) 100%)', 
      padding: '24px', borderRadius: '24px', border: '1px solid rgba(50, 215, 75, 0.2)',
      marginBottom: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PiggyBank size={18} color="#32D74B" /> Soldi Risparmiati
          </h3>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#32D74B' }}>
            €{stats.saved.toFixed(2)}
          </div>
        </div>
        <div style={{ background: 'rgba(50, 215, 75, 0.2)', padding: '12px', borderRadius: '50%' }}>
          <TrendingUp size={24} color="#32D74B" />
        </div>
      </div>

      <div style={barStyle}>
        <div style={fillStyle} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        <span>{savedPercentage.toFixed(0)}% Salvato</span>
        <span style={{ color: '#FF6B5B' }}>€{stats.wasted.toFixed(2)} Sprecato</span>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Leaf size={16} color="#32D74B" />
          <div style={{ fontSize: '0.8rem' }}>
            Livello:<br/><strong style={{ color: 'white' }}>{savedPercentage > 80 ? 'Albero d\'Oro' : savedPercentage > 50 ? 'Guerriero Verde' : 'Principiante'}</strong>
          </div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255, 107, 91, 0.1)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} color="#FF6B5B" />
          <div style={{ fontSize: '0.8rem' }}>
            Obiettivo:<br/><strong style={{ color: 'white' }}>Riduci gli sprechi</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

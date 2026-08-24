import { useState } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Sparkles, Users, Clock, Flame, CheckCircle2, ChevronRight, Utensils } from 'lucide-react';

export default function AiRecipes() {
  const { items, setPendingRecipe } = useInventoryStore();
  
  const [peopleCount, setPeopleCount] = useState(2);
  const [difficulty, setDifficulty] = useState<'FACILE' | 'MEDIO' | 'STELLATO'>('FACILE');
  const [priority, setPriority] = useState<'TUTTI' | 'IN_SCADENZA'>('IN_SCADENZA');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [cooked, setCooked] = useState(false);

  const generateRecipe = async () => {
    setLoading(true);
    setRecipe(null);
    setCooked(false);

    try {
      const payload = items.map(i => ({
        original_id: i.id,
        name: i.custom_name || 'Prodotto',
        quantity: i.quantity,
        expiration_date: i.expiration_date
      }));

      const res = await fetch('/api/generateRecipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload, peopleCount, difficulty, priority })
      });

      if (res.ok) {
        const data = await res.json();
        setRecipe(data);
      } else {
        const errData = await res.json().catch(() => null);
        console.error("API Error:", res.status, errData);
        alert(`Errore del server: ${res.status}. ${errData?.error || 'Riprova più tardi.'} Dettagli: ${errData?.details || ''}`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Errore di connessione. Controlla la tua rete.");
    } finally {
      setLoading(false);
    }
  };

  const handleCookNow = () => {
    if (!recipe || !recipe.ingredients_used) return;
    setPendingRecipe(recipe);
    setCooked(true);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', minHeight: '100%', color: 'white' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', padding: '10px', borderRadius: '14px', color: 'black' }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Chef AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Ricette anti-spreco su misura
          </p>
        </div>
      </div>

      {/* INPUTS */}
      {!recipe && !loading && !cooked && (
        <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Impostazioni</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Users size={20} />
              <span>Persone</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', fontSize: '1.2rem' }}>-</button>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, width: '20px', textAlign: 'center' }}>{peopleCount}</span>
              <button onClick={() => setPeopleCount(peopleCount + 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', fontSize: '1.2rem' }}>+</button>
            </div>
          </div>

          {/* Priorità ingredienti */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Priorità alimenti</label>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <button 
                type="button" 
                onClick={() => setPriority('IN_SCADENZA')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: priority === 'IN_SCADENZA' ? 'rgba(255, 107, 91, 0.2)' : 'transparent',
                  color: priority === 'IN_SCADENZA' ? 'var(--accent)' : 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⏰ In Scadenza
              </button>
              <button 
                type="button" 
                onClick={() => setPriority('TUTTI')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: priority === 'TUTTI' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🥗 Tutti
              </button>
            </div>
          </div>

          {/* Livello Ricetta */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Livello Ricetta</label>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <button 
                type="button" 
                onClick={() => setDifficulty('FACILE')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: difficulty === 'FACILE' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🥗 Facile
              </button>
              <button 
                type="button" 
                onClick={() => setDifficulty('MEDIO')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: difficulty === 'MEDIO' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🍝 Medio
              </button>
              <button 
                type="button" 
                onClick={() => setDifficulty('STELLATO')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: difficulty === 'STELLATO' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                  color: difficulty === 'STELLATO' ? '#FFD700' : 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⭐️ Stellato
              </button>
            </div>
          </div>

          <button 
            onClick={generateRecipe}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: 'black', fontSize: '1.1rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)'
            }}
          >
            <Utensils size={20} /> Genera Ricetta Magica
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
          <Sparkles size={48} color="#FFD700" style={{ animation: 'pulse 1.5s infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Lo Chef sta pensando...</p>
        </div>
      )}

      {/* RECIPE RESULT */}
      {recipe && !loading && !cooked && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 215, 0, 0.05)' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '1.6rem', color: '#FFD700' }}>{recipe.title}</h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Clock size={16} /> {recipe.prep_time_minutes} min
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Flame size={16} /> {recipe.difficulty}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Ingredienti dal Frigo</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                {recipe.ingredients_used.map((ing: any, i: number) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>{ing.name}</span>
                    <span style={{ color: '#32D74B', fontWeight: 600 }}>- {ing.quantity_deducted} {ing.unit}</span>
                  </li>
                ))}
              </ul>

              <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Da aggiungere</h4>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
                {recipe.extra_ingredients_needed.join(', ')}
              </p>

              <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Preparazione</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recipe.steps.map((step: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,215,0,0.2)', 
                      color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
                    }}>{i + 1}</div>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCookNow}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: '#32D74B', color: 'black', fontSize: '1.1rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(50, 215, 75, 0.3)'
            }}
          >
            <CheckCircle2 size={20} /> Cucina Ora (Scala ingredienti)
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {cooked && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px', animation: 'slideUp 0.4s ease' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(50, 215, 75, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={48} color="#32D74B" />
          </div>
          <h2 style={{ margin: 0 }}>Divertiti ai fornelli!</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>La ricetta è stata salvata in sospeso. Quando riaprirai l'app ti chiederemo di confermare gli ingredienti esatti per decurtarli dal frigo.</p>
          <button 
            onClick={() => { setRecipe(null); setCooked(false); }}
            style={{ marginTop: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Prepara un'altra ricetta <ChevronRight size={16} />
          </button>
        </div>
      )}

    </div>
  );
}

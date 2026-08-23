import { useState } from 'react';
import { X, Calendar, Refrigerator, Box } from 'lucide-react';
import { addDays } from 'date-fns';

interface AddItemModalProps {
  initialData?: {
    name?: string;
    barcode?: string;
    location?: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'OTHER';
    days?: number;
    category?: string;
    health_score?: string;
  } | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

export default function AddItemModal({ initialData, onSave, onClose }: AddItemModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  
  // Scadenza di default: Oggi + i giorni stimati (o 7 di base)
  const defaultExp = addDays(new Date(), initialData?.days || 7).toISOString().split('T')[0];
  const [expiry, setExpiry] = useState(defaultExp);
  
  const [location, setLocation] = useState<'FRIDGE'|'FREEZER'|'PANTRY'|'OTHER'>(initialData?.location || 'FRIDGE');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      custom_name: name,
      barcode: initialData?.barcode || null,
      expiration_date: expiry,
      location: location,
      quantity: quantity,
      is_frozen: location === 'FREEZER',
      health_score: initialData?.health_score || null
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'var(--bg-panel-solid)',
        width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>
            {initialData?.barcode ? 'Conferma Prodotto' : 'Aggiungi Prodotto'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {initialData?.category && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {initialData.category}
            </div>
            {initialData.health_score && initialData.health_score !== 'Sconosciuto' && (
              <div style={{ 
                background: initialData.health_score === 'Sano' ? 'rgba(50, 215, 75, 0.15)' : (initialData.health_score === 'Moderato' ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 69, 58, 0.15)'), 
                color: initialData.health_score === 'Sano' ? '#32D74B' : (initialData.health_score === 'Moderato' ? '#FF9F0A' : '#FF453A'),
                padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 
              }}>
                {initialData.health_score}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome Prodotto</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="es. Latte Parzialmente Scremato"
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scadenza</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="date" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantità</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.2rem' }}>-</button>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', padding: '0 10px' }}>{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.2rem' }}>+</button>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dove lo conservi?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => setLocation('FRIDGE')}
                style={{ 
                  padding: '12px 8px', borderRadius: '12px', border: '1px solid',
                  background: location === 'FRIDGE' ? 'rgba(0, 255, 170, 0.15)' : 'var(--bg-panel)',
                  borderColor: location === 'FRIDGE' ? 'var(--primary)' : 'var(--border)',
                  color: location === 'FRIDGE' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                }}
              >
                <Refrigerator size={24} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Frigo</span>
              </button>

              <button 
                type="button" 
                onClick={() => setLocation('FREEZER')}
                style={{ 
                  padding: '12px 8px', borderRadius: '12px', border: '1px solid',
                  background: location === 'FREEZER' ? 'rgba(100, 200, 255, 0.15)' : 'var(--bg-panel)',
                  borderColor: location === 'FREEZER' ? '#64C8FF' : 'var(--border)',
                  color: location === 'FREEZER' ? '#64C8FF' : 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                }}
              >
                <Box size={24} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Freezer</span>
              </button>
              
              <button 
                type="button" 
                onClick={() => setLocation('PANTRY')}
                style={{ 
                  padding: '12px 8px', borderRadius: '12px', border: '1px solid',
                  background: location === 'PANTRY' ? 'rgba(255, 170, 0, 0.15)' : 'var(--bg-panel)',
                  borderColor: location === 'PANTRY' ? '#FFAA00' : 'var(--border)',
                  color: location === 'PANTRY' ? '#FFAA00' : 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                }}
              >
                <Box size={24} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dispensa</span>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            Salva Prodotto
          </button>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

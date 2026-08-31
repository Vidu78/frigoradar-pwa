import { useState } from 'react';
import { useInventoryStore, type PendingRecipe } from '../store/inventoryStore';
import { X, CheckCircle2 } from 'lucide-react';

interface ConfirmCookModalProps {
  recipe: PendingRecipe;
  onClose: () => void;
}

export default function ConfirmCookModal({ recipe, onClose }: ConfirmCookModalProps) {
  const { consumeRecipeIngredients, setPendingRecipe } = useInventoryStore();
  
  // Create a local state for editing ingredients before confirming
  const [ingredients, setIngredients] = useState(
    recipe.ingredients_used.map(ing => ({ ...ing }))
  );
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateQty = (index: number, delta: number) => {
    const newIngredients = [...ingredients];
    const newQty = Math.max(0, newIngredients[index].quantity_deducted + delta);
    newIngredients[index].quantity_deducted = newQty;
    setIngredients(newIngredients);
  };

  const handleConfirm = async () => {
    setSaving(true);
    // Filter out items that were set to 0
    const finalIngredients = ingredients.filter(i => i.quantity_deducted > 0);
    
    await consumeRecipeIngredients(finalIngredients);
    setPendingRecipe(null);
    setSuccess(true);
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleDiscard = () => {
    setPendingRecipe(null);
    onClose();
  };

  if (success) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{ textAlign: 'center', animation: 'slideUp 0.4s ease' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(50, 215, 75, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <CheckCircle2 size={48} color="#32D74B" />
          </div>
          <h2 style={{ color: 'white', margin: 0 }}>Ingredienti Scalati!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Lo storico consumi è stato aggiornato.</p>
        </div>
      </div>
    );
  }

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
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'white' }}>
            Hai cucinato?
          </h3>
          <button aria-label="Chiudi" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--primary)', marginBottom: '24px', fontSize: '1.1rem', fontWeight: 600 }}>
          {recipe.title}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Conferma le quantità realmente utilizzate per decurtarle dal frigo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', maxHeight: '40vh', overflowY: 'auto' }}>
          {ingredients.map((ing, idx) => (
            <div key={idx} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'white', fontWeight: 500 }}>{ing.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ing.unit || 'pz'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => handleUpdateQty(idx, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                <span style={{ color: 'white', fontWeight: 700, width: '20px', textAlign: 'center' }}>{ing.quantity_deducted}</span>
                <button onClick={() => handleUpdateQty(idx, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleDiscard}
            disabled={saving}
            style={{
              flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 69, 58, 0.5)',
              background: 'transparent', color: '#FF453A', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Annulla
          </button>
          <button 
            onClick={handleConfirm}
            disabled={saving}
            style={{
              flex: 2, padding: '16px', borderRadius: '16px', border: 'none',
              background: '#32D74B', color: 'black', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', justifyContent: 'center'
            }}
          >
            {saving ? 'Salvataggio...' : 'Conferma Consumo'}
          </button>
        </div>

      </div>
    </div>
  );
}

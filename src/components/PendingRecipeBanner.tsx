import { useState } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { UtensilsCrossed } from 'lucide-react';
import ConfirmCookModal from './ConfirmCookModal';

export default function PendingRecipeBanner() {
  const { pendingRecipe } = useInventoryStore();
  const [showModal, setShowModal] = useState(false);

  if (!pendingRecipe) return null;

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          right: '20px',
          background: 'rgba(50, 215, 75, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(50, 215, 75, 0.3)',
          zIndex: 90,
          cursor: 'pointer',
          animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '50%', display: 'flex' }}>
          <UtensilsCrossed size={20} color="black" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, color: 'black', fontSize: '1rem', fontWeight: 700 }}>Hai cucinato?</h4>
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.7)', fontSize: '0.85rem', fontWeight: 500 }}>
            Conferma gli ingredienti di "{pendingRecipe.title}"
          </p>
        </div>
      </div>

      {showModal && (
        <ConfirmCookModal 
          recipe={pendingRecipe}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

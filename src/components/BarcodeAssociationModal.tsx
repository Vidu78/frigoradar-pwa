import { X, Plus, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface BarcodeAssociationModalProps {
  scannedData: any;
  candidates: any[];
  onClose: () => void;
  onAddNew: () => void;
  onAssociate: (itemId: string, updates: any) => Promise<void>;
}

export default function BarcodeAssociationModal({ scannedData, candidates, onClose, onAddNew, onAssociate }: BarcodeAssociationModalProps) {
  const [associating, setAssociating] = useState<string | null>(null);

  const handleAssociate = async (itemId: string) => {
    setAssociating(itemId);
    const updates: any = { barcode: scannedData.barcode };
    if (scannedData.imageUrl) updates.image_url = scannedData.imageUrl;
    if (scannedData.brand) updates.brand = scannedData.brand;
    if (scannedData.ingredients) updates.ingredients = scannedData.ingredients;
    if (scannedData.nutriscore) updates.nutriscore = scannedData.nutriscore;
    if (scannedData.nutritional_info) updates.nutritional_info = scannedData.nutritional_info;
    if (scannedData.health_score && scannedData.health_score !== 'Sconosciuto') updates.health_score = scannedData.health_score;

    await onAssociate(itemId, updates);
    setAssociating(null);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'var(--bg-panel-solid)', width: '100%', maxWidth: '400px',
        borderRadius: '24px', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Prodotto Trovato</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {scannedData.imageUrl ? (
              <img src={scannedData.imageUrl} alt="" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={24} color="rgba(255,255,255,0.5)" />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{scannedData.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{scannedData.brand || scannedData.category}</div>
            </div>
          </div>

          <button 
            onClick={onAddNew}
            style={{
              width: '100%', padding: '14px', background: 'var(--primary)', color: 'black',
              border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px'
            }}
          >
            <Plus size={20} /> Aggiungi come Nuovo Prodotto
          </button>

          {candidates.length > 0 && (
            <>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>Oppure associa a un prodotto in frigo:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {candidates.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleAssociate(c.id)}
                    disabled={associating !== null}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px', color: 'white', cursor: associating === c.id ? 'wait' : 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{c.custom_name || c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.category} • {c.location}</div>
                    </div>
                    {associating === c.id ? <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', flexShrink: 0 }} /> : <LinkIcon size={18} color="var(--primary)" style={{ flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

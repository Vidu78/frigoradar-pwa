import { useState, useEffect } from 'react';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { X, Plus, Trash2, CreditCard } from 'lucide-react';
import Barcode from 'react-barcode';
import BarcodeScanner from './BarcodeScanner';

interface LoyaltyWalletModalProps {
  onClose: () => void;
}

const SUPERMARKETS = [
  { name: 'Esselunga', color: '#FFD700' },
  { name: 'Coop', color: '#E31B23' },
  { name: 'Conad', color: '#F18A00' },
  { name: 'Carrefour', color: '#0054A6' },
  { name: 'Pam', color: '#00833E' },
  { name: 'Lidl', color: '#0050AA' },
  { name: 'Eurospin', color: '#0055A5' },
  { name: 'MD', color: '#009640' },
  { name: 'Penny Market', color: '#E30613' },
  { name: 'Altro', color: '#1E1E1E' }
];

export default function LoyaltyWalletModal({ onClose }: LoyaltyWalletModalProps) {
  const { cards, fetchCards, addCard, deleteCard, loading } = useLoyaltyStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [selectedSupermarket, setSelectedSupermarket] = useState(SUPERMARKETS[0]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleScan = (value: string) => {
    setScannedBarcode(value);
    setIsScanning(false);
  };

  const handleSaveCard = async () => {
    if (!scannedBarcode) return;
    await addCard(selectedSupermarket.name, scannedBarcode, selectedSupermarket.color);
    setScannedBarcode(null);
  };

  if (isScanning) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
            <button onClick={() => setIsScanning(false)} className="icon-button" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <X size={24} />
            </button>
          </div>
          <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <p>Inquadra il codice a barre della tua carta fedeltà</p>
          </div>
        </div>
      </div>
    );
  }

  if (scannedBarcode) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Salva Carta Fedeltà</h3>
            <button onClick={() => setScannedBarcode(null)} className="icon-button"><X size={24} /></button>
          </div>
          <div style={{ padding: '20px 0' }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
               <Barcode value={scannedBarcode} background="transparent" width={1.5} height={60} />
            </div>
            
            <label className="input-label">Seleziona il supermercato</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {SUPERMARKETS.map(sm => (
                <button
                  key={sm.name}
                  onClick={() => setSelectedSupermarket(sm)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedSupermarket.name === sm.name ? sm.color : 'rgba(255,255,255,0.05)',
                    color: selectedSupermarket.name === sm.name ? (sm.color === '#FFD700' ? 'black' : 'white') : 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {sm.name}
                </button>
              ))}
            </div>

            <button 
              className="primary-button" 
              style={{ marginTop: '24px', width: '100%' }}
              onClick={handleSaveCard}
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva Carta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ background: 'var(--bg-color)', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard color="var(--primary)" /> 
            Le Mie Carte
          </h2>
          <button onClick={onClose} className="icon-button"><X size={24} /></button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CreditCard size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p>Non hai ancora aggiunto nessuna carta fedeltà.</p>
            </div>
          ) : (
            cards.map(card => {
              const isExpanded = expandedCardId === card.id;
              const textColor = card.color === '#FFD700' ? 'black' : 'white';
              
              return (
                <div 
                  key={card.id}
                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  style={{
                    background: card.color,
                    borderRadius: '16px',
                    padding: '20px',
                    color: textColor,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                    zIndex: isExpanded ? 10 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '20px' : '0' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{card.store_name}</h3>
                    {isExpanded && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                        style={{ background: 'none', border: 'none', color: textColor, opacity: 0.7, padding: '5px' }}
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', textAlign: 'center', marginTop: '10px' }}>
                      <Barcode 
                        value={card.barcode_value} 
                        background="transparent" 
                        lineColor="black"
                        width={2} 
                        height={80} 
                        displayValue={true} 
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button 
          className="primary-button" 
          onClick={() => setIsScanning(true)}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}
        >
          <Plus /> Aggiungi Carta
        </button>
      </div>
    </div>
  );
}

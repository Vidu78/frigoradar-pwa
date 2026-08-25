import { useState, useEffect } from 'react';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { X, Plus, Trash2, CreditCard, Camera, Tag } from 'lucide-react';
import Barcode from 'react-barcode';
import BarcodeScanner from './BarcodeScanner';
import { useToastStore } from '../store/toastStore';

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
  const { cards, discounts, fetchCards, fetchDiscounts, addCard, deleteCard, addPaperDiscount, loading } = useLoyaltyStore();
  const { showToast } = useToastStore();
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [selectedSupermarket, setSelectedSupermarket] = useState(SUPERMARKETS[0]);
  const [customStoreName, setCustomStoreName] = useState("");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
  // Per i coupon cartacei
  const [uploadingDiscount, setUploadingDiscount] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
    fetchDiscounts();
  }, [fetchCards, fetchDiscounts]);

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>, cardId: string, storeName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingDiscount(cardId);
    showToast("Salvataggio sconto...", "info");
    try {
      // Per semplicità inseriamo un nome di default, potremmo chiedere all'utente
      await addPaperDiscount(file, "Sconto Cartaceo/Volantino", "", cardId, storeName);
      showToast("Sconto salvato con successo!", "success");
    } catch (err) {
      showToast("Errore durante il salvataggio", "error");
    } finally {
      setUploadingDiscount(null);
      e.target.value = '';
    }
  };

  const handleScan = (value: string) => {
    setScannedBarcode(value);
    setIsScanning(false);
  };

  const handleSaveCard = async () => {
    if (!scannedBarcode) return;
    const finalName = selectedSupermarket.name === 'Altro' && customStoreName.trim() ? customStoreName.trim() : selectedSupermarket.name;
    await addCard(finalName, scannedBarcode, selectedSupermarket.color);
    setScannedBarcode(null);
    setIsAddingManual(false);
    setCustomStoreName("");
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

  if (isAddingManual || scannedBarcode) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Salva Carta Fedeltà</h3>
            <button onClick={() => { setScannedBarcode(null); setIsAddingManual(false); }} className="icon-button"><X size={24} /></button>
          </div>
          <div style={{ padding: '20px 0' }}>
            
            <button 
              className="secondary-button" 
              onClick={() => setIsScanning(true)}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', marginBottom: '20px' }}
            >
              <Camera size={20} /> Scansiona con Fotocamera
            </button>

            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">Oppure inserisci il codice manualmente</label>
              <input 
                type="text" 
                className="ios-input" 
                placeholder="Es. 1234567890123"
                value={scannedBarcode || ""}
                onChange={(e) => setScannedBarcode(e.target.value)}
              />
            </div>

            {scannedBarcode && (
              <div style={{ background: 'white', padding: '10px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                 <Barcode value={scannedBarcode} background="transparent" width={1.5} height={60} />
              </div>
            )}
            
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

            {selectedSupermarket.name === 'Altro' && (
              <div style={{ marginTop: '16px' }}>
                <label className="input-label">Nome Carta (Opzionale)</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  placeholder="Es. Palestra, Ikea..."
                  value={customStoreName}
                  onChange={(e) => setCustomStoreName(e.target.value)}
                />
              </div>
            )}

            <button 
              className="primary-button" 
              style={{ marginTop: '24px', width: '100%' }}
              onClick={handleSaveCard}
              disabled={loading || !scannedBarcode}
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
              const cardDiscounts = discounts.filter(d => d.loyalty_card_id === card.id);
              
              
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isExpanded ? '20px' : '0' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{card.store_name}</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                        {card.points_balance > 0 ? `${card.points_balance} Punti` : 'Nessun punto'}
                      </p>
                    </div>
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
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ background: 'white', padding: '15px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
                        <Barcode 
                          value={card.barcode_value} 
                          background="transparent" 
                          lineColor="black"
                          width={2} 
                          height={80} 
                          displayValue={true} 
                        />
                      </div>
                      
                      <div style={{ borderTop: `1px solid ${textColor}40`, paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={16} /> Sconti ({cardDiscounts.length})
                          </h4>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '12px', cursor: 'pointer' }}>
                            <Camera size={14} /> Fotografa
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              onChange={(e) => handlePhotoScan(e, card.id, card.store_name)}
                              style={{ display: 'none' }}
                              disabled={uploadingDiscount === card.id}
                            />
                          </label>
                        </div>

                        {cardDiscounts.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Nessuno sconto salvato.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {cardDiscounts.map(disc => (
                              <div key={disc.id} style={{ background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <strong>{disc.discount_amount || disc.description}</strong>
                                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{disc.expiration_date ? `Scade: ${disc.expiration_date}` : ''}</span>
                                </div>
                                {disc.discount_amount && <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{disc.description}</div>}
                                {disc.image_url && (
                                  <a href={disc.image_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.8rem', color: textColor, textDecoration: 'underline' }}>Vedi Foto</a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button 
          className="primary-button" 
          onClick={() => setIsAddingManual(true)}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}
        >
          <Plus /> Aggiungi Carta
        </button>
      </div>
    </div>
  );
}

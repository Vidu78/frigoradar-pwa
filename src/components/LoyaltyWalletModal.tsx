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
                <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
                  {/* 3D Flip Card */}
                  <div 
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                    style={{ 
                      perspective: '1000px', 
                      width: '100%', 
                      height: '210px', 
                      cursor: 'pointer',
                      zIndex: isExpanded ? 10 : 1
                    }}
                  >
                    <div style={{ 
                      position: 'relative', 
                      width: '100%', 
                      height: '100%', 
                      transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)', 
                      transformStyle: 'preserve-3d', 
                      transform: isExpanded ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                    }}>
                      {/* FRONT OF CARD */}
                      <div style={{ 
                        position: 'absolute', inset: 0, backfaceVisibility: 'hidden', 
                        background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`, 
                        borderRadius: '20px', padding: '24px', 
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', 
                        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: textColor
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{card.store_name}</h3>
                          <CreditCard size={32} style={{ opacity: 0.3 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Saldo Punti</div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{card.points_balance || '0'}</div>
                        </div>
                      </div>

                      {/* BACK OF CARD */}
                      <div style={{ 
                        position: 'absolute', inset: 0, backfaceVisibility: 'hidden', 
                        background: '#ffffff', color: '#000000', 
                        borderRadius: '20px', padding: '20px', 
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                        transform: 'rotateY(180deg)', 
                        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.8)'
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,69,58,0.1)', border: 'none', color: '#FF453A', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={20} />
                        </button>
                        
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#333', position: 'absolute', top: 20, left: 20 }}>{card.store_name}</div>
                        
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', transform: 'scale(1.1)', marginTop: '10px' }}>
                          <Barcode 
                            value={card.barcode_value} 
                            background="transparent" 
                            lineColor="black"
                            width={2} 
                            height={70} 
                            displayValue={true}
                            fontSize={16}
                            margin={0}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DISCOUNTS SECTION (Visible only when card is expanded) */}
                  {isExpanded && (
                    <div style={{ 
                      background: 'var(--bg-panel)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      animation: 'fadeIn 0.4s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                          <Tag size={18} color="var(--primary)" /> I Miei Coupon ({cardDiscounts.length})
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: 'var(--primary)', color: '#000', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,255,170,0.3)' }}>
                          <Camera size={16} /> Fotografa
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
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                          <Tag size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>Nessun coupon salvato per questa carta.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {cardDiscounts.map(disc => (
                            <div key={disc.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${card.color}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{disc.discount_amount || disc.description}</strong>
                                {disc.expiration_date && (
                                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,69,58,0.2)', color: '#FF453A', padding: '4px 8px', borderRadius: '8px', fontWeight: 600 }}>Scade: {disc.expiration_date}</span>
                                )}
                              </div>
                              {disc.discount_amount && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px' }}>{disc.description}</div>}
                              {disc.image_url && (
                                <a href={disc.image_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                                  <Camera size={14} /> Vedi Foto Originale
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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

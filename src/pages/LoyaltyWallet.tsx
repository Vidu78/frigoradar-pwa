import { useState, useEffect } from 'react';
import { StorageLink } from '../components/StorageImage';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { X, Plus, Trash2, CreditCard, Camera, Tag } from 'lucide-react';
import Barcode from 'react-barcode';
import BarcodeScanner from '../components/BarcodeScanner';
import { useToastStore } from '../store/toastStore';
import { useDialogStore } from '../store/dialogStore';

// No props needed since it's a page now

const SUPERMARKETS = [
  { name: 'Esselunga', color: '#002B49', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Esselunga_Logo.svg' },
  { name: 'Coop', color: '#E31B23', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Coop_logo_Italy.svg' },
  { name: 'Conad', color: '#F18A00', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Logo_Conad.svg' },
  { name: 'Carrefour', color: '#0054A6', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Carrefour_logo.svg' },
  { name: 'Pam', color: '#00833E', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_Gruppo_Pam.svg' },
  { name: 'Lidl', color: '#0050AA', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg' },
  { name: 'Eurospin', color: '#0055A5', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Eurospin_logo.svg' },
  { name: 'MD', color: '#E2001A', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/88/MD_Discount_logo.svg' },
  { name: 'Penny Market', color: '#E30613', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Penny_Market_logo.svg' },
  { name: 'Altro', color: '#1E1E1E', logo: '' }
];

export default function LoyaltyWallet() {
  const { cards, discounts, fetchCards, fetchDiscounts, addCard, deleteCard, addPaperDiscount, loading } = useLoyaltyStore();
  const { showToast } = useToastStore();
  const { showDialog } = useDialogStore();
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
    } catch {
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
            <button aria-label="Chiudi" onClick={() => setIsScanning(false)} className="icon-button" style={{ background: 'rgba(0,0,0,0.5)' }}>
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
      <div style={{ 
        position: 'fixed', inset: 0, 
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0f1520 100%)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* HEADER */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button aria-label="Chiudi" 
            onClick={() => { setScannedBarcode(null); setIsAddingManual(false); setCustomStoreName(''); }}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Nuova Carta Fedeltà</h2>
          <div style={{ width: 44 }} />
        </div>

        {/* STEP 1 — SCANSIONA O DIGITA CODICE */}
        <div style={{ padding: '24px 20px 0' }}>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            ① Codice Carta
          </p>
          
          {/* Scan Button — grande e visuale */}
          <button
            onClick={() => setIsScanning(true)}
            style={{
              width: '100%', padding: '20px',
              background: 'linear-gradient(135deg, rgba(0,255,170,0.15) 0%, rgba(0,200,130,0.08) 100%)',
              border: '1.5px dashed rgba(0,255,170,0.5)',
              borderRadius: '20px', color: '#00FFAA',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              cursor: 'pointer', marginBottom: '16px',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(0,255,170,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={26} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Scansiona Barcode</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>Punta la fotocamera sulla carta fisica</div>
            </div>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 600 }}>oppure inserisci a mano</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Code Input — premium glass style */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${scannedBarcode ? 'rgba(0,255,170,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '18px', padding: '6px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            transition: 'border-color 0.2s', marginBottom: '12px'
          }}>
            <CreditCard size={20} color={scannedBarcode ? '#00FFAA' : 'rgba(255,255,255,0.3)'} />
            <input
              type="text"
              placeholder="Codice barcode (es. 1234567890123)"
              value={scannedBarcode || ''}
              onChange={e => setScannedBarcode(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'white', fontSize: '1rem', padding: '14px 0',
                letterSpacing: '1.5px', fontFamily: 'monospace', fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Barcode preview */}
          {scannedBarcode && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <Barcode value={scannedBarcode} background="transparent" width={1.8} height={65} />
            </div>
          )}
        </div>

        {/* STEP 2 — SELEZIONA SUPERMERCATO */}
        <div style={{ padding: '28px 20px 0' }}>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            ② Supermercato
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {SUPERMARKETS.map(sm => {
              const isSelected = selectedSupermarket.name === sm.name;
              return (
                <button
                  key={sm.name}
                  onClick={() => setSelectedSupermarket(sm)}
                  style={{
                    padding: '18px 12px',
                    borderRadius: '18px',
                    border: isSelected ? `2px solid ${sm.color}` : '1.5px solid rgba(255,255,255,0.08)',
                    background: isSelected 
                      ? `linear-gradient(135deg, ${sm.color}30 0%, ${sm.color}10 100%)` 
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    boxShadow: isSelected ? `0 8px 20px ${sm.color}25` : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)'
                  }}
                >
                  {sm.logo ? (
                    <div style={{ 
                      background: 'white', borderRadius: '10px', 
                      padding: '6px 12px', height: '36px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '80px'
                    }}>
                      <img src={sm.logo} alt={sm.name} style={{ height: '24px', maxWidth: '70px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: sm.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={22} color="white" />
                    </div>
                  )}
                  <span style={{ 
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.6)', 
                    fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500 
                  }}>
                    {sm.name}
                  </span>
                  {isSelected && (
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', 
                      background: sm.color, boxShadow: `0 0 8px ${sm.color}` 
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {selectedSupermarket.name === 'Altro' && (
            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard size={18} color="rgba(255,255,255,0.3)" />
              <input
                type="text"
                placeholder="Nome carta (es. Ikea, Decathlon...)"
                value={customStoreName}
                onChange={e => setCustomStoreName(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', padding: '14px 0', outline: 'none' }}
              />
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <div style={{ padding: '32px 20px 48px' }}>
          <button
            onClick={handleSaveCard}
            disabled={loading || !scannedBarcode}
            style={{
              width: '100%', padding: '18px',
              background: (!loading && scannedBarcode) 
                ? 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)' 
                : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '20px',
              color: (!loading && scannedBarcode) ? '#000' : 'rgba(255,255,255,0.3)',
              fontWeight: 800, fontSize: '1.05rem',
              cursor: (!loading && scannedBarcode) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              boxShadow: (!loading && scannedBarcode) ? '0 10px 30px rgba(0,255,170,0.35)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            {loading ? 'Salvataggio in corso...' : (
              <><Plus size={22} /> Aggiungi al Portafoglio</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: '100px' }}>
        <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard color="var(--primary)" size={28} /> 
            Le Mie Carte
          </h2>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{card.store_name}</h3>
                          {SUPERMARKETS.find(s => s.name === card.store_name)?.logo ? (
                            <img 
                              src={SUPERMARKETS.find(s => s.name === card.store_name)?.logo} 
                              alt={card.store_name} 
                              style={{ height: '36px', maxWidth: '90px', objectFit: 'contain', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '8px' }} 
                            />
                          ) : (
                            <CreditCard size={32} style={{ opacity: 0.3 }} />
                          )}
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
                                <StorageLink value={disc.image_url} bucket="receipts" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                                  <Camera size={14} /> Vedi Foto Originale
                                </StorageLink>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* PULSANTE ELIMINA CARTA (SICURO E FUORI DALLA CARTA) */}
                      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const confirmed = await showDialog({
                              title: 'Elimina Carta',
                              message: `Sei sicuro di voler eliminare la carta ${card.store_name}?`,
                              type: 'danger'
                            });
                            if (confirmed) {
                              deleteCard(card.id);
                            }
                          }}
                          style={{
                            background: 'rgba(255,69,58,0.1)',
                            border: '1px solid rgba(255,69,58,0.3)',
                            color: '#FF453A',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 size={16} /> Elimina Carta
                        </button>
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
  );
}

export function LoyaltyWalletModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ background: 'var(--bg-color)', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0 0' }}>
          <button aria-label="Chiudi" onClick={onClose} className="icon-button"><X size={24} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <LoyaltyWallet />
        </div>
      </div>
    </div>
  );
}

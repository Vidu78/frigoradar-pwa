import { useState } from 'react';
import { authHeaders } from '../lib/api';
import { X, Camera, Loader2, Check, Receipt, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { addDays } from 'date-fns';
import AddItemModal from './AddItemModal';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useLoyaltyStore } from '../store/loyaltyStore';

interface ReceiptScannerModalProps {
  onClose: () => void;
  onSaveItem: (data: any) => Promise<void>;
}

export default function ReceiptScannerModal({ onClose, onSaveItem }: ReceiptScannerModalProps) {
  const { session } = useAuthStore();
  const { showToast } = useToastStore();
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [step, setStep] = useState<'camera' | 'review'>('camera');
  
  // State per gestire l'apertura di AddItemModal per un singolo item dallo scontrino
  const [enrichingItemIndex, setEnrichingItemIndex] = useState<number | null>(null);

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);

    const compressImage = (fileToCompress: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToCompress);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Risoluzione più alta per gli scontrini (testo piccolo)
            const MAX_WIDTH = 1200; 
            const MAX_HEIGHT = 1600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); 
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
    };

    try {
      showToast("Analisi scontrino in corso...", "info");
      const base64String = await compressImage(file);
      
      const res = await fetch('/api/analyzeReceipt', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: base64String })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          // Aggiunge stato locale per ogni riga
          const itemsWithState = data.items.map((item: any) => ({
            ...item,
            status: 'pending' // 'pending', 'saved'
          }));
          setItems(itemsWithState);
          setStep('review');
          setStep('review');
          showToast(`Trovati ${itemsWithState.length} prodotti!`, "success");
          
          // Gestione Punti e Sconti Fedeltà
          if (data.store_name) {
            const loyaltyStore = useLoyaltyStore.getState();
            // Assicuriamoci di avere le carte caricate
            if (loyaltyStore.cards.length === 0) await loyaltyStore.fetchCards();
            
            const match = loyaltyStore.cards.find(c => 
              c.store_name.toLowerCase().includes(data.store_name.toLowerCase()) || 
              data.store_name.toLowerCase().includes(c.store_name.toLowerCase())
            );
            
            if (match) {
              if (data.loyalty_points !== undefined && data.loyalty_points !== null) {
                await loyaltyStore.updatePoints(match.id, data.loyalty_points);
                showToast(`Aggiornati ${data.loyalty_points} punti ${match.store_name}!`, "success");
              }
              if (data.discounts && Array.isArray(data.discounts) && data.discounts.length > 0) {
                await loyaltyStore.addDiscounts(data.discounts, match.id, match.store_name);
                showToast(`Trovati ${data.discounts.length} sconti per ${match.store_name}!`, "success");
              }
            }
          }
          
          // Salvataggio scontrino in background
          if (session?.user?.id) {
            const fileName = `${session.user.id}/${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('receipts')
              .upload(fileName, file);
              
            if (!uploadError && uploadData) {
              const totalAmount = data.items.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 1), 0);
              
              await supabase.from('receipts').insert({
                user_id: session.user.id,
                store_name: "Scontrino Scansionato",
                total_amount: totalAmount,
                items_count: data.items.length,
                image_url: fileName
              });
            }
          }

        } else {
          showToast("Nessun prodotto alimentare trovato nello scontrino.", "error");
        }
      } else {
        showToast("Errore durante l'analisi dello scontrino.", "error");
      }
    } catch (error) {
      console.error("Errore scanner scontrino:", error);
      showToast("Errore di rete o del server.", "error");
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const handleQuickSave = async (index: number) => {
    const item = items[index];
    const presumedExpiry = addDays(new Date(), item.estimated_shelf_life_days || 7).toISOString().split('T')[0];
    
    try {
      await onSaveItem({
        custom_name: item.name || item.raw_name,
        expiration_date: presumedExpiry,
        purchase_date: new Date().toISOString().split('T')[0],
        quantity: item.quantity || 1,
        unit: item.unit || 'pz',
        location: item.storage_type || 'PANTRY',
        is_frozen: item.storage_type === 'FREEZER',
        category: item.category || 'Altro',
        price: item.price || null,
        health_score: "Sconosciuto"
      });
      
      const newItems = [...items];
      newItems[index].status = 'saved';
      setItems(newItems);
      showToast(`${item.name} salvato!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Errore durante il salvataggio", "error");
    }
  };

  const handleEnrichedSave = async (data: any) => {
    if (enrichingItemIndex === null) return;
    
    try {
      // Uniamo il prezzo originario dello scontrino ai dati salvati
      const itemFromReceipt = items[enrichingItemIndex];
      const payload = {
        ...data,
        price: itemFromReceipt.price || null
      };
      
      await onSaveItem(payload);
      
      const newItems = [...items];
      newItems[enrichingItemIndex].status = 'saved';
      setItems(newItems);
      setEnrichingItemIndex(null);
    } catch (err) {
      console.error(err);
      showToast("Errore durante il salvataggio", "error");
    }
  };

  const handleImportAll = async () => {
    setScanning(true); // Uso scanning come stato di caricamento generico
    try {
      let savedCount = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.status === 'pending') {
          const productData = {
            custom_name: item.name || item.raw_name,
            quantity: item.quantity || 1,
            unit: item.unit || 'pz',
            category: item.category || 'Altro',
            location: item.storage_type || 'FRIDGE',
            expiration_date: addDays(new Date(), item.default_shelf_life_days || 7).toISOString().split('T')[0],
            purchase_date: new Date().toISOString().split('T')[0],
          };
          await onSaveItem(productData);
          setItems(prev => {
            const next = [...prev];
            next[i].status = 'saved';
            return next;
          });
          savedCount++;
        }
      }
      showToast(`${savedCount} prodotti importati con successo!`, 'success');
    } catch (e) {
      console.error(e);
      showToast("Errore durante l'importazione massiva", "error");
    } finally {
      setScanning(false);
    }
  };

  const allSaved = items.length > 0 && items.every(i => i.status === 'saved');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 1200,
      display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'var(--bg-panel-solid)', width: '100%', height: '90vh',
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={24} color="var(--primary)" />
            {step === 'camera' ? 'Scansiona Scontrino' : 'Carrello in Ingresso'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {step === 'camera' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Scatta una foto al tuo scontrino della spesa.</p>
              <p>L'Intelligenza Artificiale estrarrà i prodotti in pochi secondi!</p>
            </div>
            
            <label 
              style={{
                width: '100%', maxWidth: '300px', height: '200px',
                background: 'rgba(0, 255, 170, 0.1)',
                border: '2px dashed var(--primary)', borderRadius: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
                cursor: 'pointer', transition: 'all 0.2s', color: 'var(--primary)'
              }}
            >
              <input 
                type="file" accept="image/*" capture="environment" 
                onChange={handlePhotoScan} style={{ display: 'none' }} disabled={scanning}
              />
              {scanning ? (
                <>
                  <Loader2 size={48} className="animate-spin" />
                  <span style={{ fontWeight: 600 }}>Lettura in corso...</span>
                </>
              ) : (
                <>
                  <Camera size={48} />
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Scatta Foto Scontrino</span>
                </>
              )}
            </label>
          </div>
        )}

        {step === 'review' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allSaved && (
              <div style={{ background: 'rgba(50, 215, 75, 0.15)', border: '1px solid #32D74B', color: '#32D74B', padding: '16px', borderRadius: '16px', textAlign: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>🎉 Tutto salvato!</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Hai inserito tutti i prodotti nel frigorifero.</p>
                <button onClick={onClose} style={{ marginTop: '12px', background: '#32D74B', color: 'black', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, cursor: 'pointer' }}>Chiudi</button>
              </div>
            )}

            {!allSaved && (
               <>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 170, 0, 0.1)', color: '#FFAA00', padding: '12px', borderRadius: '12px', marginBottom: '8px' }}>
                   <AlertTriangle size={20} />
                   <span style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>Approva i prodotti a lunga conservazione (Pasta, Scatolame) o aggiungi la foto scadenza per i freschi (Carne, Latte).</span>
                 </div>
                 
                 <button 
                   onClick={handleImportAll}
                   disabled={scanning}
                   style={{
                     width: '100%',
                     background: 'var(--primary)',
                     color: 'black',
                     border: 'none',
                     padding: '16px',
                     borderRadius: '16px',
                     fontWeight: 800,
                     fontSize: '1.1rem',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '10px',
                     cursor: scanning ? 'not-allowed' : 'pointer',
                     marginBottom: '16px',
                     boxShadow: '0 8px 24px rgba(0, 255, 170, 0.2)'
                   }}
                 >
                   {scanning ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
                   Importa Tutto Rapidamente
                 </button>
               </>
            )}

            {items.map((item, index) => (
              <div key={index} style={{ 
                background: item.status === 'saved' ? 'rgba(50, 215, 75, 0.05)' : 'rgba(255,255,255,0.05)', 
                border: item.status === 'saved' ? '1px solid rgba(50, 215, 75, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                padding: '16px', borderRadius: '16px', opacity: item.status === 'saved' ? 0.6 : 1,
                display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'white' }}>{item.name || item.raw_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.category} • {item.storage_type === 'FRIDGE' ? 'Frigo' : item.storage_type === 'FREEZER' ? 'Freezer' : 'Dispensa'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {item.price ? `€${item.price.toFixed(2)}` : '--'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>x{item.quantity} {item.unit}</span>
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <button 
                      onClick={() => handleQuickSave(index)}
                      style={{ background: 'rgba(50, 215, 75, 0.15)', color: '#32D74B', border: '1px solid rgba(50, 215, 75, 0.3)', padding: '10px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <Check size={18} /> Salva Rapido
                    </button>
                    <button 
                      onClick={() => setEnrichingItemIndex(index)}
                      style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '10px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <Camera size={18} /> Foto Scadenza
                    </button>
                  </div>
                )}
                {item.status === 'saved' && (
                  <div style={{ textAlign: 'center', color: '#32D74B', fontSize: '0.9rem', fontWeight: 600 }}>
                    Salvato nel frigo!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {enrichingItemIndex !== null && (
        <AddItemModal
          initialData={{
            name: items[enrichingItemIndex].name,
            category: items[enrichingItemIndex].category,
            location: items[enrichingItemIndex].storage_type,
            quantity: items[enrichingItemIndex].quantity,
            unit: items[enrichingItemIndex].unit
          }}
          initialInputMode="photo"
          onSave={handleEnrichedSave}
          onClose={() => setEnrichingItemIndex(null)}
        />
      )}
    </div>
  );
}

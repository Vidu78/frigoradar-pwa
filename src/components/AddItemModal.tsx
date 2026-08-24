import { useState, useEffect } from 'react';
import { X, Calendar, Refrigerator, Box, Camera, Loader2 } from 'lucide-react';
import { addDays } from 'date-fns';
import { useToastStore } from '../store/toastStore';
import { supabase } from '../lib/supabase';

interface AddItemModalProps {
  initialData?: {
    name?: string;
    barcode?: string;
    location?: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'OTHER';
    days?: number;
    category?: string;
    health_score?: string;
    expiration_date?: string;
    unit?: string;
    purchase_date?: string;
    imageUrl?: string;
  } | null;
  initialInputMode?: 'manual' | 'photo';
  onSave: (data: any) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Carni e Salumi',
  'Verdure e Frutta',
  'Latticini e Uova',
  'Pesce e Frutti di Mare',
  'Pane e Pasta',
  'Conserve e Sughi',
  'Dolci e Snack',
  'Bevande',
  'Altro'
];

export default function AddItemModal({ initialData, initialInputMode, onSave, onClose }: AddItemModalProps) {
  const { showToast } = useToastStore();
  const [inputMode, setInputMode] = useState<'manual' | 'photo'>(initialInputMode || 'manual');
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Altro');
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState(initialData?.unit || 'pz');
  const [isExpiryEdited, setIsExpiryEdited] = useState(false);
  
  // Se l'AI ha rilevato una data esatta, usa quella. Altrimenti calcola oggi + days.
  const defaultExp = initialData?.expiration_date 
    ? initialData.expiration_date 
    : addDays(new Date(), initialData?.days || 7).toISOString().split('T')[0];
    
  const [expiry, setExpiry] = useState(defaultExp);
  
  const [location, setLocation] = useState<'FRIDGE'|'FREEZER'|'PANTRY'|'OTHER'>(initialData?.location || 'FRIDGE');
  const [quantity, setQuantity] = useState(1);
  const [scanning, setScanning] = useState(false);

  // Calcolo automatico della durata di conservazione in frigorifero per Frutta e Verdura
  const getVegetableShelfLife = (productName: string): number => {
    const n = productName.toLowerCase();
    if (n.includes('carot') || n.includes('sedan') || n.includes('mela') || n.includes('per') || n.includes('aranc') || n.includes('limon') || n.includes('mandarin')) {
      return 21; // 3 settimane
    }
    if (n.includes('insalat') || n.includes('lattug') || n.includes('rucol') || n.includes('spinac') || n.includes('fragol') || n.includes('bosco') || n.includes('fungh')) {
      return 4; // 4 giorni (molto deperibili)
    }
    if (n.includes('pomodor') || n.includes('zucch') || n.includes('melanz') || n.includes('peperon') || n.includes('cetriol') || n.includes('asparag') || n.includes('pesc') || n.includes('albicoc')) {
      return 7; // 1 settimana
    }
    if (n.includes('patat') || n.includes('cipoll') || n.includes('aglio')) {
      return 30; // 30 giorni (principalmente dispensa)
    }
    return 7; // Default per frutta e verdura
  };

  // Effetto per aggiornare la scadenza se il prodotto è Frutta/Verdura e non è modificato a mano
  useEffect(() => {
    if (category === 'Verdure e Frutta' && name.trim().length > 2 && !isExpiryEdited) {
      const days = getVegetableShelfLife(name);
      const baseDate = purchaseDate ? new Date(purchaseDate) : new Date();
      const presumedExpiry = addDays(baseDate, days).toISOString().split('T')[0];
      setExpiry(presumedExpiry);
    }
  }, [name, category, purchaseDate, isExpiryEdited]);

  const handlePhotoScanInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    
    // Funzione per comprimere l'immagine lato client prima dell'upload
    const compressImage = (fileToCompress: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToCompress);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
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
            // Comprime in JPEG con qualità 60% per un caricamento molto più veloce
            resolve(canvas.toDataURL('image/jpeg', 0.6)); 
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
    };

    try {
      showToast("Comprimo la foto...", "info");
      const base64String = await compressImage(file);
      
      // Funzione helper locale per Blob
      const dataURLtoBlob = (dataurl: string) => {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
      };

      showToast("Salvataggio foto in cloud...", "info");
      try {
        const blob = dataURLtoBlob(base64String);
        const fileName = `product_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });
        
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
          setScannedImageUrl(publicUrlData.publicUrl);
        }
      } catch (uploadEx) {
        console.warn("Upload immagine fallito:", uploadEx);
      }

      showToast("Analisi in corso...", "info");
      
      const res = await fetch('/api/analyzeImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64String })
      });
      
      if (res.ok) {
        const aiData = await res.json();
        if (aiData.expiration_date) {
          setExpiry(aiData.expiration_date);
          showToast("Dati letti con successo dall'AI!", "success");
        } else {
          showToast("Scadenza non trovata in foto. Impostata scadenza stimata.", "info");
        }
        if (aiData.name) setName(aiData.name);
        if (aiData.storage_type) setLocation(aiData.storage_type);
        if (aiData.category) {
          const normalized = aiData.category.toLowerCase();
          let matchedCat = 'Altro';
          if (normalized.includes('carn') || normalized.includes('meat')) matchedCat = 'Carni e Salumi';
          else if (normalized.includes('verdur') || normalized.includes('frutt') || normalized.includes('veg')) matchedCat = 'Verdure e Frutta';
          else if (normalized.includes('latt') || normalized.includes('uov') || normalized.includes('egg') || normalized.includes('dair')) matchedCat = 'Latticini e Uova';
          else if (normalized.includes('pesc') || normalized.includes('fish') || normalized.includes('sea')) matchedCat = 'Pesce e Frutti di Mare';
          else if (normalized.includes('pan') || normalized.includes('past') || normalized.includes('grain') || normalized.includes('cere')) matchedCat = 'Pane e Pasta';
          else if (normalized.includes('conserv') || normalized.includes('sug') || normalized.includes('sauce') || normalized.includes('can')) matchedCat = 'Conserve e Sughi';
          else if (normalized.includes('dolc') || normalized.includes('snack') || normalized.includes('sweet')) matchedCat = 'Dolci e Snack';
          else if (normalized.includes('bev') || normalized.includes('drink')) matchedCat = 'Bevande';
          
          setCategory(matchedCat);
        }
      } else {
        showToast("L'AI non è riuscita a leggere la data. Prova con una foto più nitida.", "error");
      }
    } catch (error) {
      console.error("Errore analisi foto:", error);
      showToast("Errore durante l'analisi della foto.", "error");
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      custom_name: name,
      barcode: initialData?.barcode || null,
      expiration_date: expiry,
      purchase_date: purchaseDate,
      location: location,
      quantity: quantity,
      unit: unit,
      is_frozen: location === 'FREEZER',
      health_score: initialData?.health_score || null,
      category: category,
      image_url: scannedImageUrl || initialData?.imageUrl || null
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
          
          {/* Doppia Opzione Manuale / Foto */}
          <div>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '12px' }}>
              <button 
                type="button" 
                onClick={() => setInputMode('manual')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: inputMode === 'manual' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ✍️ Manuale
              </button>
              <button 
                type="button" 
                onClick={() => setInputMode('photo')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: inputMode === 'photo' ? 'rgba(46, 204, 113, 0.2)' : 'transparent',
                  color: inputMode === 'photo' ? '#2ECC71' : 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📸 Foto Scadenza (AI)
              </button>
            </div>
          </div>

          {inputMode === 'photo' && (
            <label 
              htmlFor="modal-photo-input-big"
              className="glass-panel"
              style={{
                padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                cursor: 'pointer', transition: 'all 0.3s',
                background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.05) 100%)',
                border: '1px solid rgba(46, 204, 113, 0.3)',
                borderRadius: '16px',
              }}
            >
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                id="modal-photo-input-big" 
                onChange={handlePhotoScanInModal}
                style={{ display: 'none' }}
                disabled={scanning}
              />
              <div style={{ background: 'rgba(46, 204, 113, 0.2)', padding: '12px', borderRadius: '50%', color: '#2ECC71' }}>
                {scanning ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
              </div>
              <span style={{ fontWeight: 600, color: '#2ECC71', fontSize: '0.9rem' }}>
                {scanning ? 'Lettura immagine in corso...' : 'Scatta Foto alla Scadenza'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                L\'AI estrarrà automaticamente la scadenza e compilerà i dati.
              </span>
            </label>
          )}

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

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              style={{ background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border)', width: '100%', height: '45px', borderRadius: '12px', padding: '0 12px' }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ background: '#1c1c1e', color: 'white' }}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Data di Acquisto e Data di Scadenza */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Data Acquisto</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="date" 
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scadenza</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="date" 
                    value={expiry}
                    onChange={(e) => {
                      setExpiry(e.target.value);
                      setIsExpiryEdited(true);
                    }}
                    className="input-field"
                    style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                
                {/* Pulsante Fotocamera per data AI */}
                <label 
                  htmlFor="modal-photo-input"
                  style={{
                    background: 'rgba(46, 204, 113, 0.15)',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    color: '#2ECC71',
                    borderRadius: '12px',
                    width: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    id="modal-photo-input" 
                    onChange={handlePhotoScanInModal}
                    style={{ display: 'none' }}
                    disabled={scanning}
                  />
                  {scanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                </label>
              </div>
            </div>
          </div>

          {/* Quantità e Unità di Misura */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantità</label>
              {unit === 'pz' ? (
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', padding: '0 10px', minWidth: '30px', textAlign: 'center' }}>{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                </div>
              ) : (
                <input 
                  type="number" 
                  step={unit === 'kg' || unit === 'l' ? '0.1' : '1'}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  placeholder="es. 1.5"
                  style={{ textAlign: 'center', fontWeight: 600, height: '48px' }}
                  required
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Unità</label>
              <select 
                value={unit}
                onChange={(e) => {
                  const newUnit = e.target.value;
                  setUnit(newUnit);
                  if (newUnit === 'pz') setQuantity(Math.round(quantity) || 1);
                  else if (newUnit === 'kg' && quantity === 1) setQuantity(0.5);
                }}
                className="input-field"
                style={{ background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border)', width: '100%', height: '48px', borderRadius: '12px', padding: '0 12px' }}
              >
                <option value="pz" style={{ background: '#1c1c1e', color: 'white' }}>Pezzi (pz)</option>
                <option value="kg" style={{ background: '#1c1c1e', color: 'white' }}>Chili (kg)</option>
                <option value="g" style={{ background: '#1c1c1e', color: 'white' }}>Grammi (g)</option>
                <option value="l" style={{ background: '#1c1c1e', color: 'white' }}>Litri (l)</option>
              </select>
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

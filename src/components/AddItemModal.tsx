import { useState, useEffect } from 'react';
import { authHeaders, limiteRaggiunto } from '../lib/api';
import { X, Calendar, Refrigerator, Box, Camera, Loader2, Weight, Search, AlertTriangle } from 'lucide-react';
import { addDays } from 'date-fns';
import { useToastStore } from '../store/toastStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

interface AddItemModalProps {
  initialData?: {
    name?: string;
    barcode?: string;
    location?: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'OTHER';
    days?: number;
    category?: string;
    health_score?: string;
    expiration_date?: string;
    quantity?: number;
    unit?: string;
    purchase_date?: string;
    imageUrl?: string;
    brand?: string;
    ingredients?: string;
    nutriscore?: string;
    nutritional_info?: any;
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

// Prodotti sfusi a peso con emoji e scadenza stimata in giorni
const PRODUCE_ITEMS = [
  { name: 'Pomodori', emoji: '🍅', days: 7 },
  { name: 'Zucchine', emoji: '🥒', days: 7 },
  { name: 'Peperoni', emoji: '🫑', days: 10 },
  { name: 'Cetrioli', emoji: '🥒', days: 7 },
  { name: 'Melanzane', emoji: '🍆', days: 7 },
  { name: 'Insalata', emoji: '🥬', days: 4 },
  { name: 'Spinaci', emoji: '🌿', days: 4 },
  { name: 'Broccoli', emoji: '🥦', days: 5 },
  { name: 'Carote', emoji: '🥕', days: 21 },
  { name: 'Patate', emoji: '🥔', days: 30 },
  { name: 'Cipolle', emoji: '🧅', days: 30 },
  { name: 'Aglio', emoji: '🧄', days: 30 },
  { name: 'Pesche', emoji: '🍑', days: 5 },
  { name: 'Anguria', emoji: '🍉', days: 7 },
  { name: 'Melone', emoji: '🍈', days: 5 },
  { name: 'Mirtilli', emoji: '🫐', days: 4 },
  { name: 'Fragole', emoji: '🍓', days: 4 },
  { name: 'Uva', emoji: '🍇', days: 7 },
  { name: 'Ciliegie', emoji: '🍒', days: 5 },
  { name: 'Arance', emoji: '🍊', days: 21 },
  { name: 'Limoni', emoji: '🍋', days: 21 },
  { name: 'Mele', emoji: '🍎', days: 21 },
  { name: 'Pere', emoji: '🍐', days: 14 },
  { name: 'Kiwi', emoji: '🥝', days: 14 },
  { name: 'Banane', emoji: '🍌', days: 5 },
];

export default function AddItemModal({ initialData, initialInputMode, onSave, onClose }: AddItemModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToastStore();
  const [inputMode, setInputMode] = useState<'manual' | 'photo' | 'produce'>(initialInputMode || 'manual');
  
  // Produce mode state
  const [produceItem, setProduceItem] = useState<{ name: string; emoji: string; days: number } | null>(null);
  const [produceWeight, setProduceWeight] = useState<string>('');
  const [produceSearch, setProduceSearch] = useState('');
  const [produceWeightScanning, setProduceWeightScanning] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Altro');
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState(initialData?.unit || 'pz');
  const [isExpiryEdited, setIsExpiryEdited] = useState(false);
  // L'AI inventa una data quando non riesce a leggerla: va detto all'utente
  const [isExpiryEstimated, setIsExpiryEstimated] = useState(false);
  
  // Se l'AI ha rilevato una data esatta, usa quella. Altrimenti calcola oggi + days.
  const defaultExp = initialData?.expiration_date 
    ? initialData.expiration_date 
    : addDays(new Date(), initialData?.days || 7).toISOString().split('T')[0];
    
  const [expiry, setExpiry] = useState(defaultExp);
  
  const [location, setLocation] = useState<'FRIDGE'|'FREEZER'|'PANTRY'|'OTHER'>(initialData?.location || 'FRIDGE');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
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
      // eslint-disable-next-line react-hooks/exhaustive-deps, react/set-state-in-effect
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
      showToast(t('add_item.compressing', 'Comprimo la foto...'), "info");
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

      showToast(t('add_item.uploading', 'Salvataggio foto in cloud...'), "info");
      try {
        const blob = dataURLtoBlob(base64String);
        // Prefisso household: la policy dello storage autorizza per cartella,
        // cosi' la foto la vede la famiglia e nessun altro.
        const session = useAuthStore.getState().session;
        const familyId = session?.user?.user_metadata?.family_id || session?.user?.id;
        const fileName = `${familyId}/${crypto.randomUUID()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });
        
        if (!uploadError && uploadData) {
          setScannedImageUrl(fileName);
        }
      } catch (uploadEx) {
        console.warn("Upload immagine fallito:", uploadEx);
      }

      showToast(t('add_item.analyzing', 'Analisi in corso...'), "info");
      
      const res = await fetch('/api/analyzeImage', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: base64String })
      });

      if (await limiteRaggiunto(res)) return;

      if (res.ok) {
        const aiData = await res.json();
        if (aiData.expiration_date) {
          setExpiry(aiData.expiration_date);
          setIsExpiryEstimated(aiData.date_source === 'stimata');
          showToast(t('add_item.ai_success', "Dati letti con successo dall'AI!"), "success");
        } else {
          showToast(t('add_item.ai_no_date', "Scadenza non trovata. Impostata scadenza stimata."), "info");
        }
        if (aiData.name) setName(aiData.name);
        if (aiData.storage_type) setLocation(aiData.storage_type);
        if (aiData.health_score && aiData.health_score !== 'Sconosciuto') {
          (window as any).__aiHealthScore = aiData.health_score;
        }
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
        if (aiData.brand) (window as any).__aiBrand = aiData.brand;
        if (aiData.ingredients) (window as any).__aiIngredients = aiData.ingredients;
        if (aiData.nutriscore) (window as any).__aiNutriscore = aiData.nutriscore;
        if (aiData.nutritional_info) (window as any).__aiNutritionalInfo = aiData.nutritional_info;
      } else {
        showToast(t('add_item.ai_error', "L'AI non è riuscita a leggere la foto. Prova con una foto più nitida."), "error");
      }
    } catch (error) {
      console.error("Errore analisi foto:", error);
      showToast("Errore durante l'analisi della foto.", "error");
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  // Handler per il salvataggio diretto dei prodotti a peso (modalità produce)
  const handleProduceSave = () => {
    if (!produceItem) { showToast('Seleziona un prodotto', 'error'); return; }
    const wkg = parseFloat(produceWeight);
    if (!wkg || wkg <= 0) { showToast('Inserisci il peso', 'error'); return; }
    const expiryDate = addDays(new Date(), produceItem.days).toISOString().split('T')[0];
    onSave({
      custom_name: `${produceItem.emoji} ${produceItem.name}`,
      barcode: null,
      expiration_date: expiryDate,
      purchase_date: new Date().toISOString().split('T')[0],
      location: 'FRIDGE',
      quantity: wkg,
      unit: 'kg',
      is_frozen: false,
      health_score: 'Sano',
      category: 'Verdure e Frutta',
      image_url: null,
      brand: null, ingredients: null, nutriscore: null, nutritional_info: null
    });
  };

  // Handler AI per lettura peso da etichetta banco
  const handleProduceWeightScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProduceWeightScanning(true);
    showToast(t('add_item.analyzing', 'Analisi peso in corso...'), 'info');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.readAsDataURL(file);
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
      });
      const res = await fetch('/api/analyzeImage', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: base64, mode: 'produce_weight' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.weight_kg) {
          setProduceWeight(String(data.weight_kg));
          if (data.produce_name && !produceItem) {
            const match = PRODUCE_ITEMS.find(p => p.name.toLowerCase().includes(data.produce_name.toLowerCase()));
            if (match) setProduceItem(match);
          }
          showToast(`Peso letto: ${data.weight_kg} kg`, 'success');
        } else {
          showToast('Peso non leggibile. Inseriscilo manualmente.', 'info');
        }
      }
    } catch { showToast('Errore lettura etichetta', 'error'); }
    finally { setProduceWeightScanning(false); e.target.value = ''; }
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
      health_score: (window as any).__aiHealthScore || initialData?.health_score || null,
      category: category,
      image_url: scannedImageUrl || initialData?.imageUrl || null,
      brand: (window as any).__aiBrand || initialData?.brand || null,
      ingredients: (window as any).__aiIngredients || initialData?.ingredients || null,
      nutriscore: (window as any).__aiNutriscore || initialData?.nutriscore || null,
      nutritional_info: (window as any).__aiNutritionalInfo || initialData?.nutritional_info || null
    });
    delete (window as any).__aiHealthScore;
    delete (window as any).__aiBrand;
    delete (window as any).__aiIngredients;
    delete (window as any).__aiNutriscore;
    delete (window as any).__aiNutritionalInfo;
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
        width: '100%', 
        maxHeight: '90dvh',
        display: 'flex',
        flexDirection: 'column',
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Header fisso (non scrolla) */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>
              {initialData?.barcode ? t('add_item.title_confirm', 'Conferma Prodotto') : t('add_item.title_add', 'Aggiungi Prodotto')}
            </h3>
            <button aria-label="Chiudi" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo scrollabile */}
        <div style={{ overflowY: 'auto', padding: '0 24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>


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
          
          {/* Toggle Modalità: Manuale / Foto AI / Prodotti a Peso */}
          <div>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '12px' }}>
              <button 
                type="button" 
                onClick={() => setInputMode('manual')}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                  background: inputMode === 'manual' ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: 'white', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ✍️ {t('add_item.mode_manual', 'Manuale')}
              </button>
              <button 
                type="button" 
                onClick={() => setInputMode('photo')}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                  background: inputMode === 'photo' ? 'rgba(46, 204, 113, 0.2)' : 'transparent',
                  color: inputMode === 'photo' ? '#2ECC71' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📸 {t('add_item.mode_photo', 'Foto AI')}
              </button>
              <button 
                type="button" 
                onClick={() => setInputMode('produce')}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                  background: inputMode === 'produce' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                  color: inputMode === 'produce' ? '#22C55E' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🥦 {t('add_item.mode_produce', 'A Peso')}
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
                {scanning ? t('add_item.scanning', 'Lettura immagine in corso...') : t('add_item.photo_prompt', 'Scatta Foto alla Scadenza')}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                {t('add_item.photo_sub', "L'AI estrarrà automaticamente la scadenza e compilerà i dati.")}
              </span>
            </label>
          )}

          {/* ===== MODALITÀ PRODUCE A PESO ===== */}
          {inputMode === 'produce' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Search bar prodotti */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', padding: '6px 14px',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <Search size={18} color="rgba(255,255,255,0.4)" />
                <input
                  type="text"
                  placeholder={t('add_item.produce_search', 'Cerca frutto o verdura...')}
                  value={produceSearch}
                  onChange={e => setProduceSearch(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', padding: '10px 0', outline: 'none' }}
                />
              </div>

              {/* Griglia prodotti */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {PRODUCE_ITEMS.filter(p =>
                  !produceSearch || p.name.toLowerCase().includes(produceSearch.toLowerCase())
                ).map(item => {
                  const isSel = produceItem?.name === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => { setProduceItem(item); setProduceSearch(''); }}
                      style={{
                        padding: '10px 4px', borderRadius: '12px',
                        border: `1.5px solid ${isSel ? '#22C55E' : 'rgba(255,255,255,0.08)'}`,
                        background: isSel ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '4px',
                        transform: isSel ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s',
                        boxShadow: isSel ? '0 4px 12px rgba(34,197,94,0.25)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                      <span style={{ color: isSel ? '#22C55E' : 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Peso selezionato */}
              {produceItem && (
                <div style={{
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '16px', padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{produceItem.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{produceItem.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Scadenza stimata: {produceItem.days} giorni</div>
                    </div>
                  </div>

                  {/* Scan etichetta peso AI */}
                  <label htmlFor="produce-weight-scan" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(34,197,94,0.15)', border: '1.5px dashed rgba(34,197,94,0.5)',
                    borderRadius: '12px', padding: '12px', cursor: 'pointer', marginBottom: '10px'
                  }}>
                    <input type="file" accept="image/*" capture="environment" id="produce-weight-scan"
                      onChange={handleProduceWeightScan} style={{ display: 'none' }} disabled={produceWeightScanning} />
                    <div style={{ background: 'rgba(34,197,94,0.2)', padding: '8px', borderRadius: '50%', color: '#22C55E' }}>
                      {produceWeightScanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    </div>
                    <div>
                      <div style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.85rem' }}>
                        {produceWeightScanning ? t('add_item.scanning', 'Lettura...') : t('add_item.produce_scan_label', 'Fotografa etichetta del banco')}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                        {t('add_item.produce_scan_sub', "L'AI leggerà il peso automaticamente")}
                      </div>
                    </div>
                  </label>

                  {/* Input peso manuale */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${produceWeight ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <Weight size={18} color={produceWeight ? '#22C55E' : 'rgba(255,255,255,0.3)'} />
                      <input
                        type="number"
                        step="0.01"
                        placeholder={t('add_item.produce_weight_placeholder', 'es. 0.550')}
                        value={produceWeight}
                        onChange={e => setProduceWeight(e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 700, outline: 'none', padding: '8px 0' }}
                      />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '1rem' }}>kg</div>
                  </div>
                </div>
              )}

              {/* Pulsante salva produce */}
              <button
                type="button"
                onClick={handleProduceSave}
                disabled={!produceItem || !produceWeight}
                style={{
                  width: '100%', padding: '16px',
                  background: (produceItem && produceWeight) ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: '16px',
                  color: (produceItem && produceWeight) ? '#000' : 'rgba(255,255,255,0.3)',
                  fontWeight: 800, fontSize: '1rem',
                  cursor: (produceItem && produceWeight) ? 'pointer' : 'not-allowed',
                  boxShadow: (produceItem && produceWeight) ? '0 8px 24px rgba(34,197,94,0.35)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                🥦 {t('add_item.produce_save', 'Aggiungi al Frigo')}
              </button>
            </div>
          )}

          {inputMode !== 'produce' && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.name', 'Nome Prodotto')}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder={t('add_item.name_placeholder', 'es. Latte Parzialmente Scremato')}
              autoFocus
              required
            />
          </div>
          )}

          {inputMode !== 'produce' && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.category', 'Categoria')}</label>
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
          )}

          {/* Data di Acquisto e Data di Scadenza — nascoste in produce mode */}
          {inputMode !== 'produce' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.purchase_date', 'Data Acquisto')}</label>
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
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.expiry', 'Scadenza')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="date" 
                    value={expiry}
                    onChange={(e) => {
                      setExpiry(e.target.value);
                      setIsExpiryEdited(true);
                      setIsExpiryEstimated(false);
                    }}
                    className="input-field"
                    style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                {isExpiryEstimated && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: '#FF9F0A', lineHeight: 1.35 }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Data <strong>stimata</strong>: sulla foto non era leggibile. Controllala prima di salvare.</span>
                  </div>
                )}
                
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
          </div>}

          {/* Alert Scadenza Barcode */}
          {inputMode !== 'produce' && initialData?.barcode && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.15) 0%, rgba(255, 170, 0, 0.05) 100%)',
              borderLeft: '4px solid #FFAA00',
              padding: '12px 16px',
              borderRadius: '0 12px 12px 0',
              marginTop: '-4px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{ color: '#FFAA00', marginTop: '2px' }}><Calendar size={20} /></div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4' }}>
                <strong style={{ color: '#FFAA00', display: 'block', marginBottom: '2px' }}>{t('add_item.verify_expiry', 'Verifica la Scadenza')}</strong>
                {t('add_item.verify_expiry_desc', 'I codici a barre non contengono la data di scadenza esatta. Controllala sulla confezione.')}
              </div>
            </div>
          )}

          {/* Quantità e Unità di Misura — nascoste in produce mode */}
          {inputMode !== 'produce' && <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.quantity', 'Quantità')}</label>
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
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.unit', 'Unità')}</label>
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
                <option value="pz" style={{ background: '#1c1c1e', color: 'white' }}>{t('add_item.unit_pz', 'Pezzi (pz)')}</option>
                <option value="kg" style={{ background: '#1c1c1e', color: 'white' }}>{t('add_item.unit_kg', 'Chili (kg)')}</option>
                <option value="g" style={{ background: '#1c1c1e', color: 'white' }}>{t('add_item.unit_g', 'Grammi (g)')}</option>
                <option value="l" style={{ background: '#1c1c1e', color: 'white' }}>{t('add_item.unit_l', 'Litri (l)')}</option>
              </select>
            </div>
          </div>}

          {inputMode !== 'produce' && <div>
            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('add_item.location', 'Dove lo conservi?')}</label>
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
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('add_item.loc_fridge', 'Frigo')}</span>
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
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('add_item.loc_freezer', 'Freezer')}</span>
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
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('add_item.loc_pantry', 'Dispensa')}</span>
              </button>
            </div>
          </div>}

          {inputMode !== 'produce' && <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            {t('add_item.save', 'Salva Prodotto')}
          </button>}
        </form>
        </div>
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

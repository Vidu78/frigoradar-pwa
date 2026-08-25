import { useState } from 'react';
import { X, Plus, Minus, Flame, Box, ShieldCheck, Heart, AlertTriangle, ScanBarcode } from 'lucide-react';
import { getExpirationStatus } from '../utils/expirationEngine';
import BarcodeScannerModal from './BarcodeScannerModal';
import { supabase } from '../lib/supabase';

interface ProductDetailModalProps {
  item: any;
  onClose: () => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onDelete: (id: string, name: string) => void;
  onRefreshItem: () => void;
}

export default function ProductDetailModal({ item, onClose, onUpdateQuantity, onDelete, onRefreshItem }: ProductDetailModalProps) {
  const [showScanner, setShowScanner] = useState(false);
  const expInfo = getExpirationStatus(item.expiration_date);

  const handleIncrement = () => {
    const step = item.unit === 'kg' || item.unit === 'l' ? 0.1 : 1;
    onUpdateQuantity(item.id, parseFloat((item.quantity + step).toFixed(2)));
  };

  const handleDecrement = () => {
    const step = item.unit === 'kg' || item.unit === 'l' ? 0.1 : 1;
    const minVal = item.unit === 'kg' || item.unit === 'l' ? 0.1 : 1;
    onUpdateQuantity(item.id, Math.max(minVal, parseFloat((item.quantity - step).toFixed(2))));
  };

  const handleBarcodeSuccess = async (barcode: string) => {
    setShowScanner(false);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      
      if (data.status === 1) {
        const product = data.product;
        
        const updates: any = {};
        if (product.brands) updates.brand = product.brands.split(',')[0];
        if (product.nutriments?.['energy-kcal_100g']) updates.nutritional_info = { calories_per_100g: product.nutriments['energy-kcal_100g'] };
        if (product.nutrition_grades) updates.nutriscore = product.nutrition_grades.toUpperCase();
        if (product.ingredients_text_it || product.ingredients_text) updates.ingredients = product.ingredients_text_it || product.ingredients_text;
        if (product.image_url && !item.image_url) updates.image_url = product.image_url;

        // Determine health score based on nutriscore
        if (updates.nutriscore) {
          if (['A', 'B'].includes(updates.nutriscore)) updates.health_score = 'Sano';
          else if (updates.nutriscore === 'C') updates.health_score = 'Moderato';
          else updates.health_score = 'Da Limitare';
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from('inventory_items').update(updates).eq('id', item.id);
          onRefreshItem(); // Chiama la ricarica dati nel genitore
        } else {
          alert('Prodotto trovato, ma nessun dato nutrizionale utile estratto.');
        }
      } else {
        alert('Prodotto non trovato nel database mondiale.');
      }
    } catch (e) {
      alert('Errore durante la ricerca del codice a barre.');
    }
  };

  const calories = item.nutritional_info?.calories_per_100g || item.nutritional_info?.calories || null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 1100,
      display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, var(--bg-panel-solid) 0%, #051A18 100%)',
        width: '100%', height: '85vh', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        padding: '0', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -15px 50px rgba(0,0,0,0.7)',
        animation: 'slideUpModal 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        
        {/* Header con Immagine Sfocata */}
        <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}>
          {item.image_url ? (
            <>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)', opacity: 0.5, transform: 'scale(1.1)' }} />
              <img src={item.image_url} alt={item.custom_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={64} opacity={0.3} color="white" />
            </div>
          )}
          
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '10px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
            <X size={24} />
          </button>

          {item.brand && (
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{item.brand.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Corpo della scheda */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Titolo e Scadenza */}
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', fontWeight: 800, color: 'white', lineHeight: '1.2' }}>{item.custom_name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: expInfo.color + '22', color: expInfo.color, padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: expInfo.color, boxShadow: `0 0 8px ${expInfo.color}` }} />
                {expInfo.text}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                {item.location}
              </div>
            </div>
          </div>

          {/* Quick Actions (Quantità) */}
          <div style={{ background: 'var(--bg-panel)', borderRadius: '24px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>Quantità nel Frigo</span>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '4px' }}>
              <button onClick={handleDecrement} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Minus size={20} />
              </button>
              <span style={{ fontSize: '1.2rem', minWidth: '60px', textAlign: 'center', fontWeight: 800, color: 'white' }}>
                {item.unit === 'kg' || item.unit === 'l' ? Number(item.quantity).toFixed(1) : item.quantity}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 600 }}>{item.unit || 'pz'}</span>
              </span>
              <button onClick={handleIncrement} style={{ background: 'var(--primary-glow)', border: 'none', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Scheda Nutrizionale */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--primary)" /> Specifiche & Salute
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Nutriscore / Health Score */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Heart size={24} color={item.health_score === 'Sano' ? '#32D74B' : (item.health_score === 'Moderato' ? '#FF9F0A' : '#FF453A')} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Impatto Salute</span>
                <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>{item.nutriscore ? `NutriScore ${item.nutriscore}` : (item.health_score || 'Sconosciuto')}</span>
              </div>

              {/* Calorie */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Flame size={24} color="#FF9F0A" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Calorie / 100g</span>
                <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>{calories ? `${calories} kcal` : 'N.D.'}</span>
              </div>
            </div>

            {/* Ingredienti */}
            {item.ingredients && (
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ingredienti / Composizione</span>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                  {item.ingredients}
                </p>
              </div>
            )}
            
            {(!item.brand && !item.ingredients && !calories) && (
              <div style={{ marginTop: '16px', background: 'rgba(255,159,10,0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,159,10,0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={20} color="#FF9F0A" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ color: '#FF9F0A', margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700 }}>Dati Nutrizionali Assenti</h4>
                    <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
                      Scansiona il codice a barre per compilare automaticamente i valori nutrizionali, il NutriScore e gli ingredienti tramite OpenFoodFacts.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowScanner(true)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#FF9F0A', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ScanBarcode size={20} />
                  Scansiona Codice a Barre
                </button>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              onClick={() => {
                onClose();
                onDelete(item.id, item.custom_name);
              }}
              style={{ width: '100%', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', color: '#FF453A', padding: '16px', borderRadius: '20px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
            >
              Elimina / Consumato
            </button>
          </div>

        </div>
      </div>

      {showScanner && (
        <BarcodeScannerModal 
          onClose={() => setShowScanner(false)}
          onSuccess={handleBarcodeSuccess}
        />
      )}

      <style>{`
        @keyframes slideUpModal {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useInventoryStore } from '../store/inventoryStore';
import { LogOut, ScanBarcode, Refrigerator, Search, Settings, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { addDays } from 'date-fns';
import BarcodeScanner from '../components/BarcodeScanner';

export default function Dashboard() {
  const { session, signOut } = useAuthStore();
  const { items, loading, fetchItems, addItem, deleteItem, updateItemQuantity } = useInventoryStore();
  
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleScan = async (decodedText: string) => {
    setShowScanner(false);
    setIsProcessingBarcode(true);
    
    try {
      // 1. Chiamata ad OpenFoodFacts API per un indizio iniziale
      let rawName = `Codice ${decodedText}`;
      let imageUrl = null;

      try {
        const resOFF = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
        const dataOFF = await resOFF.json();
        if (dataOFF.status === 1 && dataOFF.product) {
          rawName = dataOFF.product.product_name || dataOFF.product.generic_name || rawName;
          imageUrl = dataOFF.product.image_front_url || dataOFF.product.image_url;
        }
      } catch (e) {
        console.warn("OpenFoodFacts offline", e);
      }
      
      // 2. Inviamo a Gemini AI tramite il nostro Vercel Endpoint
      let finalName = rawName;
      let days = 7;
      let categoryInfo = "";

      try {
        const aiRes = await fetch('/api/analyzeProduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: decodedText, query: rawName })
        });
        
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          finalName = aiData.name || rawName;
          days = aiData.default_shelf_life_days || 7;
          categoryInfo = aiData.category ? `[${aiData.category}] ` : "";
        }
      } catch (aiError) {
        console.error("Errore Gemini API:", aiError);
        // Fallback gracefully on OpenFoodFacts data if AI fails
      }

      // 3. Calcolo scadenza dinamica e salvataggio
      const defaultExpiry = addDays(new Date(), days).toISOString().split('T')[0];
      
      const expiryInput = prompt(`Trovato: ${categoryInfo}${finalName}\\nScadenza stimata (${days} giorni). Confermi?`, defaultExpiry);
      
      if (expiryInput) {
        await addItem({
          name: finalName,
          barcode: decodedText,
          expiry_date: expiryInput,
          quantity: 1,
          image_url: imageUrl
        });
      }
      
    } catch (error) {
      console.error("Errore generale durante la scansione:", error);
      alert("Si è verificato un errore durante la scansione.");
    } finally {
      setIsProcessingBarcode(false);
    }
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Calcolo statistiche
  const expiringSoonCount = items.filter(item => {
    if (!item.expiry_date) return false;
    const daysLeft = (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 3 && daysLeft >= 0;
  }).length;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bentornato,</p>
          <h2 style={{ fontWeight: 600 }}>{session?.user?.email?.split('@')[0]}</h2>
        </div>
        <button onClick={signOut} className="btn-secondary" style={{ padding: '10px' }}>
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
        <div 
          className="glass-panel" 
          onClick={() => setShowScanner(true)}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          <div style={{ background: 'var(--primary-glow)', padding: '16px', borderRadius: '50%' }}>
            {isProcessingBarcode ? <Loader2 size={32} color="var(--primary)" className="animate-spin" /> : <ScanBarcode size={32} color="var(--primary)" />}
          </div>
          <span style={{ fontWeight: 500 }}>{isProcessingBarcode ? 'Cerco...' : 'Scansiona'}</span>
        </div>
        
        <div 
          className="glass-panel" 
          onClick={() => {
            const name = prompt("Nome del prodotto:");
            if (name) {
              addItem({ name, quantity: 1, expiry_date: addDays(new Date(), 5).toISOString().split('T')[0] });
            }
          }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          <div style={{ background: 'rgba(255, 107, 91, 0.2)', padding: '16px', borderRadius: '50%' }}>
            <Plus size={32} color="var(--accent)" />
          </div>
          <span style={{ fontWeight: 500 }}>Aggiungi Manuale</span>
        </div>
      </div>

      {/* Statistiche */}
      {expiringSoonCount > 0 && (
        <div style={{ background: 'rgba(255, 99, 71, 0.1)', border: '1px solid rgba(255, 99, 71, 0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={20} color="#FF6B5B" />
          <span style={{ color: '#FF6B5B', fontWeight: 500 }}>Hai {expiringSoonCount} prodotti in scadenza!</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="input-group">
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field" 
            placeholder="Cerca nel tuo frigo..." 
            style={{ width: '100%', paddingLeft: '42px', background: 'var(--bg-panel)' }} 
          />
        </div>
      </div>

      {/* Inventory List */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Il tuo Frigorifero</h3>
        
        {loading && items.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nessun prodotto trovato.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map(item => {
              const isExpiring = item.expiry_date && (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 3;
              
              return (
                <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: isExpiring ? '4px solid #FF6B5B' : '4px solid transparent' }}>
                  
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: 'white' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Refrigerator size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{item.name}</h4>
                    {item.expiry_date && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: isExpiring ? '#FF6B5B' : 'var(--text-muted)' }}>
                        Scade: {new Date(item.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px 8px' }}>
                      <button onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))} style={{ background: 'none', border: 'none', color: 'white', padding: '0 8px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: 'white', padding: '0 8px', cursor: 'pointer' }}>+</button>
                    </div>
                    <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#FF6B5B', cursor: 'pointer', padding: '8px' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Bottom Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-panel-solid)', borderTop: '1px solid var(--border)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
          <Refrigerator size={24} />
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Frigo</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <Search size={24} />
          <span style={{ fontSize: '0.7rem' }}>Cerca</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <Settings size={24} />
          <span style={{ fontSize: '0.7rem' }}>Profilo</span>
        </div>
      </div>

    </div>
  );
}

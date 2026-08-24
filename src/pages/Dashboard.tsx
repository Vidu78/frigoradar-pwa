import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useInventoryStore } from '../store/inventoryStore';
import { LogOut, ScanBarcode, Refrigerator, Search, Plus, Trash2, Loader2, Info, Box } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import AddItemModal from '../components/AddItemModal';
import { getExpirationStatus } from '../utils/expirationEngine';

export default function Dashboard() {
  const { session, signOut } = useAuthStore();
  const { items, loading, fetchItems, addItem, deleteItem, updateItemQuantity } = useInventoryStore();
  
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiProductData, setAiProductData] = useState<any>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'FRIDGE' | 'FREEZER' | 'PANTRY'>('FRIDGE');



  useEffect(() => {
    fetchItems();
  }, []);

  const handleScan = async (decodedText: string) => {
    setShowScanner(false);
    setIsProcessingBarcode(true);
    
    // Funzione helper per il timeout delle fetch
    const fetchWithTimeout = async (url: string, options: any = {}, timeout = 4000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    let rawName = `Codice ${decodedText}`;
    let imageUrl = null;
    let finalName = rawName;
    let days = 7;
    let category = "Altro";
    let location: 'FRIDGE' | 'FREEZER' | 'PANTRY' = 'FRIDGE';
    let healthScore = "Sconosciuto";

    try {
      // 1. Chiamata a OpenFoodFacts con timeout di 3 secondi
      try {
        const resOFF = await fetchWithTimeout(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(decodedText)}.json`, {}, 3000);
        const dataOFF = await resOFF.json();
        if (dataOFF.status === 1 && dataOFF.product) {
          rawName = dataOFF.product.product_name || dataOFF.product.generic_name || rawName;
          imageUrl = dataOFF.product.image_front_url || dataOFF.product.image_url;
          finalName = rawName;
        }
      } catch (e) {
        console.warn("OpenFoodFacts offline o lento:", e);
      }

      // 2. Chiamata a Gemini API con timeout di 4 secondi
      try {
        const aiRes = await fetchWithTimeout('/api/analyzeProduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: decodedText, query: rawName })
        }, 4000);
        
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          finalName = aiData.name || rawName;
          days = aiData.default_shelf_life_days || 7;
          category = aiData.category || "Altro";
          // Forza la location tra quelle disponibili nel menù
          location = (aiData.storage_type === 'FREEZER' || aiData.storage_type === 'PANTRY') 
            ? aiData.storage_type 
            : 'FRIDGE';
          healthScore = aiData.health_score || "Sconosciuto";
        }
      } catch (aiError) {
        console.error("Errore Gemini API o timeout:", aiError);
      }

    } catch (error) {
      console.error("Errore generale durante la scansione:", error);
    } finally {
      // Garantiamo l'apertura della modale in ogni caso, anche se le API falliscono
      setAiProductData({
        name: finalName,
        barcode: decodedText,
        days: days,
        category: category,
        location: location,
        imageUrl: imageUrl,
        health_score: healthScore
      });
      setIsProcessingBarcode(false);
      setShowAddModal(true);
    }
  };

  const handleSaveItem = async (data: any) => {
    setShowAddModal(false);
    try {
      await addItem({
        custom_name: data.custom_name,
        expiration_date: data.expiration_date,
        quantity: data.quantity,
        location: data.location,
        is_frozen: data.is_frozen,
        health_score: data.health_score,
        image_url: aiProductData?.imageUrl || null
      });
    } catch (dbError) {
      console.warn("Salvataggio con image_url fallito. Riprovo senza immagine...", dbError);
      try {
        await addItem({
          custom_name: data.custom_name,
          expiration_date: data.expiration_date,
          quantity: data.quantity,
          location: data.location,
          is_frozen: data.is_frozen,
          health_score: data.health_score
        });
      } catch (retryError: any) {
        console.error("Salvataggio fallito:", retryError);
        alert(`Errore salvataggio Supabase: ${retryError.message || JSON.stringify(retryError)}`);
      }
    }
    setAiProductData(null);
  };

  // Filtraggio globale (Search) e per Tab (Location)
  const filteredItems = items.filter(item => {
    const matchSearch = (item.custom_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = item.location === activeTab;
    return matchSearch && matchTab;
  });

  // Calcolo Statistiche su tutti gli items
  const urgentCount = items.filter(item => {
    const status = getExpirationStatus(item.expiration_date);
    return status.status === 'URGENT' || status.status === 'EXPIRED';
  }).length;
  
  const counts = {
    FRIDGE: items.filter(i => i.location === 'FRIDGE').length,
    FREEZER: items.filter(i => i.location === 'FREEZER').length,
    PANTRY: items.filter(i => i.location === 'PANTRY').length,
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Bentornato,</p>
          <h2 style={{ fontWeight: 600, margin: 0 }}>
            {session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0]}
          </h2>
        </div>
        <button onClick={signOut} className="btn-secondary" style={{ padding: '10px' }}>
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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
            setAiProductData(null);
            setShowAddModal(true);
          }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          <div style={{ background: 'rgba(255, 107, 91, 0.2)', padding: '16px', borderRadius: '50%' }}>
            <Plus size={32} color="var(--accent)" />
          </div>
          <span style={{ fontWeight: 500 }}>Manuale</span>
        </div>
      </div>

      {/* Statistiche Urgenti */}
      {urgentCount > 0 && (
        <div style={{ background: 'rgba(255, 69, 58, 0.15)', border: '1px solid rgba(255, 69, 58, 0.4)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={24} color="#FF453A" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ color: '#FF453A', fontWeight: 600, fontSize: '0.95rem' }}>Attenzione Scadenze</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '2px' }}>Hai {urgentCount} {urgentCount === 1 ? 'prodotto' : 'prodotti'} in scadenza o scaduti.</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="input-group" style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field" 
            placeholder="Cerca nel tuo inventario..." 
            style={{ width: '100%', paddingLeft: '42px', background: 'var(--bg-panel)' }} 
          />
        </div>
      </div>

      {/* TABS Frigo / Freezer / Dispensa */}
      <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('FRIDGE')}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none',
            background: activeTab === 'FRIDGE' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'FRIDGE' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'FRIDGE' ? 600 : 400,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Refrigerator size={16} />
          <span style={{ fontSize: '0.9rem' }}>Frigo</span>
          <span style={{ background: activeTab === 'FRIDGE' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: activeTab === 'FRIDGE' ? 'black' : 'inherit', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
            {counts.FRIDGE}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('FREEZER')}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none',
            background: activeTab === 'FREEZER' ? 'rgba(100, 200, 255, 0.15)' : 'transparent',
            color: activeTab === 'FREEZER' ? '#64C8FF' : 'var(--text-muted)',
            fontWeight: activeTab === 'FREEZER' ? 600 : 400,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Box size={16} />
          <span style={{ fontSize: '0.9rem' }}>Freezer</span>
          <span style={{ background: activeTab === 'FREEZER' ? '#64C8FF' : 'rgba(255,255,255,0.1)', color: activeTab === 'FREEZER' ? 'black' : 'inherit', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
            {counts.FREEZER}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('PANTRY')}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none',
            background: activeTab === 'PANTRY' ? 'rgba(255, 170, 0, 0.15)' : 'transparent',
            color: activeTab === 'PANTRY' ? '#FFAA00' : 'var(--text-muted)',
            fontWeight: activeTab === 'PANTRY' ? 600 : 400,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Box size={16} />
          <span style={{ fontSize: '0.9rem' }}>Dispensa</span>
          <span style={{ background: activeTab === 'PANTRY' ? '#FFAA00' : 'rgba(255,255,255,0.1)', color: activeTab === 'PANTRY' ? 'black' : 'inherit', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
            {counts.PANTRY}
          </span>
        </button>
      </div>

      {/* Inventory List */}
      <div>
        {loading && items.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nessun prodotto in {activeTab === 'FRIDGE' ? 'Frigo' : activeTab === 'FREEZER' ? 'Freezer' : 'Dispensa'}.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map(item => {
              const expInfo = getExpirationStatus(item.expiration_date);
              
              // Animazione lampeggiante per i prodotti SCADUTI
              const isExpired = expInfo.status === 'EXPIRED';
              
              return (
                <div key={item.id} className="glass-panel" style={{ 
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
                  borderLeft: `4px solid ${expInfo.color}`,
                  background: isExpired ? 'rgba(255, 59, 48, 0.05)' : 'var(--bg-panel)',
                  animation: isExpired ? 'pulseRed 2s infinite' : 'none'
                }}>
                  
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.custom_name || ''} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover', background: 'white' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.location === 'FREEZER' ? <Box size={24} color="#64C8FF" opacity={0.6} /> : 
                       item.location === 'PANTRY' ? <Box size={24} color="#FFAA00" opacity={0.6} /> :
                       <Refrigerator size={24} color="var(--primary)" opacity={0.6} />}
                    </div>
                  )}
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.custom_name}
                    </h4>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: expInfo.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: expInfo.color }}></span>
                      {expInfo.text}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px 8px' }}>
                      <button onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))} style={{ background: 'none', border: 'none', color: 'white', padding: '0 8px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: 'white', padding: '0 8px', cursor: 'pointer' }}>+</button>
                    </div>
                    <button onClick={() => deleteItem(item.id)} style={{ background: 'rgba(255, 69, 58, 0.1)', border: 'none', color: '#FF453A', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                      <Trash2 size={18} />
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

      {showAddModal && (
        <AddItemModal 
          initialData={aiProductData}
          onSave={handleSaveItem}
          onClose={() => {
            setShowAddModal(false);
            setAiProductData(null);
          }}
        />
      )}

      <style>{`
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useShoppingStore } from '../store/shoppingStore';
import { LogOut, ScanBarcode, Refrigerator, Search, Plus, Minus, Loader2, Info, Box, Camera, Receipt, ChefHat } from 'lucide-react';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import AddItemModal from '../components/AddItemModal';
import ProductDetailModal from '../components/ProductDetailModal';
import WelcomeTutorialModal from '../components/WelcomeTutorialModal';
import { getExpirationStatus } from '../utils/expirationEngine';
import { useToastStore } from '../store/toastStore';
import { useTranslation } from 'react-i18next';

const categoryEmojis: Record<string, string> = {
  'Carni e Salumi': '🥩',
  'Verdure e Frutta': '🥦',
  'Latticini e Ovuova': '🥛',
  'Pesce e Frutti di Mare': '🐟',
  'Pane e Pasta': '🍞',
  'Conserve e Sughi': '🥫',
  'Dolci e Snack': '🍪',
  'Bevande': '🥤',
  'Altro': '📦'
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { session, signOut, updateStats } = useAuthStore();
  const { items, loading, fetchItems, addItem, deleteItem, updateItemQuantity } = useInventoryStore();
  const { addItem: addShoppingItem } = useShoppingStore();
  const { showToast } = useToastStore();
  
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiProductData, setAiProductData] = useState<any>(null);
  const [initialInputMode, setInitialInputMode] = useState<'manual' | 'photo'>('manual');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'FRIDGE' | 'FREEZER' | 'PANTRY'>('FRIDGE');

  useEffect(() => {
    if (session) {
      fetchItems();
      const hasSeenTutorial = localStorage.getItem('frigoradar_tutorial_seen');
      if (!hasSeenTutorial) {
        setShowWelcomeTutorial(true);
      }
    }
  }, [session]);

  const handleTutorialComplete = () => {
    localStorage.setItem('frigoradar_tutorial_seen', 'true');
    setShowWelcomeTutorial(false);
  };

  const handleDeleteWithStats = async (id: string, name: string) => {
    const isConsumed = window.confirm(`Hai CONSUMATO questo prodotto ("${name}")?\n\n- Premi OK se l'hai mangiato/usato (Risparmio! 💰)\n- Premi Annulla se l'hai dovuto buttare (Spreco ⚠️)`);
    
    if (isConsumed) {
      updateStats('SAVED', 2.5);
      const addToShopping = window.confirm(`Bravo! Vuoi aggiungere "${name}" alla tua Lista della Spesa per non dimenticare di ricomprarlo? 🛒`);
      if (addToShopping) {
        await addShoppingItem(name, 1);
        showToast("Prodotto aggiunto alla lista della spesa!");
      }
    } else {
      updateStats('WASTED', 2.5);
    }
    
    await deleteItem(id);
  };

  const handleScan = async (decodedText: string) => {
    setShowScanner(false);
    setIsProcessingBarcode(true);
    
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
    let brand = null;
    let ingredients = null;
    let nutriscore = null;
    let nutritional_info = null;

    try {
      try {
        const resOFF = await fetchWithTimeout(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(decodedText)}.json`, {}, 3000);
        const dataOFF = await resOFF.json();
        if (dataOFF.status === 1 && dataOFF.product) {
          rawName = dataOFF.product.product_name || dataOFF.product.generic_name || rawName;
          imageUrl = dataOFF.product.image_front_url || dataOFF.product.image_url;
          brand = dataOFF.product.brands || null;
          ingredients = dataOFF.product.ingredients_text || null;
          nutriscore = dataOFF.product.nutriscore_grade?.toUpperCase() || null;
          if (dataOFF.product.nutriments) {
            nutritional_info = {
              calories_per_100g: dataOFF.product.nutriments['energy-kcal_100g'] || dataOFF.product.nutriments['energy-kcal_value'] || null
            };
          }
          finalName = rawName;
        }
      } catch (e) {
        console.warn("OpenFoodFacts offline o lento:", e);
      }

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
          location = (aiData.storage_type === 'FREEZER' || aiData.storage_type === 'PANTRY') 
            ? aiData.storage_type 
            : 'FRIDGE';
          healthScore = aiData.health_score || "Sconosciuto";
          
          if (!brand && aiData.brand) brand = aiData.brand;
          if (!ingredients && aiData.ingredients) ingredients = aiData.ingredients;
          if (!nutriscore && aiData.nutriscore) nutriscore = aiData.nutriscore;
          if (!nutritional_info && aiData.nutritional_info) nutritional_info = aiData.nutritional_info;
        }
      } catch (aiError) {
        console.error("Errore Gemini API o timeout:", aiError);
      }

    } catch (error) {
      console.error("Errore generale durante la scansione:", error);
    } finally {
      setAiProductData({
        name: finalName,
        barcode: decodedText,
        days: days,
        category: category,
        location: location,
        imageUrl: imageUrl,
        health_score: healthScore,
        brand: brand,
        ingredients: ingredients,
        nutriscore: nutriscore,
        nutritional_info: nutritional_info
      });
      setIsProcessingBarcode(false);
      setInitialInputMode('manual');
      setShowAddModal(true);
    }
  };

  const handleSaveItem = async (data: any) => {
    setShowAddModal(false);
    try {
      await addItem({
        custom_name: data.custom_name,
        expiration_date: data.expiration_date,
        purchase_date: data.purchase_date,
        quantity: data.quantity,
        unit: data.unit,
        location: data.location,
        is_frozen: data.is_frozen,
        health_score: data.health_score,
        category: data.category,
        image_url: data.image_url || aiProductData?.imageUrl || null,
        brand: aiProductData?.brand || null,
        ingredients: aiProductData?.ingredients || null,
        nutriscore: aiProductData?.nutriscore || null,
        nutritional_info: aiProductData?.nutritional_info || null
      });
    } catch (dbError) {
      console.warn("Salvataggio con immagine fallito. Riprovo senza immagine...", dbError);
      try {
        await addItem({
          custom_name: data.custom_name,
          expiration_date: data.expiration_date,
          purchase_date: data.purchase_date,
          quantity: data.quantity,
          unit: data.unit,
          location: data.location,
          is_frozen: data.is_frozen,
          health_score: data.health_score,
          category: data.category,
          brand: aiProductData?.brand || null,
          ingredients: aiProductData?.ingredients || null,
          nutriscore: aiProductData?.nutriscore || null,
          nutritional_info: aiProductData?.nutritional_info || null
        });
      } catch (retryError: any) {
        console.error("Salvataggio fallito:", retryError);
        showToast(`Errore salvataggio Supabase: ${retryError.message || JSON.stringify(retryError)}`, 'error');
      }
    }
    setAiProductData(null);
  };

  const filteredItems = items.filter(item => {
    const matchSearch = (item.custom_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = item.location === activeTab;
    return matchSearch && matchTab;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a.expiration_date) return 1;
    if (!b.expiration_date) return -1;
    return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
  });

  const groupedItems = sortedItems.reduce((acc, item) => {
    const cat = item.category || 'Altro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>{t('dashboard.title')}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            {session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0]}
          </p>
        </div>
        <button onClick={signOut} className="btn-secondary" style={{ padding: '10px' }}>
          <LogOut size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div 
          className="glass-panel" 
          onClick={() => setShowScanner(true)}
          style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          <div style={{ background: 'var(--primary-glow)', padding: '14px', borderRadius: '50%' }}>
            {isProcessingBarcode ? <Loader2 size={28} color="var(--primary)" className="animate-spin" /> : <ScanBarcode size={28} color="var(--primary)" />}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{isProcessingBarcode ? 'Cerco...' : 'Barcode'}</span>
        </div>
        
        <div 
          className="glass-panel" 
          onClick={() => {
            setAiProductData(null);
            setInitialInputMode('photo');
            setShowAddModal(true);
          }}
          style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid rgba(46, 204, 113, 0.3)', background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(39, 174, 96, 0.02) 100%)' }}
        >
          <div style={{ background: 'rgba(46, 204, 113, 0.2)', padding: '14px', borderRadius: '50%' }}>
            <Camera size={28} color="#2ECC71" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2ECC71' }}>Foto AI</span>
        </div>
        
        <div 
          className="glass-panel" 
          onClick={() => {
            const event = new CustomEvent('changeTab', { detail: 'recipes' });
            document.dispatchEvent(event);
          }}
          style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid rgba(255, 170, 0, 0.3)', background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.1) 0%, rgba(255, 170, 0, 0.02) 100%)' }}
        >
          <div style={{ background: 'rgba(255, 170, 0, 0.2)', padding: '14px', borderRadius: '50%' }}>
            <ChefHat size={28} color="#FFAA00" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFAA00' }}>Ricette AI</span>
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
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={t('dashboard.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 16px 16px 48px', color: 'white', outline: 'none' }}
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
          <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(0,255,170,0.1)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 0 30px rgba(0,255,170,0.2)' }}>
              <Receipt size={40} color="#00FFAA" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 12px 0', color: 'white' }}>Il Frigo è vuoto</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 32px 0', lineHeight: '1.5', maxWidth: '300px' }}>
              Inizia da qui: <strong style={{color: 'white'}}>Fotografa uno scontrino.</strong> L'Intelligenza Artificiale smisterà i prodotti, calcolerà le scadenze e li riporrà al posto giusto.
            </p>
            <button 
              onClick={() => {
                setInitialInputMode('photo');
                setShowAddModal(true);
              }}
              style={{
                background: 'var(--primary)', color: 'black',
                border: 'none', padding: '16px 24px', borderRadius: '20px',
                fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: '0 8px 24px rgba(0,255,170,0.3)',
                transition: 'transform 0.2s'
              }}
            >
              <Camera size={24} />
              Scansiona Scontrino
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.keys(groupedItems).map(catName => {
              const catItems = groupedItems[catName];
              const emoji = categoryEmojis[catName] || '📦';
              
              return (
                <div key={catName} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Category Section Header */}
                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{emoji}</span> {catName}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.1)', 
                      padding: '2px 8px', borderRadius: '20px', color: 'white'
                    }}>
                      {catItems.length}
                    </span>
                  </div>

                  {/* Category Items Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {catItems.map(item => {
                      const expInfo = getExpirationStatus(item.expiration_date);
                      const isExpired = expInfo.status === 'EXPIRED';
                      
                      return (
                        <div key={item.id} className="glass-panel" onClick={() => setSelectedProduct(item)} style={{ 
                          padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', 
                          borderTop: `3px solid ${expInfo.color}`,
                          background: isExpired ? 'rgba(255, 59, 48, 0.05)' : 'var(--bg-panel)',
                          animation: isExpired ? 'pulseRed 2s infinite' : 'none',
                          cursor: 'pointer', position: 'relative'
                        }}>
                          
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.custom_name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.location === 'FREEZER' ? <Box size={32} color="#64C8FF" opacity={0.6} /> : 
                                 item.location === 'PANTRY' ? <Box size={32} color="#FFAA00" opacity={0.6} /> :
                                 <Refrigerator size={32} color="var(--primary)" opacity={0.6} />}
                              </div>
                            )}
                            
                            {/* Badge Quantità */}
                            <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '0.8rem', fontWeight: 800 }}>
                              {item.unit === 'kg' || item.unit === 'l' ? Number(item.quantity).toFixed(1) : item.quantity}
                              <span style={{ fontSize: '0.6rem', marginLeft: '2px', fontWeight: 600 }}>{item.unit || 'pz'}</span>
                            </div>
                          </div>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                              {item.custom_name}
                            </h4>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: expInfo.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: expInfo.color }}></span>
                              {expInfo.text}
                            </p>
                          </div>
                          
                          {/* Pulsanti +/- rapidi integrati nella card */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '2px' }} onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                const step = item.unit === 'kg' || item.unit === 'l' ? 0.1 : 1;
                                const minVal = item.unit === 'kg' || item.unit === 'l' ? 0.1 : 1;
                                updateItemQuantity(item.id, Math.max(minVal, parseFloat((item.quantity - step).toFixed(2))));
                              }} 
                              style={{ flex: 1, background: 'none', border: 'none', color: 'white', padding: '8px 0', cursor: 'pointer', borderRadius: '10px' }}
                            >
                              <Minus size={16} style={{ margin: '0 auto' }} />
                            </button>
                            <button 
                              onClick={() => {
                                const step = item.unit === 'kg' || item.unit === 'l' ? 0.1 : 1;
                                updateItemQuantity(item.id, parseFloat((item.quantity + step).toFixed(2)));
                              }} 
                              style={{ flex: 1, background: 'none', border: 'none', color: 'white', padding: '8px 0', cursor: 'pointer', borderRadius: '10px' }}
                            >
                              <Plus size={16} style={{ margin: '0 auto' }} />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScannerModal 
          onSuccess={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showAddModal && (
        <AddItemModal 
          initialData={aiProductData}
          initialInputMode={initialInputMode}
          onSave={handleSaveItem}
          onClose={() => {
            setShowAddModal(false);
            setAiProductData(null);
          }}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onUpdateQuantity={(id, qty) => {
            updateItemQuantity(id, qty);
            setSelectedProduct({ ...selectedProduct, quantity: qty });
          }}
          onDelete={(id, name) => {
            handleDeleteWithStats(id, name);
          }}
          onRefreshItem={fetchItems}
        />
      )}

      {showWelcomeTutorial && (
        <WelcomeTutorialModal onComplete={handleTutorialComplete} />
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

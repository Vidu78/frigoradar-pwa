import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AiRecipes from './pages/AiRecipes';
import ShoppingList from './pages/ShoppingList';
import Profile from './pages/Profile';
import ProUpgradePage from './pages/ProUpgradePage';
import Onboarding from './pages/Onboarding';
import FamilySharing from './pages/FamilySharing';
import LoyaltyWallet from './pages/LoyaltyWallet';
import BottomNavigation, { type TabType } from './components/BottomNavigation';
import WelcomeTutorialModal from './components/WelcomeTutorialModal';
import PendingRecipeBanner from './components/PendingRecipeBanner';
import Toast from './components/Toast';
import { Download, X, Receipt, Camera, Plus as PlusIcon } from 'lucide-react';
import AddItemModal from './components/AddItemModal';
import ReceiptScannerModal from './components/ReceiptScannerModal';
import { useInventoryStore } from './store/inventoryStore';

const AppContainer = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fridge');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'photo'>('manual');
  const { addItem } = useInventoryStore();
  
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<TabType>;
      setActiveTab(customEvent.detail);
    };
    const handleOpenReceipt = () => setShowReceiptScanner(true);
    
    document.addEventListener('changeTab', handleTabChange);
    document.addEventListener('openReceiptScanner', handleOpenReceipt);
    return () => {
      document.removeEventListener('changeTab', handleTabChange);
      document.removeEventListener('openReceiptScanner', handleOpenReceipt);
    };
  }, []);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Toast />
      
      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #27AE60 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, position: 'relative', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'black' }} onClick={handleInstallApp}>
            <Download size={20} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Installa FrigoRadar</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Per un'esperienza più veloce</span>
            </div>
          </div>
          <button onClick={() => setDeferredPrompt(null)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', color: 'black', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ flexShrink: 0 }}>
        <PendingRecipeBanner />
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
        {activeTab === 'fridge' && <Dashboard />}
        {activeTab === 'shopping' && <ShoppingList />}
        {activeTab === 'recipes' && <AiRecipes />}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'family' && <FamilySharing />}
        {activeTab === 'loyalty' && <LoyaltyWallet />}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onAddClick={() => setShowActionSheet(true)} />

      {/* ACTION SHEET */}
      {showActionSheet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'flex-end'
        }} onClick={() => setShowActionSheet(false)}>
          <div style={{
            background: 'var(--bg-panel-solid)', width: '100%',
            padding: '24px 16px calc(24px + env(safe-area-inset-bottom)) 16px',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            animation: 'slideUp 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '12px'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', fontSize: '1.1rem' }}>Scegli modalità di inserimento</h3>
            
            <button onClick={() => { setShowActionSheet(false); setShowReceiptScanner(true); }} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--primary)', color: 'white',
              padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer'
            }}>
              <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '50%', color: 'black' }}><Receipt size={24} /></div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Scontrino Spesa</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analisi automatica e rapida</div>
              </div>
            </button>
            
            <button onClick={() => { setShowActionSheet(false); setAddMode('photo'); setShowAddModal(true); }} style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white',
              padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer'
            }}>
              <div style={{ background: 'rgba(46, 204, 113, 0.2)', padding: '10px', borderRadius: '50%', color: '#2ECC71' }}><Camera size={24} /></div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Foto Prodotto</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Usa AI per un prodotto singolo</div>
              </div>
            </button>

            <button onClick={() => { setShowActionSheet(false); setAddMode('manual'); setShowAddModal(true); }} style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white',
              padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer'
            }}>
              <div style={{ background: 'rgba(255, 107, 91, 0.2)', padding: '10px', borderRadius: '50%', color: 'var(--accent)' }}><PlusIcon size={24} /></div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Manuale</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inserimento classico</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {showReceiptScanner && (
        <ReceiptScannerModal 
          onClose={() => setShowReceiptScanner(false)} 
          onSaveItem={async (data) => {
            await addItem(data);
          }}
        />
      )}

      {showAddModal && (
        <AddItemModal 
          initialData={null}
          initialInputMode={addMode}
          onSave={async (data) => {
            await addItem(data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, hasCompletedOnboarding } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#00FFAA" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  // Se l'utente è loggato ma non ha finito l'onboarding e NON è già nella pagina onboarding
  if (session && !hasCompletedOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    const CURRENT_APP_VERSION = '3.3'; // Cambiare questo per forzare pulizia cache sui device
    const storedVersion = localStorage.getItem('appVersion');
    
    if (storedVersion !== CURRENT_APP_VERSION) {
      console.log(`Aggiornamento app rilevato alla versione ${CURRENT_APP_VERSION}. Pulizia cache in corso...`);
      localStorage.setItem('appVersion', CURRENT_APP_VERSION);
      
      if (window.caches) {
        window.caches.keys().then((names) => {
          for (const name of names) {
            window.caches.delete(name);
          }
        }).then(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    } else {
      initialize();
    }
  }, [initialize]);

  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);

  useEffect(() => {
    const handleOpenTutorial = () => setShowWelcomeTutorial(true);
    document.addEventListener('openTutorial', handleOpenTutorial);
    
    // Mostra il tutorial al primo avvio per utenti loggati
    const { session } = useAuthStore.getState();
    if (session) {
      const hasSeenTutorial = localStorage.getItem('frigoradar_tutorial_seen');
      if (!hasSeenTutorial) {
        setShowWelcomeTutorial(true);
      }
    }
    
    return () => {
      document.removeEventListener('openTutorial', handleOpenTutorial);
    };
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem('frigoradar_tutorial_seen', 'true');
    setShowWelcomeTutorial(false);
  };

  return (
    <Router>
      {showWelcomeTutorial && <WelcomeTutorialModal onComplete={handleTutorialComplete} />}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppContainer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pro" 
          element={
            <ProtectedRoute>
              <ProUpgradePage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

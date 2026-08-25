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
import BottomNavigation, { type TabType } from './components/BottomNavigation';
import PendingRecipeBanner from './components/PendingRecipeBanner';
import Toast from './components/Toast';
import { Download, X } from 'lucide-react';

const AppContainer = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fridge');
  
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<TabType>;
      setActiveTab(customEvent.detail);
    };
    document.addEventListener('changeTab', handleTabChange);
    return () => document.removeEventListener('changeTab', handleTabChange);
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
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
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
    const CURRENT_APP_VERSION = '2.3'; // Cambiare questo per forzare pulizia cache sui device
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
  }, []);

  return (
    <Router>
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

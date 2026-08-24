import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ShoppingList from './pages/ShoppingList';
import AiRecipes from './pages/AiRecipes';
import Profile from './pages/Profile';
import ProUpgradePage from './pages/ProUpgradePage';
import BottomNavigation, { type TabType } from './components/BottomNavigation';
import PendingRecipeBanner from './components/PendingRecipeBanner';
import Toast from './components/Toast';
import { Download, X } from 'lucide-react';

const AppContainer = () => {
  const [activeTab, setActiveTab] = useState<TabType>('INVENTORY');
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
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <Toast />
      
      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #27AE60 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, position: 'relative' }}>
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

      <PendingRecipeBanner />
      <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 'INVENTORY' && <Dashboard />}
        {activeTab === 'SHOPPING' && <ShoppingList />}
        {activeTab === 'RECIPES' && <AiRecipes />}
        {activeTab === 'PROFILE' && <Profile />}
      </div>
      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#2ECC71" size={40} /></div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
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

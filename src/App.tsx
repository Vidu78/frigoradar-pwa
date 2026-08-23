import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ShoppingList from './pages/ShoppingList';
import AiRecipes from './pages/AiRecipes';
import Profile from './pages/Profile';
import BottomNavigation, { type TabType } from './components/BottomNavigation';
import PendingRecipeBanner from './components/PendingRecipeBanner';

// Contenitore Principale (SPA Fluida)
const AppContainer = () => {
  const [activeTab, setActiveTab] = useState<TabType>('INVENTORY');

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

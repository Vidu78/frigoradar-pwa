import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Mail, Refrigerator, Loader2, Lock, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const { session, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Controlla la tua email per confermare l'account!");
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Errore con l'impronta digitale. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at center, rgba(0, 255, 170, 0.15) 0%, var(--bg-main) 100%)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementi decorativi di sfondo */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(0, 255, 170, 0.2)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255, 215, 0, 0.1)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', height: '80px', background: 'var(--bg-panel)', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px auto', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,255,170,0.15)'
          }}>
            <Refrigerator size={40} color="#00FFAA" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-1px' }}>
            Frigo<span style={{ color: '#00FFAA' }}>Radar</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>
            Zero sprechi. Più risparmio.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px' }}>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 24px 0', textAlign: 'center' }}>
            {isLogin ? 'Bentornato!' : 'Crea Account'}
          </h2>

          {error && (
            <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 16px 16px 48px', color: 'white', outline: 'none' }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 16px 16px 48px', color: 'white', outline: 'none' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{ background: '#00FFAA', color: '#0F1012', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OPPURE</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button 
            onClick={signInWithGoogle}
            disabled={loading}
            style={{ 
              width: '100%', background: 'white', color: '#333', border: 'none', padding: '14px', borderRadius: '16px', 
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
              marginBottom: '12px'
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continua con Google
          </button>

          <button 
            onClick={handlePasskey}
            disabled={loading}
            style={{ 
              width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', padding: '14px', borderRadius: '16px', 
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}>
            <Fingerprint size={20} color="#FFD700" />
            Accedi con Impronta
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            {isLogin ? "Non hai un account? " : "Hai già un account? "}
            <span style={{ color: '#00FFAA', fontWeight: 600 }}>
              {isLogin ? "Registrati" : "Accedi"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Mail, Refrigerator, Loader2, Lock, Fingerprint, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useDialogStore } from '../store/dialogStore';

export default function AuthPage() {
  const { session, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  const { showDialog } = useDialogStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LED States for the fridge design
  const [ledColor, setLedColor] = useState('#00FFAA');
  const [ledIntensity, setLedIntensity] = useState(100);

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
        showDialog({
          title: 'Email Inviata',
          message: "Controlla la tua email per confermare l'account!",
          type: 'info',
          isAlert: true,
          confirmText: 'Ok'
        });
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
    <div 
      className="auth-container animate-fade-up" 
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        minHeight: '100dvh', padding: '16px', gap: '20px',
        // Variabili CSS passate dinamicamente al container padre per alimentare gli effetti LED
        '--led-color': ledColor,
        '--led-color-transparent': `${ledColor}40`,
        '--led-color-subtle': `${ledColor}20`,
        '--led-intensity-val': ledIntensity / 100,
        '--led-glow': `${ledIntensity * 1.5}px`
      } as React.CSSProperties}
    >
      
      {/* Il corpo metallico del frigorifero con l'alone luminoso a LED */}
      <div className="fridge-panel" style={{ width: '100%', maxWidth: '460px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        
        {/* Faretto a terra (Underglow) */}
        <div className="fridge-underglow"></div>

        {/* Striscia LED interna lungo il bordo destro */}
        <div className="fridge-led-strip"></div>

        {/* Maniglia metallica 3D */}
        <div className="fridge-handle"></div>

        {/* Pannello Digitale FrigoRadar integrato nell'acciaio */}
        <div style={{ width: '100%', background: '#081414', border: '3px solid #000', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 5px 15px rgba(0,0,0,0.6), inset 0px 1px 1px rgba(255,255,255,0.05)' }}>
          
          {/* Logo FrigoRadar Premium LED */}
          <div style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: '1.8rem', color: ledColor, textShadow: `0 0 12px ${ledColor}, 0 0 24px ${ledColor}`, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Refrigerator size={28} />
            FrigoRadar
          </div>

        </div>

        {/* Lo Smart Display integrato nella porta */}
        <div className="smart-screen" style={{ padding: '20px 20px' }}>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem' }}>
            {isLogin ? 'Bentornato! Accedi per continuare.' : 'Crea il tuo account gratuito.'}
          </p>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'rgba(255, 99, 71, 0.1)', color: '#FF6B5B', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="es. mario@email.com" style={{ width: '100%', paddingLeft: '42px' }} />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '8px' }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="input-field" 
                  placeholder="••••••••" 
                  style={{ width: '100%', paddingLeft: '42px', paddingRight: '42px' }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>OPPURE</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button 
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                await signInWithGoogle();
              } catch (err: any) {
                setError(err.message || "Errore con l'accesso Google");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{ 
              width: '100%', background: 'white', color: '#333', border: 'none', padding: '12px', borderRadius: '12px', 
              fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
              marginBottom: '12px'
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continua con Google
          </button>

          {isLogin && (
            <button type="button" onClick={handlePasskey} className="btn-secondary" disabled={loading} style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              <Fingerprint size={24} style={{ color: ledColor, filter: `drop-shadow(0 0 6px ${ledColor}60)` }} />
              <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Accedi con Impronta</span>
            </button>
          )}

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'} <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
            </button>
            
            {/* LED Controls */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '8px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Illuminazione LED</span>
              <input type="color" value={ledColor} onChange={(e) => setLedColor(e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', cursor: 'pointer' }} title="Colore MoodUP" />
              <input type="range" min="0" max="100" value={ledIntensity} onChange={(e) => setLedIntensity(Number(e.target.value))} style={{ width: '80px', accentColor: ledColor, height: '4px' }} title="Intensità LED" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

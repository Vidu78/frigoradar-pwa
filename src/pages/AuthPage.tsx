import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScanFace, Mail, Lock, User, Loader2, ArrowRight, Download } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [ledColor, setLedColor] = useState('#2ECC71');
  const [ledIntensity, setLedIntensity] = useState(40);

  // Gestione installazione PWA
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            data: { display_name: name || 'Frigorifero Famiglia' },
            emailRedirectTo: window.location.origin 
          }
        });
        if (error) throw error;
        
        // Se Supabase non richiede la conferma email, restituisce subito la sessione
        if (data.session) {
          setMessage({ text: 'Registrazione completata! Accesso in corso...', type: 'success' });
        } else {
          setMessage({ text: 'Controlla la tua email per confermare la registrazione!', type: 'success' });
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Errore durante l\'autenticazione', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
    } catch (err: any) {
      setMessage({ text: err.message || 'Face-ID/Impronta non riconosciuta o non registrata. Accedi con email e password, poi abbina la passkey dalle impostazioni.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setMessage({ text: 'Inserisci prima la tua email per fare il reset.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({ text: 'Ti abbiamo inviato un link per il reset della password.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Errore nel reset password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="auth-container animate-fade-up" 
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        minHeight: '100vh', padding: '20px', gap: '30px',
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

        {/* Pannello Digitale Termostato & Controlli LED integrato nell'acciaio */}
        <div style={{ width: '100%', background: '#081414', border: '3px solid #000', borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 5px 15px rgba(0,0,0,0.6), inset 0px 1px 1px rgba(255,255,255,0.05)' }}>
          
          {/* Temperature Display (Stile Digitale / Neon) */}
          <div style={{ display: 'flex', gap: '12px', fontFamily: '"Courier New", Courier, monospace', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem', textShadow: '0 0 10px var(--primary-glow)' }}>
            <span>-18°C</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', textShadow: 'none' }}>|</span>
            <span>+4°C</span>
          </div>

          {/* LED Controls */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input type="color" value={ledColor} onChange={(e) => setLedColor(e.target.value)} style={{ width: '22px', height: '22px', padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', cursor: 'pointer' }} title="Colore MoodUP" />
            <input type="range" min="0" max="100" value={ledIntensity} onChange={(e) => setLedIntensity(Number(e.target.value))} style={{ width: '70px', accentColor: ledColor, height: '4px' }} title="Intensità LED" />
          </div>

        </div>

        {/* Lo Smart Display integrato nella porta */}
        <div className="smart-screen">
          <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '8px', textAlign: 'center' }}>FrigoRadar</h1>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>
            {isLogin ? 'Bentornato! Accedi per continuare.' : 'Crea il tuo account gratuito.'}
          </p>

        {message.text && (
          <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? 'rgba(255, 99, 71, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: message.type === 'error' ? '#FF6B5B' : '#2ECC71', fontSize: '0.9rem', textAlign: 'center' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nome Frigorifero / Famiglia</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="es. Famiglia Rossi" style={{ width: '100%', paddingLeft: '42px' }} />
              </div>
            </div>
          )}
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
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" style={{ width: '100%', paddingLeft: '42px' }} />
            </div>
          </div>

          {isLogin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button type="button" onClick={resetPassword} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Password dimenticata?
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>

        {isLogin && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ padding: '0 12px', fontSize: '0.85rem' }}>OPPURE</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button type="button" onClick={handlePasskeyLogin} className="btn-secondary" disabled={loading} style={{ width: '100%' }}>
              <ScanFace size={20} />
              Accedi con Face-ID / Impronta
            </button>
          </>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
            {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'} <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
          </button>
        </div>
      </div>
      </div>

      {/* Bottone Installazione PWA */}
      {deferredPrompt && (
        <div className="animate-fade-up" style={{ marginTop: '10px' }}>
          <button 
            onClick={handleInstallApp}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '20px', padding: '10px 20px', color: '#fff', 
              cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            <Download size={18} />
            <span style={{ fontWeight: 500 }}>Installa App su questo dispositivo</span>
          </button>
        </div>
      )}

    </div>
  );
}

import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { User, CheckCircle2, Loader2, LogOut, ChevronRight, Settings, Users, Bell, Palette, LifeBuoy, Globe } from 'lucide-react';
import SavingsStats from '../components/SavingsStats';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { session, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('it') ? 'en' : 'it';
    i18n.changeLanguage(nextLang);
  };

  const [name, setName] = useState(session?.user?.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState(false);

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    setPasskeySuccess(false);
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      setPasskeySuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Impossibile registrare l\'impronta digitale. Assicurati di usare un browser supportato e che le Passkey siano abilitate su Supabase.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: name.trim() }
      });
      
      if (error) throw error;
      setSuccess(true);
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'aggiornamento del profilo');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', color: 'white', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{t('profile.title')}</h1>
        <button onClick={toggleLanguage} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <Globe size={18} />
          {i18n.language.toUpperCase()}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '14px', color: 'var(--primary)' }}>
          <User size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Profilo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {session?.user?.email}
          </p>
        </div>
      </div>

      <SavingsStats />

      {/* MENU PERSONALE */}
      <div className="glass-panel" style={{ padding: '8px', borderRadius: '24px', marginBottom: '24px' }}>
        
        {/* Notifiche */}
        <button style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(50, 215, 75, 0.1)', padding: '10px', borderRadius: '12px' }}><Bell size={20} color="#32D74B" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.notifications')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Condivisione Familiare */}
        <button style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 255, 170, 0.1)', padding: '10px', borderRadius: '12px' }}><Users size={20} color="#00FFAA" /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.family')}</div>
              <div style={{ fontSize: '0.75rem', color: '#00FFAA', fontWeight: 600, letterSpacing: '0.5px' }}>{t('profile.family_pro')}</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Preferenze */}
        <button style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '10px', borderRadius: '12px' }}><Palette size={20} color="#FFD700" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.preferences')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Supporto */}
        <button style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 69, 58, 0.1)', padding: '10px', borderRadius: '12px' }}><LifeBuoy size={20} color="#FF453A" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.support')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Impostazioni */}
        <button style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '12px' }}><Settings size={20} color="white" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.settings')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>{t('profile.biometric')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
          {t('profile.biometric_desc')}
        </p>

        <button 
          onClick={handleRegisterPasskey}
          disabled={registeringPasskey}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
            background: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
            color: 'white', fontSize: '1rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: 'pointer', opacity: registeringPasskey ? 0.7 : 1
          }}
        >
          {registeringPasskey ? <Loader2 size={20} className="animate-spin" /> : 'Registra Impronta / Face-ID'}
        </button>

        {passkeySuccess && (
          <div style={{ color: '#32D74B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', justifyContent: 'center', marginTop: '12px' }}>
            <CheckCircle2 size={16} /> Impronta registrata con successo!
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Impostazioni Frigorifero</h3>
        
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nome Visualizzato (Es. "Famiglia Rossi")
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Inserisci un nome per il tuo frigo"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            style={{
              padding: '16px', borderRadius: '16px', border: 'none',
              background: 'var(--primary)', color: 'black', fontSize: '1rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : 'Salva Modifiche'}
          </button>
          
          {success && (
            <div style={{ color: '#32D74B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', justifyContent: 'center' }}>
              <CheckCircle2 size={16} /> Profilo aggiornato! (Ricarica l'app per vederlo)
            </div>
          )}
        </form>
      </div>

      <button 
        onClick={handleLogout}
        disabled={loading}
        style={{ 
          width: '100%', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', 
          color: '#FF453A', padding: '16px', borderRadius: '24px', fontSize: '1rem', fontWeight: 600, 
          cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' 
        }}>
        {loading ? <Loader2 className="animate-spin" /> : (
          <>
            <LogOut size={20} />
            {t('profile.logout')}
          </>
        )}
      </button>

    </div>
  );
}

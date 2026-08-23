import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { User, CheckCircle2, Loader2, LogOut } from 'lucide-react';

export default function Profile() {
  const { session, signOut } = useAuthStore();
  const [name, setName] = useState(session?.user?.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

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

  return (
    <div style={{ padding: '20px', color: 'white', paddingBottom: '120px' }}>
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
        onClick={signOut}
        style={{
          width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 69, 58, 0.3)',
          background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', fontSize: '1rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          cursor: 'pointer'
        }}
      >
        <LogOut size={20} /> Disconnetti Account
      </button>

    </div>
  );
}

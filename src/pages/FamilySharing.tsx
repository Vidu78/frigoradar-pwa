import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Users, Copy, Check, ArrowRight } from 'lucide-react';

export default function FamilySharing() {
  const { session } = useAuthStore();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const familyId = session?.user?.user_metadata?.family_id || session?.user?.id;
  const isSharing = session?.user?.user_metadata?.family_id && session?.user?.user_metadata?.family_id !== session?.user?.id;

  const generateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error: insertError } = await supabase.from('family_invites').insert([{
        code,
        family_id: familyId
      }]);
      if (insertError) throw insertError;
      setInviteCode(code);
    } catch (err: any) {
      setError(err.message || "Errore durante la generazione dell'invito.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const joinFamily = async () => {
    if (!joinCode) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: fetchError } = await supabase
        .from('family_invites')
        .select('family_id')
        .eq('code', joinCode.toUpperCase())
        .single();

      if (fetchError || !data) throw new Error("Codice non valido o scaduto.");

      const { error: updateError } = await supabase.auth.updateUser({
        data: { family_id: data.family_id }
      });

      if (updateError) throw updateError;
      
      setSuccess("Frigoriferi sincronizzati con successo! Riavvia l'app.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(0, 255, 170, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users color="#00FFAA" size={24} />
        </div>
        <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 700 }}>Frigo Condiviso</h1>
      </div>

      {isSharing ? (
        <div style={{ background: 'rgba(0, 255, 170, 0.05)', border: '1px solid rgba(0, 255, 170, 0.2)', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#00FFAA', marginBottom: '8px' }}>Sei già connesso!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Il tuo frigo è attualmente condiviso e sincronizzato con la tua famiglia in tempo reale.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* SEZIONE 1: INVITA */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Invita qualcuno</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>Genera un codice per permettere al tuo partner o coinquilino di unirsi al tuo frigorifero.</p>
            
            {inviteCode ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', letterSpacing: '4px', fontWeight: 800 }}>
                  {inviteCode}
                </div>
                <button onClick={copyToClipboard} style={{ width: '48px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer' }}>
                  {copied ? <Check size={20} color="#00FFAA" /> : <Copy size={20} />}
                </button>
              </div>
            ) : (
              <button 
                onClick={generateInvite}
                disabled={loading}
                style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)', border: 'none', borderRadius: '16px', color: '#000', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
              >
                Genera Codice
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OPPURE</div>

          {/* SEZIONE 2: UNISCITI */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Unisciti a un frigo</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>Hai ricevuto un codice invito? Inseriscilo qui per sincronizzare i frigoriferi.</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ES: A4X9B2"
                maxLength={6}
                style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 16px', color: '#fff', fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase' }}
              />
              <button 
                onClick={joinFamily}
                disabled={loading || joinCode.length < 6}
                style={{ width: '48px', height: '48px', background: joinCode.length === 6 ? '#00FFAA' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: joinCode.length === 6 ? '#000' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowRight size={20} />
              </button>
            </div>
            {error && <p style={{ color: '#FF4444', fontSize: '14px', marginTop: '16px' }}>{error}</p>}
            {success && <p style={{ color: '#00FFAA', fontSize: '14px', marginTop: '16px' }}>{success}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

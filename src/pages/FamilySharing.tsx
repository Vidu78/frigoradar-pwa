import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useToastStore } from '../store/toastStore';
import { supabase } from '../lib/supabase';
import { Users, Copy, Check, ArrowRight, Unlink, ShieldCheck, UserCheck, Power } from 'lucide-react';

export default function FamilySharing() {
  const { session } = useAuthStore();
  const { fetchItems } = useInventoryStore();
  const { showToast } = useToastStore();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentFamilyId = session?.user?.user_metadata?.family_id;
  const userId = session?.user?.id;
  const previousFamilyId = session?.user?.user_metadata?.previous_family_id;

  // È in condivisione se ha un family_id diverso dal suo user_id
  const isSharing = Boolean(currentFamilyId && currentFamilyId !== userId);

  // Dissocia il frigorifero (abbandona o disattiva la condivisione)
  const leaveFamily = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Prima si revoca l'appartenenza (il metadata da solo non conta piu' nulla)
      if (currentFamilyId && currentFamilyId !== userId) {
        const { error: rpcError } = await supabase.rpc('leave_household', { hid: currentFamilyId });
        if (rpcError) throw rpcError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          family_id: userId,
          previous_family_id: currentFamilyId !== userId ? currentFamilyId : previousFamilyId,
          family_sharing_enabled: false
        }
      });

      if (updateError) throw updateError;

      // Aggiorna l'inventario per caricare il frigo personale dell'utente
      await fetchItems();
      showToast("Frigorifero dissociato! Ora stai usando il tuo frigorifero personale.", "success");
      setSuccess("Dissociazione completata! Sei tornato al tuo frigo personale.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore durante la dissociazione del frigorifero.");
      showToast("Errore durante la dissociazione", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle abilitazione/disabilitazione condivisione
  const toggleSharing = async () => {
    if (isSharing) {
      await leaveFamily();
    } else if (previousFamilyId && previousFamilyId !== userId) {
      // Uscire da una famiglia ora revoca davvero l'accesso: per rientrare
      // serve un codice nuovo, non basta riscrivere il metadata.
      showToast("Per rientrare nel frigo condiviso chiedi un nuovo codice d'invito.", "info");
    } else {
      showToast("Genera o inserisci un codice d'invito per attivare la condivisione", "info");
    }
  };

  const generateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const familyIdToShare = currentFamilyId || userId;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error: insertError } = await supabase.from('family_invites').insert([{
        code,
        family_id: familyIdToShare
      }]);
      if (insertError) throw insertError;
      setInviteCode(code);
      showToast("Codice invito generato!", "success");
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
      showToast("Codice copiato negli appunti!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const joinFamily = async () => {
    if (!joinCode) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // I codici non sono piu' leggibili da chiunque: l'ingresso passa da una
      // funzione server che valida il codice e scrive l'appartenenza reale.
      const { data: familyId, error: rpcError } = await supabase
        .rpc('join_household', { invite_code: joinCode.toUpperCase() });

      if (rpcError || !familyId) throw new Error(rpcError?.message || "Codice non valido o scaduto.");

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          family_id: familyId,
          previous_family_id: familyId,
          family_sharing_enabled: true
        }
      });

      if (updateError) throw updateError;
      
      await fetchItems();
      showToast("Frigorifero sincronizzato con successo!", "success");
      setSuccess("Frigoriferi sincronizzati con successo!");
      setJoinCode('');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', color: '#fff', maxWidth: '600px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(0,255,170,0.2) 0%, rgba(0,204,136,0.1) 100%)', border: '1px solid rgba(0,255,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users color="#00FFAA" size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Frigo Condiviso</h1>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
            Gestisci la sincronizzazione in tempo reale con i tuoi familiari
          </p>
        </div>
      </div>

      {/* TOGGLE SWITCH DI STATO CONDIVISIONE */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(30, 32, 36, 0.8) 0%, rgba(18, 20, 24, 0.9) 100%)',
        border: isSharing ? '1px solid rgba(0, 255, 170, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: isSharing ? '0 10px 30px rgba(0, 255, 170, 0.1)' : '0 10px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: isSharing ? 'rgba(0, 255, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSharing ? '#00FFAA' : 'rgba(255, 255, 255, 0.4)'
          }}>
            {isSharing ? <UserCheck size={22} /> : <Power size={22} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>
              {isSharing ? 'Condivisione Attiva' : 'Frigo Personale'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              {isSharing ? 'Sincronizzato in tempo reale' : 'Visibile solo a te'}
            </div>
          </div>
        </div>

        {/* SWIPE / TOGGLE SWITCH */}
        <button
          onClick={toggleSharing}
          disabled={loading || (!isSharing && !previousFamilyId)}
          title={isSharing ? "Disattiva Condivisione" : "Attiva Condivisione"}
          style={{
            width: '56px',
            height: '32px',
            borderRadius: '16px',
            background: isSharing ? 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)' : 'rgba(255,255,255,0.15)',
            border: 'none',
            padding: '4px',
            cursor: (loading || (!isSharing && !previousFamilyId)) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSharing ? 'flex-end' : 'flex-start',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            opacity: (!isSharing && !previousFamilyId) ? 0.5 : 1
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isSharing ? '#000' : '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.3s'
          }} />
        </button>
      </div>

      {/* SE L'UTENTE È ATTUALMENTE IN UN FRIGO CONDIVISO */}
      {isSharing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'rgba(0, 255, 170, 0.04)',
            border: '1px solid rgba(0, 255, 170, 0.2)',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(0, 255, 170, 0.1)', color: '#00FFAA', marginBottom: '12px' }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '18px', color: '#00FFAA', margin: '0 0 8px 0', fontWeight: 700 }}>Stai condividendo il frigorifero!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
              Tutti i prodotti aggiunti o consumati vengono sincronizzati istantaneamente con tutti i membri della tua famiglia.
            </p>
          </div>

          {/* PULSANTE PER DISSOCIARE IL FRIGORIFERO */}
          <div style={{ background: 'rgba(255,69,58,0.05)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#FF453A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Unlink size={18} /> Dissocia Frigorifero
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 18px 0', lineHeight: 1.4 }}>
              Vuoi disconnetterti da questo frigo condiviso e tornare al tuo frigorifero privato? Potrai riconnetterti in qualsiasi momento.
            </p>
            <button
              onClick={leaveFamily}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(255,69,58,0.15)',
                border: '1px solid rgba(255,69,58,0.4)',
                borderRadius: '16px',
                color: '#FF453A',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Dissociazione in corso...' : 'Dissocia Ora dal Frigo Condiviso'}
            </button>
          </div>
        </div>
      ) : (
        /* SE L'UTENTE È NEL SUO FRIGO PERSONALE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* SEZIONE 1: INVITA QUALCUNO */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Invita qualcuno al tuo frigo</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Genera un codice d'invito monouso e invialo a chi vuoi per condividere la tua dispensa.
            </p>
            
            {inviteCode ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,170,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', letterSpacing: '4px', fontWeight: 800, color: '#00FFAA' }}>
                  {inviteCode}
                </div>
                <button onClick={copyToClipboard} style={{ width: '52px', background: 'rgba(0,255,170,0.15)', border: '1px solid rgba(0,255,170,0.3)', borderRadius: '14px', color: '#00FFAA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {copied ? <Check size={22} color="#00FFAA" /> : <Copy size={22} />}
                </button>
              </div>
            ) : (
              <button 
                onClick={generateInvite}
                disabled={loading}
                style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)', border: 'none', borderRadius: '16px', color: '#000', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,255,170,0.25)' }}
              >
                Genera Codice Invito
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '12px', letterSpacing: '1px' }}>
            OPPURE
          </div>

          {/* SEZIONE 2: UNISCITI A UN FRIGO */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Unisciti a un frigo esistente</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Inserisci il codice di 6 caratteri ricevuto per collegarti al frigorifero di un altro membro.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ES: A4X9B2"
                maxLength={6}
                style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '0 16px', color: '#fff', fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700 }}
              />
              <button 
                onClick={joinFamily}
                disabled={loading || joinCode.length < 6}
                style={{ width: '52px', height: '52px', background: joinCode.length === 6 ? '#00FFAA' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '14px', color: joinCode.length === 6 ? '#000' : 'rgba(255,255,255,0.4)', cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >
                <ArrowRight size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGGI DI FEEDBACK */}
      {error && (
        <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.3)', borderRadius: '16px', color: '#FF453A', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(0,255,170,0.15)', border: '1px solid rgba(0,255,170,0.3)', borderRadius: '16px', color: '#00FFAA', fontSize: '14px', textAlign: 'center' }}>
          {success}
        </div>
      )}
    </div>
  );
}

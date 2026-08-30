import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { User, CheckCircle2, Loader2, LogOut, ChevronRight, Settings, Users, Bell, Palette, LifeBuoy, Globe, X, Receipt } from 'lucide-react';
import SavingsStats from '../components/SavingsStats';
import { useTranslation } from 'react-i18next';
import { useDialogStore } from '../store/dialogStore';
import { useToastStore } from '../store/toastStore';

export default function Profile() {
  const { session, signOut } = useAuthStore();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const openTutorial = () => {
    document.dispatchEvent(new CustomEvent('openTutorial'));
  };

  const [name, setName] = useState(session?.user?.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const { showDialog } = useDialogStore();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const [pushStatus, setPushStatus] = useState('Verifica in corso...');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);



  const checkPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsPushEnabled(!!subscription);
      setPushStatus(subscription ? 'Notifiche attivate' : 'Notifiche disattivate');
    } catch (err) {
      console.error(err);
      setPushStatus('Errore di verifica');
    }
  };

  const loadReceipts = async () => {
    setLoadingReceipts(true);
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Errore nel caricamento degli scontrini:", error);
    } else {
      setReceipts(data || []);
    }
    setLoadingReceipts(false);
  };

  useEffect(() => {
    if (session) {
      if (showReceiptsModal) loadReceipts();
      if (showNotificationsModal) checkPushSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, showReceiptsModal, showNotificationsModal]);

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    setPasskeySuccess(false);
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      setPasskeySuccess(true);
    } catch (err: any) {
      console.error(err);
      console.error(err);
      showDialog({
        title: 'Errore Passkey',
        message: err.message || 'Impossibile registrare l\'impronta digitale. Assicurati di usare un browser supportato.',
        type: 'danger',
        isAlert: true,
        confirmText: 'Ok'
      });
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
      console.error(err);
      showDialog({
        title: 'Errore',
        message: 'Errore durante l\'aggiornamento del profilo',
        type: 'danger',
        isAlert: true,
        confirmText: 'Ok'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleTogglePush = async () => {
    if (isTogglingPush) return;
    setIsTogglingPush(true);
    setPushStatus('Elaborazione...');

    try {
      const registration = await navigator.serviceWorker.ready;

      if (isPushEnabled) {
        // DISATTIVA
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await supabase.from('push_subscriptions').delete().eq('user_id', session?.user?.id);
        }
        setIsPushEnabled(false);
        setPushStatus('Notifiche disattivate');
        showToast('Notifiche disattivate con successo', 'success');
      } else {
        // ATTIVA
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          
          if (!VAPID_PUBLIC_KEY) {
            setPushStatus('Errore: VAPID_PUBLIC_KEY mancante nel file .env');
            setIsTogglingPush(false);
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });

          const subJson = subscription.toJSON();
          
          // La tabella ha endpoint/p256dh/auth: scrivere un campo "subscription"
          // faceva fallire l'insert, quindi nessuna notifica e' mai partita.
          const { error } = await supabase.from('push_subscriptions').upsert({
            user_id: session?.user?.id,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth
          }, { onConflict: 'user_id' });

          if (error) {
            console.error(error);
            setPushStatus('Errore salvataggio nel database.');
            // Revert unsubscribe just in case
            await subscription.unsubscribe();
          } else {
            setIsPushEnabled(true);
            setPushStatus('Notifiche attivate con successo!');
            showToast('Notifiche attivate con successo', 'success');
          }
        } else {
          setPushStatus('Permesso negato. Devi abilitarlo dal browser.');
        }
      }
    } catch (e) {
      console.error(e);
      setPushStatus('Errore durante l\'operazione.');
    } finally {
      setIsTogglingPush(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'white', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{t('profile.title')}</h1>
        <button onClick={() => setShowPreferencesModal(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <Globe size={18} />
          {i18n.language.toUpperCase().substring(0, 2)}
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
        <button onClick={() => setShowNotificationsModal(true)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(50, 215, 75, 0.1)', padding: '10px', borderRadius: '12px' }}><Bell size={20} color="#32D74B" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.notifications')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Condivisione Familiare */}
        <button onClick={() => document.dispatchEvent(new CustomEvent('changeTab', { detail: 'family' }))} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 255, 170, 0.1)', padding: '10px', borderRadius: '12px' }}><Users size={20} color="#00FFAA" /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.family')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Condividi con i familiari</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Storico Scontrini */}
        <button onClick={() => setShowReceiptsModal(true)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 159, 10, 0.1)', padding: '10px', borderRadius: '12px' }}><Receipt size={20} color="#FF9F0A" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Storico Scontrini</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Guida all'Uso */}
        <button onClick={openTutorial} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '10px', borderRadius: '12px' }}><LifeBuoy size={20} color="#3498DB" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Guida all'Uso</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Preferenze */}
        <button onClick={() => setShowPreferencesModal(true)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '10px', borderRadius: '12px' }}><Palette size={20} color="#FFD700" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.preferences')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Supporto */}
        <button onClick={() => window.location.href = 'mailto:info@frigoradar.com'} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 69, 58, 0.1)', padding: '10px', borderRadius: '12px' }}><LifeBuoy size={20} color="#FF453A" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{t('profile.support')}</span>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* Impostazioni */}
        <button onClick={() => setShowSettingsModal(true)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer' }}>
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

      {/* --- MODALS --- */}
      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel-solid)', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setShowNotificationsModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>{t('profile.notifications')}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Ricevi avvisi intelligenti per i prodotti che stanno per scadere nel tuo frigorifero.</p>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', 
              marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>Avvisi Scadenze</div>
                <div style={{ fontSize: '0.85rem', color: isPushEnabled ? '#00FFAA' : 'var(--text-muted)' }}>
                  {pushStatus}
                </div>
              </div>
              
              {/* Premium Toggle Switch */}
              <button 
                onClick={handleTogglePush}
                disabled={isTogglingPush}
                style={{
                  position: 'relative', width: '56px', height: '32px', 
                  borderRadius: '32px', border: 'none',
                  background: isPushEnabled ? 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)' : 'rgba(255,255,255,0.1)',
                  cursor: isTogglingPush ? 'not-allowed' : 'pointer',
                  transition: 'background 0.4s ease, opacity 0.3s',
                  boxShadow: isPushEnabled ? '0 0 15px rgba(0, 255, 170, 0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  opacity: isTogglingPush ? 0.7 : 1
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px', left: isPushEnabled ? '26px' : '2px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  transition: 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }} />
              </button>
            </div>
            
            {isPushEnabled && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0 10px' }}>
                <Bell size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Riceverai notifiche solo quando necessario per evitare sprechi.
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECEIPTS MODAL */}
      {showReceiptsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel-solid)', width: '100%', maxWidth: '400px', maxHeight: '80vh', borderRadius: '24px', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setShowReceiptsModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Receipt size={24} color="#FF9F0A"/> I tuoi Scontrini</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingReceipts ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
              ) : receipts.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Nessuno scontrino salvato. Scansionane uno!</div>
              ) : (
                receipts.map(r => (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {r.image_url ? (
                      <img src={r.image_url} alt="Scontrino" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer' }} onClick={() => window.open(r.image_url, '_blank')} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={24} opacity={0.5} /></div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{r.store_name || "Spesa"}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(r.created_at).toLocaleDateString()} • {r.items_count} prodotti</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'white' }}>
                      €{r.total_amount ? r.total_amount.toFixed(2) : "0.00"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREFERENCES MODAL */}
      {showPreferencesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel-solid)', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setShowPreferencesModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{t('profile.preferences')}</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span>Lingua</span>
              <select 
                value={i18n.language.substring(0, 2)} 
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', outline: 'none' }}
              >
                <option value="it" style={{ color: 'black' }}>Italiano</option>
                <option value="en" style={{ color: 'black' }}>English</option>
                <option value="es" style={{ color: 'black' }}>Español</option>
                <option value="fr" style={{ color: 'black' }}>Français</option>
                <option value="de" style={{ color: 'black' }}>Deutsch</option>
                <option value="zh" style={{ color: 'black' }}>中文</option>
                <option value="ja" style={{ color: 'black' }}>日本語</option>
                <option value="ar" style={{ color: 'black' }}>العربية</option>
                <option value="hi" style={{ color: 'black' }}>हिन्दी</option>
                <option value="ka" style={{ color: 'black' }}>ქართული</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <span>Tema</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sincronizzato col sistema</span>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel-solid)', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{t('profile.settings')}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Gestisci le impostazioni avanzate del tuo account.</p>
            
            <button style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer', marginBottom: '12px' }}>
              Esporta Dati (CSV)
            </button>
            
            <button style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,69,58,0.5)', background: 'rgba(255,69,58,0.1)', color: '#FF453A', cursor: 'pointer' }}>
              Elimina Account
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

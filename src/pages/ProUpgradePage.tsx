import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authHeaders } from '../lib/api';
import { Sparkles, ShoppingCart, Users, CheckCircle2, ChevronLeft, Loader2, Star, Home, Settings } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDialogStore } from '../store/dialogStore';

export default function ProUpgradePage() {
  const navigate = useNavigate();
  const { isPro, refreshPlan } = useAuthStore();
  const { showDialog } = useDialogStore();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [attesaPagamento, setAttesaPagamento] = useState(false);

  // Al ritorno da Stripe il piano lo scrive il webhook, che puo' arrivare un
  // istante dopo: si ricontrolla per qualche secondo invece di dire di no.
  useEffect(() => {
    if (searchParams.get('pagamento') !== 'ok') return;
    let vivo = true;
    setAttesaPagamento(true);

    (async () => {
      for (let tentativo = 0; tentativo < 10 && vivo; tentativo++) {
        if (await refreshPlan()) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!vivo) return;
      setAttesaPagamento(false);
      setSearchParams({}, { replace: true });
    })();

    return () => { vivo = false; };
  }, [searchParams, refreshPlan, setSearchParams]);


  const apriGestione = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billingPortal', { method: 'POST', headers: await authHeaders() });
      const dati = await res.json().catch(() => ({}));
      if (res.ok && dati.url) {
        window.location.assign(dati.url);
        return;
      }
      showDialog({
        title: 'Errore',
        message: dati.error || 'Non riesco ad aprire la gestione abbonamento.',
        type: 'danger', isAlert: true, confirmText: 'Ok'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (piano: 'mensile' | 'annuale' = 'mensile') => {
    setLoading(true);
    try {
      const res = await fetch('/api/createCheckout', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ piano })
      });

      const dati = await res.json().catch(() => ({}));

      if (res.ok && dati.url) {
        window.location.assign(dati.url);
        return;
      }

      showDialog({
        title: res.status === 503 ? 'Quasi pronto' : 'Errore',
        message: dati.error || 'Non riesco ad aprire il pagamento. Riprova piu tardi.',
        type: res.status === 503 ? 'info' : 'danger',
        isAlert: true,
        confirmText: 'Ok'
      });
    } catch (err) {
      console.error(err);
      showDialog({
        title: 'Errore di connessione',
        message: 'Controlla la rete e riprova.',
        type: 'danger',
        isAlert: true,
        confirmText: 'Ok'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', minHeight: '100%', color: 'white', background: 'radial-gradient(circle at 50% 0%, rgba(255,215,0,0.1) 0%, transparent 70%)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>FrigoRadar PRO</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Sblocca il pieno potenziale</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
          boxShadow: '0 0 30px rgba(255,215,0,0.4)'
        }}>
          <Star size={40} color="black" />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Meno Sprechi, Meno Stress</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto' }}>
          Passa a FrigoRadar PRO e lascia che l'Intelligenza Artificiale gestisca la tua cucina.
        </p>
      </div>

      {/* FEATURES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '16px', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ background: 'rgba(255,215,0,0.1)', padding: '12px', borderRadius: '14px', height: 'fit-content' }}>
            <Sparkles size={24} color="#FFD700" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Chef AI (Svuota Frigo)</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Genera ricette magiche istantanee basate sugli ingredienti che ti stanno per scadere.</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '16px', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ background: 'rgba(255,215,0,0.1)', padding: '12px', borderRadius: '14px', height: 'fit-content' }}>
            <ShoppingCart size={24} color="#FFD700" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Smart Shopping</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Compila la lista della spesa automaticamente e sposta i prodotti in frigo con un tocco.</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '16px', border: '1px solid rgba(255,215,0,0.2)', opacity: 0.7 }}>
          <div style={{ background: 'rgba(255,215,0,0.1)', padding: '12px', borderRadius: '14px', height: 'fit-content' }}>
            <Users size={24} color="#FFD700" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Condivisione Familiare</h3>
            <span style={{ fontSize: '0.7rem', background: '#FFD700', color: 'black', padding: '2px 6px', borderRadius: '8px', fontWeight: 700, marginBottom: '4px', display: 'inline-block' }}>IN ARRIVO</span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Sincronizza il frigo in tempo reale con il tuo partner o i tuoi coinquilini.</p>
          </div>
        </div>

      </div>

      {/* CTA */}
      {attesaPagamento ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px' }}>
          <Loader2 size={32} className="animate-spin" color="#FFD700" />
          <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center' }}>
            Pagamento ricevuto, sto attivando il tuo PRO...
          </p>
        </div>
      ) : isPro ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '20px', border: '1px solid rgba(50, 215, 75, 0.3)' }}>
          <CheckCircle2 size={40} color="#32D74B" />
          <h3 style={{ margin: 0, color: '#32D74B' }}>Sei già un utente PRO!</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Da "Gestisci abbonamento" puoi passare da mensile ad annuale, cambiare carta o disdire.
          </p>
          <button
            onClick={apriGestione}
            disabled={loading}
            style={{
              marginTop: '8px', width: '100%', padding: '14px', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
              color: 'white', fontSize: '0.95rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <Settings size={18} /> Gestisci abbonamento
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '8px', width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
              background: '#32D74B', color: 'black', fontSize: '1rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <Home size={20} /> Torna al frigo
          </button>
        </div>
      ) : (
        <>
        <button 
          onClick={() => handleUpgrade('mensile')}
          disabled={loading}
          style={{
            width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: 'black', fontSize: '1.1rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: 'pointer', boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4)',
            transition: 'transform 0.2s',
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : 'Passa a PRO — 4,99 €/mese'}
        </button>
        <button
          onClick={() => handleUpgrade('annuale')}
          disabled={loading}
          style={{
            width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px',
            border: '1px solid rgba(255,215,0,0.35)', background: 'transparent',
            color: '#FFD700', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
          }}
        >
          Oppure 39,99 €/anno — risparmi il 33%
        </button>
        </>
      )}

    </div>
  );
}

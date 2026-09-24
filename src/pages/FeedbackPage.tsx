import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ponytail: pagina pubblica, niente login — i tester Play devono poter scrivere
// anche se non sono riusciti a registrarsi (che e' proprio il caso da sapere).

// Le scelte si salvano con la chiave (yes/hard/no/skip), cosi' le risposte restano confrontabili tra lingue
const SCELTE_SI_NO = ['yes', 'hard', 'no', 'skip'] as const;

const DOMANDE_CHIUSE = ['registrazione', 'barcode', 'notifiche', 'ricette'] as const;

const DOMANDE_APERTE = ['problemi', 'confusione', 'desideri'] as const;

const MAX = 2000;

export default function FeedbackPage() {
  const { t } = useTranslation();
  const [risposte, setRisposte] = useState<Record<string, string>>({});
  const [voto, setVoto] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inviato, setInviato] = useState(false);
  const [errore, setErrore] = useState('');

  const set = (campo: string, valore: string) =>
    setRisposte((r) => ({ ...r, [campo]: valore.slice(0, MAX) }));

  const invia = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrore('');
    setLoading(true);
    const { error } = await supabase.from('feedback_tester').insert({
      voto: voto || null,
      telefono: risposte.telefono?.slice(0, 120) || null,
      registrazione: risposte.registrazione || null,
      barcode: risposte.barcode || null,
      notifiche: risposte.notifiche || null,
      ricette: risposte.ricette || null,
      problemi: risposte.problemi || null,
      confusione: risposte.confusione || null,
      desideri: risposte.desideri || null,
      contatto: risposte.contatto?.slice(0, 200) || null,
      // Senza versione e modello una segnalazione non e' riproducibile, e il
      // tester non li sa dire: li prende la pagina.
      versione: __APP_VERSION__,
      device: navigator.userAgent.slice(0, 300),
    });
    setLoading(false);
    if (error) {
      setErrore(t('feedback.save_error'));
      return;
    }
    setInviato(true);
  };

  if (inviato) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <CheckCircle2 size={48} color="#32D74B" />
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{t('feedback.thanks')}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('feedback.thanks_sub')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <form onSubmit={invia} style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <MessageSquareHeart size={32} color="#00FFAA" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{t('feedback.title')}</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('feedback.subtitle')}
            </p>
          </div>
        </div>

        <label style={etichetta}>{t('feedback.phone')}</label>
        <input
          style={campo}
          placeholder={t('feedback.phone_placeholder')}
          value={risposte.telefono || ''}
          onChange={(e) => set('telefono', e.target.value)}
        />

        {DOMANDE_CHIUSE.map((q) => (
          <div key={q}>
            <label style={etichetta}>{t(`feedback.q_${q}`)}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SCELTE_SI_NO.map((s) => {
                const scelto = risposte[q] === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set(q, scelto ? '' : s)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      border: scelto ? '1px solid #00FFAA' : '1px solid rgba(255,255,255,0.15)',
                      background: scelto ? 'rgba(0,255,170,0.15)' : 'transparent',
                      color: scelto ? '#00FFAA' : 'var(--text-muted)',
                    }}
                  >
                    {t(`feedback.choice_${s}`)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {DOMANDE_APERTE.map((q) => (
          <div key={q}>
            <label style={etichetta}>{t(`feedback.q_${q}`)}</label>
            <textarea
              style={{ ...campo, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
              maxLength={MAX}
              placeholder={t(`feedback.ph_${q}`)}
              value={risposte[q] || ''}
              onChange={(e) => set(q, e.target.value)}
            />
          </div>
        ))}

        <div>
          <label style={etichetta}>{t('feedback.recommend')}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setVoto(voto === n ? 0 : n)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: voto === n ? '1px solid #00FFAA' : '1px solid rgba(255,255,255,0.15)',
                  background: voto === n ? 'rgba(0,255,170,0.15)' : 'transparent',
                  color: voto === n ? '#00FFAA' : 'var(--text-muted)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={etichetta}>{t('feedback.email')}</label>
          <input
            style={campo}
            type="email"
            placeholder="mario@email.com"
            value={risposte.contatto || ''}
            onChange={(e) => set('contatto', e.target.value)}
          />
        </div>

        {errore && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,99,71,0.1)', color: '#FF6B5B', fontSize: '0.9rem' }}>
            {errore}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: '#00FFAA', color: '#051A18', fontSize: '1rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
          }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> {t('feedback.send')}</>}
        </button>

        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('feedback.footer')}
        </p>
      </form>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: '100dvh', padding: '24px 16px 60px', display: 'flex', justifyContent: 'center',
  color: 'white', background: 'radial-gradient(circle at 50% 0%, rgba(0,255,170,0.08) 0%, transparent 60%)',
};

const card: React.CSSProperties = {
  width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px',
};

const etichetta: React.CSSProperties = {
  display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600,
};

const campo: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: '12px', fontSize: '0.95rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'white',
  boxSizing: 'border-box',
};

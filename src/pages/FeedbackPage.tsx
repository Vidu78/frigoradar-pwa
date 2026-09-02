import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react';

// ponytail: pagina pubblica, niente login — i tester Play devono poter scrivere
// anche se non sono riusciti a registrarsi (che e' proprio il caso da sapere).

const SCELTE_SI_NO = ['Si, senza problemi', 'Si, ma con difficolta', 'No, non ci sono riuscito', 'Non l\'ho provato'];

const DOMANDE_CHIUSE = [
  { campo: 'registrazione', testo: 'Sei riuscito a registrarti e a entrare?' },
  { campo: 'barcode', testo: 'La scansione del codice a barre ha riconosciuto i prodotti?' },
  { campo: 'notifiche', testo: 'Ti sono arrivate le notifiche di scadenza?' },
  { campo: 'ricette', testo: 'Le ricette proposte erano sensate con quello che avevi in casa?' },
] as const;

const DOMANDE_APERTE = [
  { campo: 'problemi', testo: 'Hai trovato errori, schermate bloccate o cose che non funzionano?', ph: 'Raccontami cosa e\' successo e in quale schermata.' },
  { campo: 'confusione', testo: 'C\'e\' stato un momento in cui non hai capito cosa fare?', ph: 'Anche solo "non trovavo il pulsante per...".' },
  { campo: 'desideri', testo: 'Cosa aggiungeresti o toglieresti?', ph: 'La cosa che ti manca di piu\'.' },
] as const;

const MAX = 2000;

export default function FeedbackPage() {
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
    });
    setLoading(false);
    if (error) {
      setErrore('Non sono riuscito a salvare la risposta. Riprova tra poco.');
      return;
    }
    setInviato(true);
  };

  if (inviato) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <CheckCircle2 size={48} color="#32D74B" />
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Grazie davvero</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            La tua risposta e' arrivata. E' cosi' che FrigoRadar smette di essere
            quello che immagino io e diventa quello che vi serve.
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
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Il tuo parere su FrigoRadar</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Due minuti. Nessun campo e' obbligatorio, rispondi solo a quello che ti va.
            </p>
          </div>
        </div>

        <label style={etichetta}>Che telefono usi?</label>
        <input
          style={campo}
          placeholder="es. Samsung Galaxy A54, Android 14"
          value={risposte.telefono || ''}
          onChange={(e) => set('telefono', e.target.value)}
        />

        {DOMANDE_CHIUSE.map((d) => (
          <div key={d.campo}>
            <label style={etichetta}>{d.testo}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SCELTE_SI_NO.map((s) => {
                const scelto = risposte[d.campo] === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set(d.campo, scelto ? '' : s)}
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
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {DOMANDE_APERTE.map((d) => (
          <div key={d.campo}>
            <label style={etichetta}>{d.testo}</label>
            <textarea
              style={{ ...campo, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
              maxLength={MAX}
              placeholder={d.ph}
              value={risposte[d.campo] || ''}
              onChange={(e) => set(d.campo, e.target.value)}
            />
          </div>
        ))}

        <div>
          <label style={etichetta}>Quanto consiglieresti FrigoRadar a un amico?</label>
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
          <label style={etichetta}>Email, se vuoi che ti risponda (facoltativa)</label>
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
          {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Invia il feedback</>}
        </button>

        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Le risposte le leggo solo io e servono a migliorare l'app.
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

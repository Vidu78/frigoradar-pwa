import { Trash2, Mail } from 'lucide-react';

// ponytail: pagina pubblica richiesta da Google Play (Sicurezza dei dati).
// Deve restare leggibile anche a chi ha disinstallato l'app, quindi niente login.

export default function EliminaAccountPage() {
  return (
    <div style={{
      minHeight: '100dvh', padding: '32px 16px 60px', display: 'flex', justifyContent: 'center',
      color: 'white', background: 'radial-gradient(circle at 50% 0%, rgba(0,255,170,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '620px', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Trash2 size={30} color="#00FFAA" />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Eliminare il tuo account FrigoRadar</h1>
        </div>

        <h2 style={h2}>Dall'app</h2>
        <p style={p}>
          Apri FrigoRadar, vai su <strong>Profilo</strong> e scegli <strong>Elimina account</strong>.
          La cancellazione parte subito, senza passare da noi.
        </p>

        <h2 style={h2}>Se non hai piu' l'app</h2>
        <p style={p}>
          Scrivi a <a href="mailto:privacy@frigoradar.it" style={a}>privacy@frigoradar.it</a> dall'indirizzo
          email con cui ti sei registrato, chiedendo la cancellazione dell'account. Ti rispondiamo entro
          30 giorni, come previsto dal GDPR.
        </p>

        <h2 style={h2}>Cancellare solo una parte dei dati</h2>
        <p style={p}>
          Non sei obbligato a chiudere l'account per liberarti di qualcosa. Dall'app puoi eliminare
          in ogni momento i singoli prodotti, le foto caricate, le carte fedelta' e la lista della
          spesa, e disattivare le notifiche da <strong>Profilo</strong>. Se preferisci che sia
          cancellato un altro dato in particolare, scrivi a{' '}
          <a href="mailto:privacy@frigoradar.it" style={a}>privacy@frigoradar.it</a>: l'account resta attivo.
        </p>

        <h2 style={h2}>Che cosa viene cancellato</h2>
        <ul style={p}>
          <li>L'account e l'indirizzo email</li>
          <li>L'inventario di frigo, freezer e dispensa</li>
          <li>Le foto dei prodotti e degli scontrini che hai caricato</li>
          <li>Le carte fedelta' salvate</li>
          <li>La lista della spesa e lo storico dei consumi</li>
          <li>L'iscrizione alle notifiche push</li>
        </ul>

        <h2 style={h2}>Che cosa resta, e per quanto</h2>
        <p style={p}>
          Nulla di riconducibile a te. Restano solo i dati che la legge ci impone di conservare:
          le ricevute dei pagamenti dell'abbonamento PRO, tenute da Stripe per gli obblighi fiscali.
          Tutto il resto viene eliminato entro <strong>30 giorni</strong> dalla richiesta.
        </p>

        <p style={{ ...p, marginTop: '32px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Per qualsiasi dubbio: <a href="mailto:privacy@frigoradar.it" style={a}>privacy@frigoradar.it</a> ·
          {' '}<a href="https://frigoradar.it/privacy" style={a}>Informativa privacy</a>
        </p>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.05rem', marginTop: '28px', marginBottom: '8px', color: '#00FFAA' };
const p: React.CSSProperties = { margin: 0, color: 'var(--text-muted)' };
const a: React.CSSProperties = { color: '#00FFAA' };

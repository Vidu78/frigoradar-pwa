import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Gli endpoint AI costano soldi veri a ogni chiamata: nessuno entra senza sessione.
// Niente header CORS: la PWA e le function stanno sullo stesso dominio Vercel,
// quindi le richieste sono same-origin e un Allow-Origin aperto servirebbe solo
// a farsi svuotare la quota Gemini da fuori.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// ponytail: limite fisso, Vercel taglia comunque a 4.5MB; se servira' un tetto
// per piano, il posto giusto e' households.plan.
const MAX_BODY_BYTES = 4_000_000;

type Credito = 'scan' | 'recipe' | 'nessuno';

export async function guard(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return null;
  }

  const size = Number(req.headers['content-length'] || 0);
  if (size > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Immagine troppo grande.' });
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Config Supabase mancante nelle env della function.');
    res.status(500).json({ error: 'Configurazione server mancante.' });
    return null;
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Non autenticato.' });
    return null;
  }

  // Il client parla col DB come l'utente: le policy valgono anche qui.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Sessione non valida.' });
    return null;
  }

  return data.user;
}

// Va chiamata DOPO aver validato il corpo della richiesta: una foto mancante
// o un JSON storto non deve costare un credito all'utente.
export async function consumaCredito(
  req: VercelRequest,
  res: VercelResponse,
  credito: Exclude<Credito, 'nessuno'>
): Promise<boolean> {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Il conteggio sta nel database, non nel client: e' l'unico posto che
  // l'utente non puo' riscrivere. La funzione azzera da sola a inizio settimana.
  const { data: esito, error: erroreCredito } = await supabase.rpc('consume_ai_credit', {
    kind: credito,
  });

  if (erroreCredito) {
    console.error('consume_ai_credit:', erroreCredito);
    res.status(500).json({ error: 'Impossibile verificare il piano.' });
    return false;
  }

  if (!esito?.allowed) {
    // 402 = serve il piano PRO. Il client mostra il paywall, non un errore.
    res.status(402).json({
      error: credito === 'recipe'
        ? 'Hai usato la ricetta AI di questa settimana.'
        : 'Hai usato le scansioni AI di questa settimana.',
      reason: esito?.reason ?? 'quota',
      limit: esito?.limit ?? null,
      resets_at: esito?.resets_at ?? null,
    });
    return false;
  }

  return true;
}

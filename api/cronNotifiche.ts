import type { VercelRequest, VercelResponse } from '@vercel/node';

// Il pezzo che mancava: la edge function check_expirations era deployata ma
// non la chiamava nessuno, quindi nessun utente ha mai ricevuto una notifica.
// Vercel invoca questa rotta secondo il "crons" in vercel.json e ci mette
// dentro l'header con CRON_SECRET; senza quel segreto la rotta non fa nulla,
// altrimenti chiunque potrebbe far partire l'invio a raffica.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const atteso = process.env.CRON_SECRET;
  const ricevuto = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!atteso || ricevuto !== atteso) {
    return res.status(401).json({ error: 'Non autorizzato.' });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) {
    console.error('Config Supabase mancante: notifiche non inviate.');
    return res.status(500).json({ error: 'Configurazione server mancante.' });
  }

  try {
    const r = await fetch(`${url}/functions/v1/check_expirations`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'content-type': 'application/json',
      },
      body: '{}',
    });
    const testo = await r.text();
    // L'esito finisce nei log di Vercel: e' l'unico posto dove si vede se le
    // notifiche stanno davvero partendo.
    console.error(`check_expirations: ${r.status} ${testo.slice(0, 300)}`);
    return res.status(r.ok ? 200 : 502).json({ stato: r.status, esito: testo.slice(0, 500) });
  } catch (e: any) {
    console.error('Cron notifiche:', e);
    return res.status(502).json({ error: 'Invio notifiche fallito', details: e.message });
  }
}

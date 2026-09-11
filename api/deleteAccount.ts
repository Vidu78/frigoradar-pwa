import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard } from '../lib/guard.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Tabelle con user_id: si svuotano prima dell'utente auth perche' non tutte hanno
// la FK in cascade. Errori tipo "colonna inesistente" si ignorano: meglio un
// residuo orfano che un account che non si riesce a chiudere.
const TABELLE_UTENTE = [
  'push_subscriptions', 'consumption_logs', 'loyalty_discounts', 'loyalty_cards',
  'shopping_items', 'receipts', 'inventory_items', 'family_invites', 'household_members',
];
const BUCKET = ['product_images', 'receipts'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await guard(req, res);
  if (!user) return;

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: 'Configurazione server mancante.' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const uid = user.id;

  try {
    for (const tabella of TABELLE_UTENTE) {
      const { error } = await admin.from(tabella).delete().eq('user_id', uid);
      if (error) console.warn(`deleteAccount ${tabella}:`, error.message);
    }
    // Il frigo personale ha id = user id; se ne era l'unico membro sparisce con lui.
    const { error: errHousehold } = await admin.from('households').delete().eq('id', uid);
    if (errHousehold) console.warn('deleteAccount households:', errHousehold.message);

    for (const bucket of BUCKET) {
      const { data: files } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
      if (files?.length) {
        await admin.storage.from(bucket).remove(files.map(f => `${uid}/${f.name}`));
      }
    }

    const { error: errAuth } = await admin.auth.admin.deleteUser(uid);
    if (errAuth) throw errAuth;

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('deleteAccount:', error);
    return res.status(500).json({ error: 'Impossibile eliminare l\'account.', details: error.message });
  }
}

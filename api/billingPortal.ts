import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard } from '../lib/guard.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Cambio piano, cambio carta e disdetta li gestisce Stripe dal suo portale:
// e' un flusso che non ha senso riscrivere, e sbagliarlo costa addebiti doppi.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const utente = await guard(req, res);
  if (!utente) return;

  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) {
    return res.status(503).json({ error: 'I pagamenti non sono ancora attivi.' });
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const householdId = (utente.user_metadata?.family_id as string) || utente.id;
  const { data: household } = await supabase
    .from('households')
    .select('id, stripe_customer_id')
    .eq('id', householdId)
    .maybeSingle();

  if (!household?.stripe_customer_id) {
    return res.status(400).json({ error: 'Nessun abbonamento da gestire.' });
  }

  try {
    const stripe = new Stripe(chiave);
    const sessione = await stripe.billingPortal.sessions.create({
      customer: household.stripe_customer_id,
      return_url: `https://${req.headers.host}/pro`,
      locale: 'it',
    });
    return res.status(200).json({ url: sessione.url });
  } catch (errore: any) {
    console.error('Stripe portal:', errore);
    return res.status(500).json({ error: 'Impossibile aprire la gestione abbonamento.' });
  }
}

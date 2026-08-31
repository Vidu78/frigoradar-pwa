import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard } from '../lib/guard.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const utente = await guard(req, res);
  if (!utente) return;

  const chiave = process.env.STRIPE_SECRET_KEY;
  const prezzoMensile = process.env.STRIPE_PRICE_MONTHLY;
  const prezzoAnnuale = process.env.STRIPE_PRICE_YEARLY;

  if (!chiave || !prezzoMensile) {
    console.error('Stripe non configurato: manca STRIPE_SECRET_KEY o STRIPE_PRICE_MONTHLY');
    return res.status(503).json({ error: 'I pagamenti non sono ancora attivi.' });
  }

  const annuale = req.body?.piano === 'annuale';
  const prezzo = annuale ? prezzoAnnuale : prezzoMensile;
  if (!prezzo) {
    return res.status(503).json({ error: 'Piano non disponibile.' });
  }

  // La household e' quella che l'utente sta guardando, ma solo se ne fa parte:
  // la select passa dalla RLS, quindi un id altrui non restituisce nulla.
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

  if (!household) {
    return res.status(400).json({ error: 'Nessun frigo associato a questo account.' });
  }

  const stripe = new Stripe(chiave);
  const origine = `https://${req.headers.host}`;

  try {
    const sessione = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: prezzo, quantity: 1 }],
      customer: household.stripe_customer_id || undefined,
      customer_email: household.stripe_customer_id ? undefined : utente.email,
      // Il webhook si fida solo di questo: l'id non passa mai dal client.
      metadata: { household_id: household.id },
      subscription_data: { metadata: { household_id: household.id } },
      success_url: `${origine}/pro?pagamento=ok`,
      cancel_url: `${origine}/pro?pagamento=annullato`,
      locale: 'it',
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: sessione.url });
  } catch (errore: any) {
    console.error('Stripe checkout:', errore);
    return res.status(500).json({ error: 'Impossibile aprire il pagamento.' });
  }
}

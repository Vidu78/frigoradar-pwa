import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Il piano lo decide solo questo file, e solo dopo aver verificato la firma di
// Stripe: e' l'unico punto autorizzato a scrivere households.plan.
export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function corpoGrezzo(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pezzi: Buffer[] = [];
    req.on('data', (c) => pezzi.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(pezzi)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const chiave = process.env.STRIPE_SECRET_KEY;
  const segretoWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  if (!chiave || !segretoWebhook || !SERVICE_KEY) {
    console.error('Webhook non configurato: mancano chiavi Stripe o service role Supabase');
    return res.status(503).json({ error: 'Non configurato.' });
  }

  const stripe = new Stripe(chiave);
  const firma = req.headers['stripe-signature'];

  let evento: Stripe.Event;
  try {
    const grezzo = await corpoGrezzo(req);
    evento = stripe.webhooks.constructEvent(grezzo, String(firma), segretoWebhook);
  } catch (errore: any) {
    // Firma non valida: qualcuno sta provando a regalarsi il PRO.
    console.error('Firma webhook non valida:', errore.message);
    return res.status(400).json({ error: 'Firma non valida.' });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const aggiorna = async (householdId: string, campi: Record<string, unknown>) => {
    const { error } = await supabase.from('households').update(campi).eq('id', householdId);
    if (error) console.error('Aggiornamento household fallito:', error);
  };

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const s = evento.data.object as Stripe.Checkout.Session;
        const householdId = s.metadata?.household_id;
        if (householdId) {
          await aggiorna(householdId, {
            plan: 'pro',
            pro_since: new Date().toISOString(),
            stripe_customer_id: typeof s.customer === 'string' ? s.customer : null,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = evento.data.object as Stripe.Subscription;
        const householdId = sub.metadata?.household_id;
        // 'active' e 'trialing' valgono PRO; tutto il resto (past_due, unpaid,
        // canceled) torna free: chi non paga non resta dentro.
        const attivo = sub.status === 'active' || sub.status === 'trialing';
        if (householdId) await aggiorna(householdId, { plan: attivo ? 'pro' : 'free' });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = evento.data.object as Stripe.Subscription;
        const householdId = sub.metadata?.household_id;
        if (householdId) await aggiorna(householdId, { plan: 'free' });
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (errore: any) {
    console.error('Webhook Stripe:', errore);
    return res.status(500).json({ error: 'Errore interno.' });
  }
}

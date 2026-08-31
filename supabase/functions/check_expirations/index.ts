import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.4'

// Configura Web Push con le chiavi VAPID
// Queste chiavi devono essere impostate come secrets in Supabase:
// supabase secrets set VAPID_PUBLIC_KEY=...
// supabase secrets set VAPID_PRIVATE_KEY=...
// supabase secrets set VAPID_SUBJECT=mailto:tua@email.com
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@frigoradar.com';

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

serve(async (_req) => {
  try {
    // Inizializza Supabase client con service_role per bypassare RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Trova i prodotti che scadranno nei prossimi 2 giorni o sono già scaduti
    // ma non sono ancora stati "notificati" oggi (per evitare spam, semplifichiamo inviando a tutti quelli in scadenza)
    const today = new Date();
    const inTwoDays = new Date();
    inTwoDays.setDate(today.getDate() + 2);
    const dateStr = inTwoDays.toISOString().split('T')[0];

    // Prendiamo gli item in scadenza (location = FRIDGE o PANTRY, il FREEZER scade tardi)
    // Senza questo filtro lo stesso prodotto verrebbe rinotificato a ogni giro,
    // e in due giorni l'utente disattiva le notifiche.
    const soglia = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, user_id, custom_name, expiration_date')
      .lte('expiration_date', dateStr)
      .not('expiration_date', 'is', null)
      .or(`last_notified_at.is.null,last_notified_at.lt.${soglia}`);

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: "Nessun prodotto in scadenza." }), { headers: { "Content-Type": "application/json" } });
    }

    // Raggruppa per utente
    const itemsByUser = items.reduce((acc, item) => {
      if (!acc[item.user_id]) acc[item.user_id] = [];
      acc[item.user_id].push(item);
      return acc;
    }, {});

    const userIds = Object.keys(itemsByUser);

    // 2. Prendi le sottoscrizioni push per questi utenti
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "Nessuna sottoscrizione trovata per gli utenti con prodotti in scadenza." }), { headers: { "Content-Type": "application/json" } });
    }

    // 3. Invia notifiche push
    let successCount = 0;
    let failCount = 0;
    const notificati: string[] = [];

    const promises = subscriptions.map(async (sub) => {
      const userItems = itemsByUser[sub.user_id];
      const itemCount = userItems.length;
      
      const title = "FrigoRadar: Scadenze in arrivo! 🚨";
      const body = `Hai ${itemCount} prodott${itemCount > 1 ? 'i' : 'o'} in scadenza, tra cui: ${userItems[0].custom_name}. Controlla subito per evitare sprechi!`;

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      const payload = JSON.stringify({
        title,
        body,
        url: '/'
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
        for (const it of userItems) notificati.push(it.id);
      } catch (err: any) {
        console.error("Errore invio notifica:", err);
        // Se la sottoscrizione è scaduta (410), eliminala dal DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        failCount++;
      }
    });

    await Promise.all(promises);

    // Si segna solo cio' che e' partito davvero: se l'invio fallisce, riprova domani.
    if (notificati.length > 0) {
      await supabase
        .from('inventory_items')
        .update({ last_notified_at: new Date().toISOString() })
        .in('id', notificati);
    }

    return new Response(
      JSON.stringify({ message: `Notifiche inviate: ${successCount} con successo, ${failCount} fallite, ${notificati.length} prodotti segnati.` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Errore generico:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

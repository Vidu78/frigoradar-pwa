# Changelog

Release Android (Google Play, test chiuso) e web app `app.frigoradar.it`.
La TWA carica sempre la web app live: le modifiche web arrivano ai tester al primo
riavvio, la release Play serve a Google per vedere il ciclo feedback → aggiornamento.

## 1.2.0 (versionCode 3) — 22/09/2026

Le notifiche di scadenza non erano mai partite per nessun utente, da sempre. Due cause
indipendenti, verificate sul codice e sulla app live il 22/09/2026, entrambe chiuse qui.
La catena e' stata provata fino in fondo su produzione: iscrizione push reale da browser,
invio, esito `Notifiche inviate: 1 con successo, 0 fallite`.

| Problema | Modifica |
|---|---|
| Le notifiche di scadenza non arrivano mai, su nessun dispositivo | La edge function `check_expirations` era deployata su Supabase ma **non la chiamava nessuno**: non esisteva alcuno scheduler. Aggiunta la rotta `api/cronNotifiche.ts` e la voce `crons` in `vercel.json` (07:00 UTC), protetta da `CRON_SECRET` |
| Sul telefono Android non arriva niente nemmeno attivando le notifiche | La TWA aveva `enableNotifications: false` e il manifest non dichiarava `POST_NOTIFICATIONS`: su Android 13+ le notifiche sono bloccate in silenzio. Attivata la delega (`twa-manifest.json`) e aggiunto il permesso (`app/src/main/AndroidManifest.xml`) |
| La ricetta con lo Chef AI risponde "Errore del server" | Google rispondeva `503 high demand` su `gemini-3.6-flash` e l'endpoint mollava al primo colpo, dopo aver gia' consumato il credito settimanale. Aggiunta `lib/gemini.ts` con riprova e catena di modelli di riserva, piu' `refund_ai_credit` che restituisce il credito se l'invio fallisce |
| La ricetta ci mette oltre un minuto | Il piano gratuito Gemini mette le richieste in coda: da ~70s a ~6s attivando la fatturazione. I token e la latenza di ogni chiamata finiscono ora nei log |
| Quando l'AI e' occupata compare un errore tecnico con dentro i nomi dei modelli | La function risponde `503` e la app mostra "riprova tra qualche minuto, il credito non e' perso", in tutte e 10 le lingue |
| Sotto ogni ricetta gira una rotella che non finisce mai | La foto del piatto era bloccata dalla CSP (`image.pollinations.ai` non era fra gli `img-src`): l'immagine restava nascosta e il fallback sotto non spariva. Host ammesso e i tre stati della foto ora si escludono |
| Le indicazioni su come usare la app ricompaiono a ogni accesso | Il tutorial era duplicato in `App.tsx` e `Dashboard.tsx`, e la copia in `App.tsx` partiva su qualunque schermata puntando a bersagli inesistenti. Rimossa; il "gia' visto" e' passato sull'account, non piu' solo sul telefono |
| La barra in basso e' sfalsata: due icone da una parte, tre dall'altra | Erano due gruppi separati con spaziature indipendenti. Ora e' una lista sola, tre voci per lato, e il **Frigo condiviso** e' raggiungibile dalla barra invece che solo dal Profilo |
| La notifica avvisa e basta | Ora propone di cucinare cio' che sta scadendo e porta con un tocco allo Chef AI (`/?tab=recipes`) |
| Icona del sito e anteprime mancanti | `favicon.ico`, `apple-touch-icon.png`, `robots.txt` e `sitemap.xml` non esistevano: la riscrittura SPA rispondeva `index.html` con status 200 al posto loro |
| (sicurezza) La prova di 7 giorni e' illimitata e la registrazione non chiede conferma email | Con una casella usa-e-getta si ottenevano 7 giorni di AI senza tetto, a spese del progetto. Aggiunto un tetto giornaliero di sicurezza (30 ricette, 100 scansioni) valido anche per prova e PRO |
| (accessibilita') L'interruttore delle notifiche non ha un nome | Era un bottone senza testo: invisibile a TalkBack. Aggiunti `role="switch"`, `aria-checked` e `aria-label` |

## 1.1.0 (versionCode 2) — 11/09/2026

Problemi verificati sul codice e sulla app live l'11/09/2026. Per il questionario Play
incrociare con le righe reali di `feedback_tester` (dashboard Supabase) e citare le parole dei tester.

| Problema | Modifica |
|---|---|
| Aperta senza rete (metropolitana, cantina) la app mostra la pagina di errore di Chrome | Il service worker ora precachea la app (47 file) e serve l'ultimo inventario visto (`src/sw.ts`, `vite.config.ts`); striscia "Sei offline" in cima (`OfflineBanner.tsx`) |
| Il pulsante "Aggiorna" dell'avviso di nuova versione non faceva niente | Il SW non gestiva `SKIP_WAITING`: aggiunto handler + `clientsClaim` |
| Nella app Android resta la barra degli indirizzi di Chrome | `/.well-known/assetlinks.json` pubblicato con l'impronta della chiave (Digital Asset Links) |
| Avviso di aggiornamento solo in italiano | Testi in `common.update_*`, tradotti nelle 10 lingue |
| Cambiando lingua molte schermate restano in italiano (login, onboarding, profilo, scontrino, ricette, frigo condiviso, PRO, feedback) e i prodotti non si traducono | Tutta la UI passa da i18n (499 chiavi × 10 lingue); categorie e giudizi salute tradotti a schermo (`utils/labels.ts`), frutta/verdura per chiave, nome prodotto OpenFoodFacts nella lingua dell'utente, prompt Gemini con la lingua dell'app (`lib/lingua.ts`) |
| Serve un modo per mandare segnalazioni senza uscire dalla app | Pagina pubblica `/feedback` con versione e modello device (già live dal 02/09) |
| Come cancello account e dati? | Pagina pubblica `/elimina-account` (già live dal 02/09); il pulsante **Elimina account** in Profilo → Impostazioni ora cancella davvero tutto (`/api/deleteAccount`: dati, foto, utente) con conferma; **Esporta dati (CSV)** scarica l'inventario |

Note tecniche:
- la cache dati (`frigoradar-data`) viene svuotata al logout per non mostrare il frigo di un altro account sullo stesso telefono;
- foto prodotto OpenFoodFacts e font Inter in cache runtime;
- nessuna nuova permission Android; `targetSdk 36`, `orientation any`.

## 1.0.0 (versionCode 1) — 02/09/2026

Prima build TWA (`it.frigoradar.twa`) per il test chiuso: inventario frigo/freezer/dispensa,
scanner barcode, scontrino con AI, ricette Chef AI, lista spesa, frigo condiviso, carte fedeltà,
10 lingue. Checkout Stripe nascosto dentro la app Android (norme Play Billing).

# Changelog

Release Android (Google Play, test chiuso) e web app `app.frigoradar.it`.
La TWA carica sempre la web app live: le modifiche web arrivano ai tester al primo
riavvio, la release Play serve a Google per vedere il ciclo feedback → aggiornamento.

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
| Come cancello account e dati? | Pagina pubblica `/elimina-account` (già live dal 02/09) |

Note tecniche:
- la cache dati (`frigoradar-data`) viene svuotata al logout per non mostrare il frigo di un altro account sullo stesso telefono;
- foto prodotto OpenFoodFacts e font Inter in cache runtime;
- nessuna nuova permission Android; `targetSdk 36`, `orientation any`.

## 1.0.0 (versionCode 1) — 02/09/2026

Prima build TWA (`it.frigoradar.twa`) per il test chiuso: inventario frigo/freezer/dispensa,
scanner barcode, scontrino con AI, ricette Chef AI, lista spesa, frigo condiviso, carte fedeltà,
10 lingue. Checkout Stripe nascosto dentro la app Android (norme Play Billing).

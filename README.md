# FrigoRadar

PWA per gestire il frigorifero: inventario con scadenze, lettura degli scontrini
e delle etichette con l'AI, ricette anti-spreco, frigo condiviso in famiglia e
portafoglio delle carte fedeltà.

React 19 + TypeScript + Vite, Supabase per auth e dati, Gemini dietro funzioni
serverless su Vercel.

## Requisiti

- Node 20+
- Un progetto [Supabase](https://supabase.com)
- Una API key [Google AI Studio](https://aistudio.google.com/apikey) per Gemini

## Avvio

```sh
npm install
cp .env.example .env   # poi riempi i valori
npm run dev
```

### Variabili d'ambiente

`.env` (client, finiscono nel bundle — usa solo chiavi pubbliche):

| Variabile | Dove si trova |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | idem, chiave `anon` `public` |
| `VITE_VAPID_PUBLIC_KEY` | generata con `npx web-push generate-vapid-keys` |

Su Vercel (server, mai nel bundle):

| Variabile | A cosa serve |
|---|---|
| `GEMINI_API_KEY` | chiamate a Gemini dagli handler in `api/` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | verifica del JWT in `lib/guard.ts` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | checkout e webhook abbonamenti |

Secrets della edge function (`supabase secrets set`):
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Database

Lo schema vive in `supabase/migrations/`, da eseguire **in ordine** nell'SQL
editor o con `supabase db push`.

Quattro tabelle (`loyalty_cards`, `loyalty_discounts`, `receipts`,
`product_images`) sono nate a mano dalla dashboard e non sono versionate:
recuperale con `supabase db pull` prima di toccarle.

## Comandi

| | |
|---|---|
| `npm run dev` | server di sviluppo |
| `npm run build` | typecheck + build di produzione + service worker |
| `npm run lint` | oxlint |
| `npm run preview` | serve la build locale |

Il service worker è generato solo dalla build: in `dev` non c'è precache né
prompt di aggiornamento. **Per provare installazione, offline e aggiornamento
serve `npm run build && npm run preview`**, non `npm run dev`.

## Struttura

```
api/              handler serverless Vercel (Gemini)
lib/guard.ts      verifica del JWT Supabase e crediti, condivisa dagli handler
src/pages/        una schermata per file, caricate con React.lazy da App.tsx
src/components/   modali e componenti condivisi
src/store/        stato Zustand (auth, inventario, spesa, fedeltà, toast)
src/i18n/         10 lingue; l'italiano è nel bundle, le altre su richiesta
src/sw.ts         service worker: precache, app shell, notifiche push
supabase/
  migrations/     schema versionato
  functions/      edge function per le notifiche di scadenza
scripts/          utilità (generazione icone PWA)
```

## Deploy

Push su `main` → Vercel builda e pubblica. **Prima** di deployare codice che
introduce migration, esegui le migration: il client si aspetta lo schema nuovo.

La edge function si ridistribuisce a parte:

```sh
supabase functions deploy check_expirations
```

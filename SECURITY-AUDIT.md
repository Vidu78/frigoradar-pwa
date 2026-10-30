# Security audit — checklist 20 punti

## 31/10/2026 — release 1.3.0 (azioni anti-spreco nella scheda prodotto)

Perimetro della modifica: solo client. Nuove scritture `update` su `inventory_items`
(scadenza, posizione, `is_frozen`) e `insert` su `shopping_items`, entrambe gia' coperte
dalle policy esistenti. Nessuna tabella, endpoint, bucket o dipendenza nuova.

| # | Punto | Esito |
|---|---|---|
| 1 | Niente chiavi private nel frontend | OK — grep `service_role/sk_/whsec_/GEMINI_API_KEY` su `src/` e `dist/`: zero |
| 2 | Niente segreti nella cronologia git | OK — `git log -p --all` senza pattern `sk_live/sk_test/whsec_/AIza`; `.env*` in `.gitignore` |
| 3 | Solo chiavi pubbliche nel client | OK — solo `VITE_SUPABASE_URL/ANON_KEY` |
| 4 | RLS attiva | OK — invariata (`20260830_household_rls.sql`) |
| 5 | Dati sensibili cifrati | OK — HTTPS + cifratura provider; nessun dato sensibile nuovo |
| 6 | Auth forzata lato server | OK — le nuove scritture passano da PostgREST con JWT |
| 7 | Accesso solo ai propri record | OK — update `inventory_items` filtrato da `is_household_member(family_id)` |
| 8 | Campi sensibili non modificabili | OK — `households.plan` resta scrivibile solo dal service role |
| 9 | Sessioni | OK — gestite da Supabase Auth |
| 10 | Hash password | OK — Supabase Auth |
| 11 | Rate limit login | OK — limiti Supabase Auth (anonimi 30/ora per IP) |
| 12 | Anti abuso | OK — invariato: tetto giornaliero AI + guard su endpoint AI |
| 13 | Query parametrizzate | OK — query builder supabase-js |
| 14 | Validazione server | OK — date calcolate in client ma tipizzate `date` nel DB |
| 15 | Contenuti utente non affidabili | OK — nessun `innerHTML` con dati utente (unico `dangerouslySetInnerHTML` = maschera SVG statica del tutorial) |
| 16 | Upload | N.A. — nessun upload nuovo |
| 17 | API con dati minimi | OK — nessuna lettura nuova |
| 18 | Header sicurezza | OK — HSTS, nosniff, `X-Frame-Options: DENY`, CSP, Referrer-Policy, Permissions-Policy verificati live |
| 19 | HTTPS forzato | OK — HSTS 2 anni |
| 20 | Dipendenze | OK — `npm audit --omit=dev`: 0 vulnerabilita' |

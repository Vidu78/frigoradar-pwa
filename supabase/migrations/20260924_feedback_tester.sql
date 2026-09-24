-- FrigoRadar: la tabella delle segnalazioni dei tester non era MAI stata creata.
-- La pagina /feedback scriveva su public.feedback_tester e riceveva PGRST205
-- ("Could not find the table"): ogni tester vedeva un errore e la segnalazione
-- andava persa. E' il canale di feedback che Play chiede di dimostrare.
-- Idempotente.

create table if not exists public.feedback_tester (
  id            uuid primary key default gen_random_uuid(),
  voto          smallint check (voto between 1 and 5),
  telefono      text check (length(telefono) <= 120),
  registrazione text check (length(registrazione) <= 2000),
  barcode       text check (length(barcode) <= 2000),
  notifiche     text check (length(notifiche) <= 2000),
  ricette       text check (length(ricette) <= 2000),
  problemi      text check (length(problemi) <= 2000),
  confusione    text check (length(confusione) <= 2000),
  desideri      text check (length(desideri) <= 2000),
  contatto      text check (length(contatto) <= 200),
  -- Chi risponde spesso non sa dire versione e modello: li prende la pagina.
  versione      text check (length(versione) <= 60),
  device        text check (length(device) <= 300),
  created_at    timestamptz not null default now()
);

alter table public.feedback_tester enable row level security;

-- La pagina /feedback e' pubblica: chiunque puo' scrivere, nessuno puo' rileggere.
-- Dentro ci sono contatti personali: si leggono solo dalla dashboard Supabase.
drop policy if exists "chiunque puo' segnalare" on public.feedback_tester;
create policy "chiunque puo' segnalare" on public.feedback_tester
  for insert to anon, authenticated with check (true);

revoke select, update, delete on public.feedback_tester from anon, authenticated;
grant insert on public.feedback_tester to anon, authenticated;

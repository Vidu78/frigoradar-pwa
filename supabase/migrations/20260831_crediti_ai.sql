-- FrigoRadar - Blocco 5: piano free a crediti settimanali
-- Il conteggio vive nel database e si consuma con una funzione security definer:
-- il client puo' solo leggere il residuo, non riscriverlo.
-- Idempotente.

alter table public.households
  add column if not exists ai_scans_week   int  not null default 0,
  add column if not exists ai_recipes_week int  not null default 0,
  add column if not exists week_start      date not null default date_trunc('week', now())::date,
  add column if not exists trial_until     timestamptz;

-- Chi c'e' gia' riceve i 7 giorni di prova da adesso
update public.households
set trial_until = now() + interval '7 days'
where trial_until is null;

-- I nuovi iscritti partono con la prova attiva
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.households (id, name, trial_until)
  values (new.id, 'Casa', now() + interval '7 days')
  on conflict (id) do nothing;
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.id, 'admin')
  on conflict (household_id, user_id) do nothing;
  return new;
end;
$fn$;

-- Consuma un credito e dice se l'operazione e' permessa.
-- kind: 'scan' (foto prodotto o scontrino) oppure 'recipe'.
create or replace function public.consume_ai_credit(kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  hid       uuid;
  h         public.households%rowtype;
  limite    int;
  usati     int;
  settimana date := date_trunc('week', now())::date;
begin
  -- la household "corrente" arriva dal metadata, ma vale solo se ne fai parte
  hid := coalesce((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid());
  if not exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  ) then
    hid := auth.uid();
  end if;

  select * into h from public.households where id = hid for update;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_household');
  end if;

  -- nuova settimana: il contatore riparte
  if h.week_start is distinct from settimana then
    update public.households
    set week_start = settimana, ai_scans_week = 0, ai_recipes_week = 0
    where id = hid;
    h.ai_scans_week := 0;
    h.ai_recipes_week := 0;
  end if;

  -- PRO e prova: nessun limite
  if h.plan = 'pro' or (h.trial_until is not null and h.trial_until > now()) then
    return jsonb_build_object('allowed', true, 'unlimited', true);
  end if;

  if kind = 'recipe' then
    limite := 1;  usati := h.ai_recipes_week;
  else
    limite := 5;  usati := h.ai_scans_week;
  end if;

  if usati >= limite then
    return jsonb_build_object(
      'allowed', false, 'reason', 'quota', 'limit', limite,
      'resets_at', (settimana + interval '7 days')
    );
  end if;

  if kind = 'recipe' then
    update public.households set ai_recipes_week = ai_recipes_week + 1 where id = hid;
  else
    update public.households set ai_scans_week = ai_scans_week + 1 where id = hid;
  end if;

  return jsonb_build_object('allowed', true, 'remaining', limite - usati - 1);
end;
$fn$;

revoke all on function public.consume_ai_credit(text) from public;
grant execute on function public.consume_ai_credit(text) to authenticated;

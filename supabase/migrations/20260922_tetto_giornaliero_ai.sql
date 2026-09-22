-- FrigoRadar: tetto giornaliero di sicurezza sulle chiamate AI.
-- Prova e PRO restano "illimitati" per l'utente vero, ma nessuno puo' tenere
-- aperto il rubinetto: la registrazione non chiede conferma email, quindi con
-- una casella usa-e-getta si ottengono 7 giorni di AI senza limiti.
-- Numeri scelti larghi: un utente onesto non li vede mai.
-- Idempotente.

alter table public.households
  add column if not exists ai_day           date not null default current_date,
  add column if not exists ai_recipes_day   int  not null default 0,
  add column if not exists ai_scans_day     int  not null default 0;

create or replace function public.consume_ai_credit(kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  hid          uuid;
  h            public.households%rowtype;
  limite       int;
  usati        int;
  settimana    date := date_trunc('week', now())::date;
  oggi         date := current_date;
  tetto_giorno int;
  usati_oggi   int;
  illimitato   boolean;
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

  -- nuovo giorno: riparte anche il tetto di sicurezza
  if h.ai_day is distinct from oggi then
    update public.households
    set ai_day = oggi, ai_recipes_day = 0, ai_scans_day = 0
    where id = hid;
    h.ai_recipes_day := 0;
    h.ai_scans_day := 0;
  end if;

  if kind = 'recipe' then
    tetto_giorno := 30;  usati_oggi := h.ai_recipes_day;
  else
    tetto_giorno := 100; usati_oggi := h.ai_scans_day;
  end if;

  -- Il tetto vale per tutti, PRO compresi: e' un freno all'abuso, non un piano.
  if usati_oggi >= tetto_giorno then
    return jsonb_build_object(
      'allowed', false, 'reason', 'daily_cap', 'limit', tetto_giorno,
      'resets_at', (oggi + 1)
    );
  end if;

  illimitato := h.plan = 'pro' or (h.trial_until is not null and h.trial_until > now());

  if not illimitato then
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
  end if;

  if kind = 'recipe' then
    update public.households
    set ai_recipes_week = ai_recipes_week + 1, ai_recipes_day = ai_recipes_day + 1
    where id = hid;
  else
    update public.households
    set ai_scans_week = ai_scans_week + 1, ai_scans_day = ai_scans_day + 1
    where id = hid;
  end if;

  if illimitato then
    return jsonb_build_object('allowed', true, 'unlimited', true);
  end if;
  return jsonb_build_object('allowed', true, 'remaining', limite - usati - 1);
end;
$fn$;

-- Il rimborso tocca anche il contatore giornaliero, altrimenti un 503 di Google
-- consuma comunque il tetto di sicurezza.
create or replace function public.refund_ai_credit(kind text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  hid       uuid;
  settimana date := date_trunc('week', now())::date;
  oggi      date := current_date;
begin
  hid := coalesce((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid());
  if not exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  ) then
    hid := auth.uid();
  end if;

  if kind = 'recipe' then
    update public.households
    set ai_recipes_week = case when week_start = settimana
                               then greatest(ai_recipes_week - 1, 0) else ai_recipes_week end,
        ai_recipes_day  = case when ai_day = oggi
                               then greatest(ai_recipes_day - 1, 0) else ai_recipes_day end
    where id = hid;
  else
    update public.households
    set ai_scans_week = case when week_start = settimana
                             then greatest(ai_scans_week - 1, 0) else ai_scans_week end,
        ai_scans_day  = case when ai_day = oggi
                             then greatest(ai_scans_day - 1, 0) else ai_scans_day end
    where id = hid;
  end if;
end;
$fn$;

revoke all on function public.consume_ai_credit(text) from public;
grant execute on function public.consume_ai_credit(text) to authenticated;
revoke all on function public.refund_ai_credit(text) from public;
grant execute on function public.refund_ai_credit(text) to authenticated;

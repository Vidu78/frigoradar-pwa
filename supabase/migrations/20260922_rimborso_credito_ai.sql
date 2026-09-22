-- FrigoRadar: rimborso del credito AI quando Gemini fallisce dopo il consumo.
-- Speculare a consume_ai_credit: stessa household, stessa settimana, mai sotto zero.
-- Idempotente.

create or replace function public.refund_ai_credit(kind text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  hid       uuid;
  settimana date := date_trunc('week', now())::date;
begin
  hid := coalesce((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid());
  if not exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  ) then
    hid := auth.uid();
  end if;

  -- se nel frattempo e' scattata la settimana nuova non c'e' nulla da restituire
  if kind = 'recipe' then
    update public.households
    set ai_recipes_week = greatest(ai_recipes_week - 1, 0)
    where id = hid and week_start = settimana;
  else
    update public.households
    set ai_scans_week = greatest(ai_scans_week - 1, 0)
    where id = hid and week_start = settimana;
  end if;
end;
$fn$;

revoke all on function public.refund_ai_credit(text) from public;
grant execute on function public.refund_ai_credit(text) to authenticated;

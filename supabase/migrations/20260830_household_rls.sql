-- FrigoRadar - Blocco 1: RLS basata su appartenenza reale, non su user_metadata
-- user_metadata e' scrivibile dall'utente (auth.updateUser), quindi ogni policy
-- che lo usava era aggirabile. Fonte di verita': household_members.
-- Idempotente: si puo' rilanciare senza danni.

-- 1. Vincoli e struttura ------------------------------------------------------

create unique index if not exists household_members_pk
  on public.household_members (household_id, user_id);

create index if not exists household_members_user_idx
  on public.household_members (user_id);

alter table public.family_invites
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days');

create unique index if not exists family_invites_code_key
  on public.family_invites (code);

-- 2. Backfill: una household per utente, piu' quelle gia' condivise -----------

insert into public.households (id, name)
select u.id, 'Casa'
from auth.users u
on conflict (id) do nothing;

-- household_id storici presenti nei dati ma senza riga in households
insert into public.households (id, name)
select distinct i.family_id, 'Casa'
from public.inventory_items i
where i.family_id is not null
on conflict (id) do nothing;

-- ognuno e' owner della propria household
insert into public.household_members (household_id, user_id, role)
select u.id, u.id, 'owner'
from auth.users u
on conflict (household_id, user_id) do nothing;

-- chi era gia' in condivisione tramite metadata mantiene l'accesso
insert into public.household_members (household_id, user_id, role)
select (u.raw_user_meta_data ->> 'family_id')::uuid, u.id, 'member'
from auth.users u
where u.raw_user_meta_data ->> 'family_id' is not null
  and (u.raw_user_meta_data ->> 'family_id') <> u.id::text
  and exists (select 1 from public.households h
              where h.id = (u.raw_user_meta_data ->> 'family_id')::uuid)
on conflict (household_id, user_id) do nothing;

-- 3. Helper: sono membro di questa household? --------------------------------
-- security definer per non innescare ricorsione nelle policy.

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$fn$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

-- 4. Si entra in una famiglia solo con un codice valido ----------------------

create or replace function public.join_household(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  target uuid;
begin
  select family_id into target
  from public.family_invites
  where code = invite_code and expires_at > now();

  if target is null then
    raise exception 'Codice invito non valido o scaduto';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  delete from public.family_invites where code = invite_code;

  return target;
end;
$fn$;

revoke all on function public.join_household(text) from public;
grant execute on function public.join_household(text) to authenticated;

-- uscire dalla famiglia: cancella la propria appartenenza, mai quella altrui
create or replace function public.leave_household(hid uuid)
returns void
language sql
security definer
set search_path = public
as $fn$
  delete from public.household_members
  where household_id = hid and user_id = auth.uid() and role <> 'owner';
$fn$;

revoke all on function public.leave_household(uuid) from public;
grant execute on function public.leave_household(uuid) to authenticated;

-- 5. Nuovi iscritti: household creata automaticamente ------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.households (id, name) values (new.id, 'Casa')
  on conflict (id) do nothing;
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.id, 'owner')
  on conflict (household_id, user_id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Via tutte le policy vecchie ---------------------------------------------

do $mig$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('inventory_items','shopping_items','consumption_logs',
                        'family_invites','loyalty_cards','loyalty_discounts',
                        'products','households','household_members','receipts','recipes')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $mig$;

-- 7. Policy nuove -------------------------------------------------------------

-- households: leggibile dai membri, il piano lo scrive solo il service role
create policy "Members read household" on public.households
  for select using (public.is_household_member(id));
create policy "Only service role updates household" on public.households
  for update using (auth.role() = 'service_role');

-- household_members: vedo i membri delle mie household, nessun insert dal client
create policy "Members read members" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "Members leave" on public.household_members
  for delete using (user_id = auth.uid() and role <> 'owner');

-- inventario, spesa e consumi: appartenenza reale
create policy "Household reads inventory" on public.inventory_items
  for select using (public.is_household_member(family_id));
create policy "Household writes inventory" on public.inventory_items
  for insert with check (public.is_household_member(family_id) and user_id = auth.uid());
create policy "Household updates inventory" on public.inventory_items
  for update using (public.is_household_member(family_id))
  with check (public.is_household_member(family_id));
create policy "Household deletes inventory" on public.inventory_items
  for delete using (public.is_household_member(family_id));

create policy "Household reads shopping" on public.shopping_items
  for select using (public.is_household_member(family_id));
create policy "Household writes shopping" on public.shopping_items
  for insert with check (public.is_household_member(family_id) and user_id = auth.uid());
create policy "Household updates shopping" on public.shopping_items
  for update using (public.is_household_member(family_id))
  with check (public.is_household_member(family_id));
create policy "Household deletes shopping" on public.shopping_items
  for delete using (public.is_household_member(family_id));

create policy "Household reads logs" on public.consumption_logs
  for select using (public.is_household_member(family_id));
create policy "Household writes logs" on public.consumption_logs
  for insert with check (public.is_household_member(family_id) and user_id = auth.uid());

-- carte fedelta': ora visibili a tutta la famiglia (prima solo al titolare)
create policy "Household reads cards" on public.loyalty_cards
  for select using (user_id = auth.uid() or public.is_household_member(family_id));
create policy "Household writes cards" on public.loyalty_cards
  for insert with check (user_id = auth.uid() and public.is_household_member(family_id));
create policy "Household updates cards" on public.loyalty_cards
  for update using (user_id = auth.uid() or public.is_household_member(family_id));
create policy "Household deletes cards" on public.loyalty_cards
  for delete using (user_id = auth.uid() or public.is_household_member(family_id));

create policy "Household reads discounts" on public.loyalty_discounts
  for select using (user_id = auth.uid() or public.is_household_member(family_id));
create policy "Household writes discounts" on public.loyalty_discounts
  for insert with check (user_id = auth.uid() and public.is_household_member(family_id));
create policy "Household updates discounts" on public.loyalty_discounts
  for update using (user_id = auth.uid() or public.is_household_member(family_id));
create policy "Household deletes discounts" on public.loyalty_discounts
  for delete using (user_id = auth.uid() or public.is_household_member(family_id));

-- inviti: niente piu' lettura globale dei codici
create policy "Household reads own invites" on public.family_invites
  for select using (public.is_household_member(family_id));
create policy "Household creates invites" on public.family_invites
  for insert with check (public.is_household_member(family_id));
create policy "Household deletes invites" on public.family_invites
  for delete using (public.is_household_member(family_id));

-- scontrini e ricette restano personali
create policy "Own receipts" on public.receipts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own recipes" on public.recipes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- catalogo prodotti: lettura pubblica, scrittura solo service role
create policy "Anyone reads products" on public.products
  for select using (true);
create policy "Only service role writes products" on public.products
  for all to service_role using (true) with check (true);

-- 8. Push: la upsert del client usa onConflict user_id, serve l'unicita' ------

delete from public.push_subscriptions a
using public.push_subscriptions b
where a.user_id = b.user_id and a.ctid < b.ctid;

create unique index if not exists push_subscriptions_user_key
  on public.push_subscriptions (user_id);

-- Horde War Room: update 9 — war parties.
-- Opens the War Room up to more people. Everyone signs up, then creates a war party or joins one
-- with an invite code. Each party only ever sees its own members' toons, bank and objectives.
-- Josh and Cel become the first party, with everything they already have.
--
-- Run once in Supabase > SQL Editor, AFTER taking a backup (Export backup, top right of the site).
-- Safe to run again.

-- ============================================================
-- 1. New tables
-- ============================================================

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- Who is in which party. A player can be in more than one (e.g. a duo with a mate and a guild).
create table if not exists party_members (
  party_id uuid not null references parties (id) on delete cascade,
  player_id text not null references players (id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (party_id, player_id)
);

-- Settings only the party leader can see: the Discord webhook is a secret (anyone with it can post).
create table if not exists party_secrets (
  party_id uuid primary key references parties (id) on delete cascade,
  discord_webhook_url text,
  discord_guild_id text      -- the Discord server ID, so the bot knows which party is asking
);

-- ============================================================
-- 2. Changes to existing tables
-- ============================================================

-- Objectives belong to a party. Assignee is now a player id, or 'everyone'.
alter table objectives add column if not exists party_id uuid references parties (id) on delete cascade;
alter table objectives add column if not exists updated_at timestamptz not null default now();
alter table objectives drop constraint if exists objectives_assignee_check;
update objectives set assignee = 'everyone' where assignee = 'both';

-- Toon names only need to be unique per player now (so nobody can "claim" someone else's name).
alter table characters drop constraint if exists characters_name_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'characters_player_name_key') then
    alter table characters add constraint characters_player_name_key unique (player_id, name);
  end if;
end $$;

-- Keep updated_at fresh, so a tick-off from the game never undoes a newer change on the website.
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists objectives_touch on objectives;
create trigger objectives_touch before update on objectives
  for each row execute function touch_updated_at();

-- ============================================================
-- 3. Josh and Cel become the first war party
-- ============================================================

-- A short code people can type, e.g. "K7Q2MX". No 0/O or 1/I so it's easy to read out on Discord.
create or replace function new_invite_code() returns text
language plpgsql volatile
as $$
declare
  letters constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(letters, 1 + floor(random() * length(letters))::int, 1);
    end loop;
    exit when not exists (select 1 from parties where invite_code = code);
  end loop;
  return code;
end $$;


do $$
declare first_party uuid;
begin
  if not exists (select 1 from parties) and exists (select 1 from players) then
    insert into parties (name, invite_code) values ('Horde War Room', new_invite_code())
    returning id into first_party;
    insert into party_members (party_id, player_id, role)
    select first_party, id, case when id = 'josh' then 'leader' else 'member' end from players;
    update objectives set party_id = first_party where party_id is null;
  end if;
end $$;

-- Every objective must belong to a party from now on.
delete from objectives where party_id is null;
alter table objectives alter column party_id set not null;

-- ============================================================
-- 4. Helper checks used by the security rules
-- ============================================================
-- "security definer" lets these look at the membership tables without tripping the rules themselves.

create or replace function my_player_id() returns text
language sql stable security definer set search_path = public
as $$
  select id from players where user_id = auth.uid();
$$;

-- True when I'm in this party.
create or replace function is_party_member(p_party uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from party_members where party_id = p_party and player_id = my_player_id());
$$;

create or replace function is_party_leader(p_party uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from party_members where party_id = p_party and player_id = my_player_id() and role = 'leader');
$$;

-- True when that player is me, or shares at least one party with me.
create or replace function shares_party(p_player text) returns boolean
language sql stable security definer set search_path = public
as $$
  select p_player = my_player_id() or exists (
    select 1 from party_members mine
    join party_members theirs on theirs.party_id = mine.party_id
    where mine.player_id = my_player_id() and theirs.player_id = p_player
  );
$$;

-- For tables hanging off a character: can I see it / is it mine?
create or replace function can_see_character(p_character uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from characters where id = p_character and shares_party(player_id));
$$;

create or replace function owns_character(p_character uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from characters where id = p_character and player_id = my_player_id());
$$;

-- ============================================================
-- 5. Security rules: see your parties, change only your own toons
-- ============================================================

alter table parties enable row level security;
alter table party_members enable row level security;
alter table party_secrets enable row level security;

-- Clear out the old "both players see everything" rules.
drop policy if exists "players can read players" on players;
drop policy if exists "players manage characters" on characters;
drop policy if exists "players manage professions" on professions;
drop policy if exists "players manage items" on items;
drop policy if exists "players manage history" on character_history;
drop policy if exists "players manage recipes" on recipes;
drop policy if exists "players manage bis" on bis_items;
drop policy if exists "players manage events" on events;
drop policy if exists "players manage objectives" on objectives;
drop function if exists is_player();

-- And any from an earlier run of this file.
drop policy if exists "see party players" on players;
drop policy if exists "rename myself" on players;
drop policy if exists "see my parties" on parties;
drop policy if exists "leader renames party" on parties;
drop policy if exists "see party members" on party_members;
drop policy if exists "leader manages secrets" on party_secrets;
drop policy if exists "see party toons" on characters;
drop policy if exists "add my toons" on characters;
drop policy if exists "change my toons" on characters;
drop policy if exists "remove my toons" on characters;
drop policy if exists "see party professions" on professions;
drop policy if exists "manage my professions" on professions;
drop policy if exists "see party items" on items;
drop policy if exists "manage my items" on items;
drop policy if exists "see party history" on character_history;
drop policy if exists "manage my history" on character_history;
drop policy if exists "see party recipes" on recipes;
drop policy if exists "manage my recipes" on recipes;
drop policy if exists "see party bis" on bis_items;
drop policy if exists "manage my bis" on bis_items;
drop policy if exists "see party events" on events;
drop policy if exists "add my events" on events;
drop policy if exists "party manages objectives" on objectives;

create policy "see party players" on players
  for select to authenticated using (shares_party(id));
create policy "rename myself" on players
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "see my parties" on parties
  for select to authenticated using (is_party_member(id));
create policy "leader renames party" on parties
  for update to authenticated using (is_party_leader(id)) with check (is_party_leader(id));

create policy "see party members" on party_members
  for select to authenticated using (is_party_member(party_id));

create policy "leader manages secrets" on party_secrets
  for all to authenticated using (is_party_leader(party_id)) with check (is_party_leader(party_id));

-- Toons: everyone in your parties can see them; only you can change yours.
create policy "see party toons" on characters
  for select to authenticated using (shares_party(player_id));
create policy "add my toons" on characters
  for insert to authenticated with check (player_id = my_player_id());
create policy "change my toons" on characters
  for update to authenticated using (player_id = my_player_id()) with check (player_id = my_player_id());
create policy "remove my toons" on characters
  for delete to authenticated using (player_id = my_player_id());

create policy "see party professions" on professions
  for select to authenticated using (can_see_character(character_id));
create policy "manage my professions" on professions
  for all to authenticated using (owns_character(character_id)) with check (owns_character(character_id));

create policy "see party items" on items
  for select to authenticated using (can_see_character(character_id));
create policy "manage my items" on items
  for all to authenticated using (owns_character(character_id)) with check (owns_character(character_id));

create policy "see party history" on character_history
  for select to authenticated using (can_see_character(character_id));
create policy "manage my history" on character_history
  for all to authenticated using (owns_character(character_id)) with check (owns_character(character_id));

create policy "see party recipes" on recipes
  for select to authenticated using (can_see_character(character_id));
create policy "manage my recipes" on recipes
  for all to authenticated using (owns_character(character_id)) with check (owns_character(character_id));

create policy "see party bis" on bis_items
  for select to authenticated using (can_see_character(character_id));
create policy "manage my bis" on bis_items
  for all to authenticated using (owns_character(character_id)) with check (owns_character(character_id));

create policy "see party events" on events
  for select to authenticated using (can_see_character(character_id));
create policy "add my events" on events
  for insert to authenticated with check (owns_character(character_id));

-- Objectives are shared by the whole party: anyone in it can add, edit and tick them off.
create policy "party manages objectives" on objectives
  for all to authenticated using (is_party_member(party_id)) with check (is_party_member(party_id));

-- ============================================================
-- 6. Actions the website calls (sign-up, create, join, leave)
-- ============================================================

-- Makes (or renames) my player profile. Returns my player id.
create or replace function ensure_player(p_display_name text) returns text
language plpgsql security definer set search_path = public
as $$
declare
  me text := my_player_id();
  clean text := btrim(coalesce(p_display_name, ''));
  base text;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if char_length(clean) not between 1 and 24 then raise exception 'Pick a name between 1 and 24 characters'; end if;
  if me is not null then
    update players set display_name = clean where id = me;
    return me;
  end if;
  base := coalesce(nullif(lower(regexp_replace(clean, '[^A-Za-z0-9]', '', 'g')), ''), 'player');
  me := base;
  while exists (select 1 from players where id = me) loop
    me := base || '-' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into players (id, display_name, user_id) values (me, clean, auth.uid());
  return me;
end $$;

create or replace function create_party(p_name text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me text := my_player_id();
  new_id uuid;
begin
  if me is null then raise exception 'Set your name first'; end if;
  insert into parties (name, invite_code) values (btrim(p_name), new_invite_code()) returning id into new_id;
  insert into party_members (party_id, player_id, role) values (new_id, me, 'leader');
  return new_id;
end $$;

create or replace function join_party(p_code text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me text := my_player_id();
  found uuid;
begin
  if me is null then raise exception 'Set your name first'; end if;
  select id into found from parties where invite_code = upper(btrim(p_code));
  if found is null then raise exception 'No war party has that invite code'; end if;
  insert into party_members (party_id, player_id) values (found, me) on conflict do nothing;
  return found;
end $$;

-- Leave a party. If the leader leaves, the longest-serving member takes over.
-- The last one out turns off the lights (the party and its objectives are removed).
create or replace function leave_party(p_party uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare me text := my_player_id();
begin
  delete from party_members where party_id = p_party and player_id = me;
  if not exists (select 1 from party_members where party_id = p_party) then
    delete from parties where id = p_party;
  elsif not exists (select 1 from party_members where party_id = p_party and role = 'leader') then
    update party_members set role = 'leader'
    where party_id = p_party
      and player_id = (select player_id from party_members where party_id = p_party order by joined_at limit 1);
  end if;
end $$;

-- Leader only: remove someone, hand over leadership, or make a fresh invite code (the old one stops working).
create or replace function remove_party_member(p_party uuid, p_player text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_party_leader(p_party) then raise exception 'Only the party leader can do that'; end if;
  if p_player = my_player_id() then raise exception 'Use Leave party to remove yourself'; end if;
  delete from party_members where party_id = p_party and player_id = p_player;
end $$;

create or replace function make_party_leader(p_party uuid, p_player text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_party_leader(p_party) then raise exception 'Only the party leader can do that'; end if;
  update party_members set role = 'member' where party_id = p_party and player_id = my_player_id();
  update party_members set role = 'leader' where party_id = p_party and player_id = p_player;
end $$;

create or replace function reset_invite_code(p_party uuid) returns text
language plpgsql security definer set search_path = public
as $$
declare code text := new_invite_code();
begin
  if not is_party_leader(p_party) then raise exception 'Only the party leader can do that'; end if;
  update parties set invite_code = code where id = p_party;
  return code;
end $$;

-- ============================================================
-- 7. Live updates for the new tables
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['parties', 'party_members']
  loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

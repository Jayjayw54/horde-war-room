-- Horde War Room: full database setup for a brand-new Supabase project (includes updates 2 to 9).
-- Paste all of this into Supabase > SQL Editor > New query, then click Run.
-- Running it again wipes everything and starts fresh (section 0). To update an existing database,
-- run the numbered update files instead (e.g. 009-war-parties.sql).
--
-- After setup: people sign up on the website, pick a name, and start or join a war party.

-- ============================================================
-- 0. Clear out anything from earlier attempts
-- ============================================================

drop table if exists party_secrets, party_members, parties, events, bis_items, recipes, character_history, items, objectives, professions, characters, players cascade;
drop function if exists is_player(), my_player_id(), is_party_member(uuid), is_party_leader(uuid), shares_party(text),
  can_see_character(uuid), owns_character(uuid), new_invite_code(), ensure_player(text), create_party(text), join_party(text),
  leave_party(uuid), remove_party_member(uuid, text), make_party_leader(uuid, text), reset_invite_code(uuid), touch_updated_at() cascade;

-- ============================================================
-- 1. Tables
-- ============================================================

-- One row per person. Made by ensure_player() when someone picks their name after signing up.
create table players (
  id text primary key,                -- short lowercase name, e.g. 'josh' or 'thrall-3f2a'
  display_name text not null,
  user_id uuid unique references auth.users (id) on delete set null
);

-- War parties: a group that shares one war room (a duo, a guild...). A player can be in several.
create table parties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table party_members (
  party_id uuid not null references parties (id) on delete cascade,
  player_id text not null references players (id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (party_id, player_id)
);

-- Leader-only settings. The Discord webhook is a secret (anyone with it can post in that channel).
create table party_secrets (
  party_id uuid primary key references parties (id) on delete cascade,
  discord_webhook_url text,
  discord_guild_id text      -- the Discord server ID, so the bot knows which party is asking
);

create table characters (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players (id),
  name text not null,                 -- the game's full name; imports match on it (per player)
  race text not null,
  class text not null,
  level int not null default 1 check (level between 1 and 60),
  notes text,
  gold bigint not null default 0,     -- in copper (1g = 10,000)
  xp int,
  xp_max int,
  rested_xp int not null default 0,
  last_played timestamptz,
  bank_seen_at timestamptz,
  stats jsonb,            -- character sheet numbers from the addon
  gear jsonb,             -- equipped items, slot by slot
  weapon_skills jsonb,    -- null if the game doesn't report them
  is_main boolean not null default false,  -- starred on the Roster
  race_file text,          -- the game's internal race name, for the portrait
  sex int,                 -- 2 = male, 3 = female
  constraint characters_player_name_key unique (player_id, name)
);

create table professions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  name text not null,
  skill_level int not null default 1,
  max_skill int not null default 75,
  unique (character_id, name)
);

-- Everything each toon carries or has banked, one row per item type per place.
create table items (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  location text not null check (location in ('bags', 'bank')),
  item_id int not null,
  name text not null,
  quantity int not null default 1,
  quality int,                  -- 0 poor, 1 common, 2 uncommon, 3 rare, 4 epic, 5 legendary
  ilvl int,
  min_level int,
  equip_loc text,
  item_type text,
  sub_type text,
  unique (character_id, location, item_id)
);

create table character_history (
  id bigint generated always as identity primary key,
  character_id uuid not null references characters (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  level int not null,
  xp int,
  xp_max int,
  gold bigint
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  profession text not null,
  recipe_id int,
  name text not null,
  item_id int,
  makes int,
  reagents jsonb not null default '[]',
  unique (character_id, profession, name)
);

create table bis_items (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  slot int not null,
  item_name text not null,
  item_id int,
  note text,
  created_at timestamptz not null default now()
);

create table events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  character_id uuid references characters (id) on delete cascade,
  kind text not null,
  text text not null
);

create table objectives (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties (id) on delete cascade,
  title text not null,
  description text,
  assignee text not null,             -- a player id, or 'everyone' in the party
  category text not null check (category in ('profession', 'farming', 'dungeon', 'gear', 'gold', 'other')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  tonight boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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


-- ============================================================
-- 2. Helper checks used by the security rules
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
-- 3. Security rules: see your parties, change only your own toons
-- ============================================================

alter table parties enable row level security;
alter table party_members enable row level security;
alter table party_secrets enable row level security;
alter table players     enable row level security;
alter table characters  enable row level security;
alter table professions enable row level security;
alter table objectives  enable row level security;
alter table items       enable row level security;
alter table character_history enable row level security;
alter table recipes     enable row level security;
alter table bis_items   enable row level security;
alter table events      enable row level security;

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
-- 4. Actions the website calls (sign-up, create, join, leave)
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
-- 5. Live updates
-- ============================================================
alter publication supabase_realtime add table characters, professions, items, objectives, recipes, bis_items, character_history, events, parties, party_members;

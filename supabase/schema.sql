-- Horde War Room: database setup (Milestone 3).
-- Paste all of this into Supabase > SQL Editor > New query, then click Run.
-- Running it again wipes everything and starts fresh (section 0).

-- ============================================================
-- 0. Clear out anything from earlier attempts
-- ============================================================

drop table if exists items, objectives, professions, characters, players cascade;
drop function if exists is_player();

-- ============================================================
-- 1. Tables
-- ============================================================

-- The two players. user_id gets filled in after each person logs in for the first time.
create table players (
  id text primary key,                -- short lowercase name, e.g. 'josh'. Add a row here to add a player.
  display_name text not null,
  user_id uuid unique references auth.users (id) on delete set null
);

create table characters (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players (id),
  name text not null unique,          -- unique so a future addon snapshot can match by name
  race text not null,
  class text not null,
  level int not null default 1 check (level between 1 and 60),
  notes text,
  gold bigint not null default 0,     -- in copper (1g = 10,000)
  xp int,
  xp_max int,
  rested_xp int not null default 0,
  last_played timestamptz,
  bank_seen_at timestamptz
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
  unique (character_id, location, item_id)
);

create table objectives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee text not null check (assignee in ('josh', 'cel', 'both')),
  category text not null check (category in ('profession', 'farming', 'dungeon', 'gear', 'gold', 'other')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  tonight boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. Security: only the two linked players can read or change anything
-- ============================================================

-- True when the logged-in user is one of the two players.
create function is_player() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from players where user_id = auth.uid());
$$;

alter table players     enable row level security;
alter table characters  enable row level security;
alter table professions enable row level security;
alter table objectives  enable row level security;
alter table items       enable row level security;

-- Players can see the player list; changes to it are done by hand in Supabase.
create policy "players can read players" on players
  for select to authenticated using (is_player());

create policy "players manage characters" on characters
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage professions" on professions
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage items" on items
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage objectives" on objectives
  for all to authenticated using (is_player()) with check (is_player());

-- ============================================================
-- 3. Starting data (same as the Milestone 1 placeholders)
-- ============================================================

insert into players (id, display_name) values
  ('josh', 'Josh'),
  ('cel', 'Cel');

with c as (
  insert into characters (player_id, name, race, class, level) values
    ('josh', 'Grimsley', 'Undead', 'Rogue', 14),
    ('cel', 'Kragnor', 'Orc', 'Warrior', 16)
  returning id, name
)
insert into professions (character_id, name, skill_level, max_skill)
select c.id, p.name, p.skill_level, p.max_skill
from c
join (values
  ('Grimsley', 'Alchemy', 62, 150),
  ('Grimsley', 'Herbalism', 88, 150),
  ('Kragnor', 'Blacksmithing', 45, 150),
  ('Kragnor', 'Mining', 97, 150)
) as p (character_name, name, skill_level, max_skill) on p.character_name = c.name;

insert into objectives (title, description, assignee, category, status, tonight) values
  ('Get Alchemy to 100', null, 'josh', 'profession', 'doing', true),
  ('Mine 20 copper ore for blacksmithing', null, 'cel', 'farming', 'todo', true),
  ('Clear Ragefire Chasm', 'Bring healing potions.', 'both', 'dungeon', 'todo', true),
  ('Buy a better dagger off the auction house', null, 'josh', 'gear', 'todo', false),
  ('Save 10 gold for level 20 skills', null, 'both', 'gold', 'todo', false);

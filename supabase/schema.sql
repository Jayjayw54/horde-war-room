-- Horde War Room: database setup (Milestone 3).
-- Paste all of this into Supabase > SQL Editor > New query, then click Run.
-- Running it again wipes everything and starts fresh (section 0).

-- ============================================================
-- 0. Clear out anything from earlier attempts
-- ============================================================

drop table if exists events, bis_items, recipes, character_history, items, objectives, professions, characters, players cascade;
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
  bank_seen_at timestamptz,
  stats jsonb,            -- character sheet numbers from the addon
  gear jsonb,             -- equipped items, slot by slot
  weapon_skills jsonb,    -- null if the game doesn't report them
  is_main boolean not null default false,  -- starred on the Roster
  race_file text,          -- the game's internal race name, for the portrait
  sex int                  -- 2 = male, 3 = female
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
alter table character_history enable row level security;
alter table recipes     enable row level security;
alter table bis_items   enable row level security;
alter table events      enable row level security;

-- Players can see the player list; changes to it are done by hand in Supabase.
create policy "players can read players" on players
  for select to authenticated using (is_player());

create policy "players manage characters" on characters
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage professions" on professions
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage items" on items
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage history" on character_history
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage recipes" on recipes
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage bis" on bis_items
  for all to authenticated using (is_player()) with check (is_player());

create policy "players manage events" on events
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

-- ============================================================
-- 4. Live updates
-- ============================================================
alter publication supabase_realtime add table characters, professions, items, objectives, recipes, bis_items, character_history, events;

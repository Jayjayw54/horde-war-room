-- Horde War Room: update 5 — history for the Progress graphs, known recipes for the planner, and BiS wishlists.
-- Run once in Supabase > SQL Editor. Safe to run again.

-- One row per toon per import: how they looked at that moment. Powers the levelling race and gold graphs.
create table if not exists character_history (
  id bigint generated always as identity primary key,
  character_id uuid not null references characters (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  level int not null,
  xp int,
  xp_max int,
  gold bigint
);

-- Every recipe each toon knows, with what it makes and what it needs.
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  profession text not null,
  recipe_id int,             -- the game's recipe number (when available)
  name text not null,
  item_id int,               -- what it makes
  makes int,                 -- how many per craft
  reagents jsonb not null default '[]',  -- [{ id, name, count }]
  unique (character_id, profession, name)
);

-- Best-in-slot wishlist: the items each toon is chasing, slot by slot.
create table if not exists bis_items (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  slot int not null,           -- same numbers as the game: 1 head ... 18 ranged
  item_name text not null,
  item_id int,                 -- optional, from a Wowhead link
  note text,                   -- e.g. "drops in Ragefire Chasm"
  created_at timestamptz not null default now()
);

alter table character_history enable row level security;
alter table bis_items enable row level security;
alter table recipes enable row level security;

drop policy if exists "players manage history" on character_history;
create policy "players manage history" on character_history
  for all to authenticated using (is_player()) with check (is_player());

drop policy if exists "players manage recipes" on recipes;
create policy "players manage recipes" on recipes
  for all to authenticated using (is_player()) with check (is_player());

drop policy if exists "players manage bis" on bis_items;
create policy "players manage bis" on bis_items
  for all to authenticated using (is_player()) with check (is_player());

-- Horde War Room: update 2 — gold, XP, last played, and the shared bank.
-- Run once in Supabase > SQL Editor. Safe to run again (it skips anything that already exists).

-- Extra details on each toon, filled in by the addon import.
alter table characters add column if not exists gold bigint not null default 0;      -- in copper (1g = 10,000)
alter table characters add column if not exists xp int;                                -- XP into the current level
alter table characters add column if not exists xp_max int;                            -- XP needed for the next level
alter table characters add column if not exists rested_xp int not null default 0;
alter table characters add column if not exists last_played timestamptz;
alter table characters add column if not exists bank_seen_at timestamptz;              -- when the bank was last opened

-- Every item each toon is carrying or has in the bank, one row per item type per place.
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  location text not null check (location in ('bags', 'bank')),
  item_id int not null,          -- WoW's item number, e.g. 2770 = Copper Ore
  name text not null,
  quantity int not null default 1,
  unique (character_id, location, item_id)
);

alter table items enable row level security;

drop policy if exists "players manage items" on items;
create policy "players manage items" on items
  for all to authenticated using (is_player()) with check (is_player());

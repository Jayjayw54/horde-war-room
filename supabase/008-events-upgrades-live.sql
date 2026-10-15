-- Horde War Room: update 8 — activity feed, gear upgrade finder, and live updates.
-- Run once in Supabase > SQL Editor. Safe to run again.

-- Activity feed: dings, skill-ups, milestones, epics... one row per thing that happened.
create table if not exists events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  character_id uuid references characters (id) on delete cascade,
  kind text not null,       -- new, ding, skill, profession, gold, recipe, milestone, epic
  text text not null
);
alter table events enable row level security;
drop policy if exists "players manage events" on events;
create policy "players manage events" on events
  for all to authenticated using (is_player()) with check (is_player());

-- Gear upgrade finder: what each carried item is, so we can compare it to what's equipped.
alter table items add column if not exists ilvl int;
alter table items add column if not exists min_level int;
alter table items add column if not exists equip_loc text;   -- e.g. INVTYPE_HEAD
alter table items add column if not exists item_type text;   -- e.g. Armor, Weapon
alter table items add column if not exists sub_type text;    -- e.g. Cloth, One-Handed Swords

-- Live updates: tell Supabase to broadcast changes to these tables, so open pages refresh by themselves.
do $$
declare t text;
begin
  foreach t in array array['characters','professions','items','objectives','recipes','bis_items','character_history','events']
  loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

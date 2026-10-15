-- Horde War Room: update 7 — what each toon looks like (for the portrait on the Roster).
-- Run once in Supabase > SQL Editor. Safe to run again.
alter table characters add column if not exists race_file text;  -- the game's internal race name, e.g. 'Scourge' for Undead
alter table characters add column if not exists sex int;          -- 2 = male, 3 = female

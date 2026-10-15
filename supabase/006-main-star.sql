-- Horde War Room: update 6 — star a toon as a main (starred toons sit at the top of the Roster).
-- Run once in Supabase > SQL Editor. Safe to run again.
alter table characters add column if not exists is_main boolean not null default false;

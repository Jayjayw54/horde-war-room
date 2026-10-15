-- Horde War Room: update 4 — character stats, equipped gear and weapon skills.
-- Run once in Supabase > SQL Editor. Safe to run again.
-- These are stored as "jsonb": a flexible bundle of values, so new stats can be added later
-- without changing the database again.
alter table characters add column if not exists stats jsonb;
alter table characters add column if not exists gear jsonb;
alter table characters add column if not exists weapon_skills jsonb;

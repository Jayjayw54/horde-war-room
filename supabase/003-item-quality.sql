-- Horde War Room: update 3 — item rarity (grey/white/green/blue/purple) for the Bank tab.
-- Run once in Supabase > SQL Editor. Safe to run again.
alter table items add column if not exists quality int;   -- 0 poor, 1 common, 2 uncommon, 3 rare, 4 epic, 5 legendary

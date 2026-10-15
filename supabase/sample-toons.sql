-- Sample toons to see how the Roster looks with a few characters each.
-- Run in Supabase > SQL Editor. To remove them again, run the "Remove samples" line at the bottom.

with c as (
  insert into characters (player_id, name, race, class, level, notes) values
    ('josh', 'Zugthrak', 'Orc', 'Warlock', 42, 'Main. Saving for the epic mount.'),
    ('josh', 'Vexlora', 'Troll', 'Priest', 27, 'Healer alt for dungeons.'),
    ('josh', 'Moogrin', 'Tauren', 'Druid', 12, null),
    ('josh', 'Banksy', 'Undead', 'Mage', 5, 'Bank alt.'),
    ('cel', 'Ragnash', 'Orc', 'Hunter', 38, 'Main.'),
    ('cel', 'Thundrak', 'Tauren', 'Shaman', 21, null),
    ('cel', 'Skrix', 'Undead', 'Rogue', 16, 'Lockpicking alt.')
  returning id, name
)
insert into professions (character_id, name, skill_level, max_skill)
select c.id, p.name, p.skill_level, p.max_skill
from c
join (values
  ('Zugthrak', 'Tailoring', 210, 225),
  ('Zugthrak', 'Enchanting', 185, 225),
  ('Vexlora', 'First Aid', 140, 150),
  ('Vexlora', 'Herbalism', 120, 150),
  ('Moogrin', 'Skinning', 60, 75),
  ('Moogrin', 'Leatherworking', 48, 75),
  ('Banksy', 'Fishing', 30, 75),
  ('Ragnash', 'Engineering', 175, 225),
  ('Ragnash', 'Mining', 190, 225),
  ('Thundrak', 'Herbalism', 115, 150),
  ('Thundrak', 'Alchemy', 98, 150),
  ('Skrix', 'Cooking', 70, 75)
) as p (character_name, name, skill_level, max_skill) on p.character_name = c.name;

-- Remove samples (run this line on its own when you're done looking):
-- delete from characters where name in ('Zugthrak', 'Vexlora', 'Moogrin', 'Banksy', 'Ragnash', 'Thundrak', 'Skrix');

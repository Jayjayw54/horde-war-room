// The War Room's own patch notes. Newest first.
// When you ship something new, add an entry at the TOP with the next version number.

export interface Release {
  version: string
  date: string // YYYY-MM-DD
  title: string
  changes: string[]
}

export const changelog: Release[] = [
  {
    version: '2.3',
    date: '2026-10-15',
    title: 'Dressing the war room',
    changes: [
      'A Horde war banner hangs at the top of every page.',
      'The menu is now a tab rail that stays at the top while you scroll, all on one line.',
      'Torchlit, textured background; player names on red ribbons; leather panels throughout.',
      'The page uses more of wide screens.',
    ],
  },
  {
    version: '2.2',
    date: '2026-10-15',
    title: 'Faces on the roster',
    changes: [
      "Each toon card has a portrait like the in-game unit frame: the toon's race face in a gold ring, the level on the rim and the class crest beside it.",
      'Bigger player banners at the top of each Roster column.',
      'Addon v0.5.1 records whether each toon is male or female, so the face matches.',
    ],
  },
  {
    version: '2.1',
    date: '2026-10-15',
    title: 'Mains first',
    changes: [
      'Star a toon (☆ next to its name) to mark it as a main. Mains sit at the top of the Roster.',
      'After mains, toons are sorted by level, highest first.',
      'Professions moved to their own tab on each toon card. Overview now shows gold, XP and when the toon was last played.',
      "The War Room now opens on the Roster. Tonight's orders moved inside the Objectives tab.",
    ],
  },
  {
    version: '2.0',
    date: '2026-10-15',
    title: 'The war table expands',
    changes: [
      'Progress tab: the levelling race and gold by player, charted over time. A point is added on every import.',
      'Planner tab: pick a recipe and see the materials, what you have between you, what is missing and who should craft it.',
      'BiS tab: a best-in-slot wishlist per toon that ticks itself off when the item turns up, plus class guide links.',
      'Discord: a message in your channel whenever someone imports, with dings, skill-ups, new recipes and gold changes.',
      'Addon v0.5.0 records known recipes (open each profession window once).',
    ],
  },
  {
    version: '1.7',
    date: '2026-10-15',
    title: 'Character sheets',
    changes: [
      'Each toon card has tabs: Overview, Stats, Weapons and Gear.',
      'Stats: attributes, health, mana, armor, attack power, crit, dodge and resistances.',
      'Gear: everything equipped, with icons, rarity colours and average item level.',
      "Weapons: weapon skill levels, if WoW: Forever reports them.",
      'Addon v0.4.0 records stats, gear and weapon skills.',
    ],
  },
  {
    version: '1.6',
    date: '2026-10-15',
    title: "What's new",
    changes: ["Patch notes for the War Room itself, right here. A red dot means there's something you haven't read."],
  },
  {
    version: '1.5',
    date: '2026-10-15',
    title: 'Bank gets a makeover',
    changes: [
      'Bank tab has a Grid view with item icons, like your bags in game. Click an item to see who has it.',
      'New compact List view. Switch between Grid and List; it remembers your choice.',
      'Filter by Everyone / Josh / Cel and by Bags / Bank, and sort by name, amount or rarity.',
      'Item names and borders use WoW rarity colours.',
      'Addon v0.3.1 records item rarity.',
    ],
  },
  {
    version: '1.4',
    date: '2026-10-15',
    title: 'Shared bank, gold and XP',
    changes: [
      'New Bank tab: search everything in both your bags and banks. "Who has copper ore?"',
      'Toon cards show gold, an XP bar with rested XP, and when the toon was last played.',
      'Gold totals per player, plus the combined war chest on the Roster.',
      'Addon v0.3.0 records gold, XP, rested XP, bags and bank (open your bank once per toon).',
    ],
  },
  {
    version: '1.3',
    date: '2026-10-15',
    title: 'Beta notes',
    changes: [
      "New Beta notes tab: class changes from Blizzard's WoW: Forever beta development notes.",
      'Filters to the classes you two play, and flags updates that are new since your last visit.',
    ],
  },
  {
    version: '1.2',
    date: '2026-10-15',
    title: 'Roster straight from the game',
    changes: [
      'The Horde War Room addon records your toons, levels and professions.',
      'Import from game on the Roster reads the addon file and updates every toon at once.',
      'Roster split into Josh and Cel columns with smaller cards.',
      'Manual adding and editing of toons removed: the game is the source of truth.',
    ],
  },
  {
    version: '1.1',
    date: '2026-10-15',
    title: 'Open for business',
    changes: [
      'The War Room is online, with email and password login for Josh and Cel.',
      'Everything is saved to a real database, so changes stick and you both see the same thing.',
    ],
  },
  {
    version: '1.0',
    date: '2026-10-15',
    title: 'First muster',
    changes: ["Tonight's orders, Roster and Objectives, with placeholder data."],
  },
]

export const latestVersion = changelog[0].version

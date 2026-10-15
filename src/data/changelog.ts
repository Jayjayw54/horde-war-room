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

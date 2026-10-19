import { EVERYONE, type Assignee, type Category, type Player, type Status } from '../types'

export const categoryLabels: Record<Category, string> = {
  profession: 'Profession',
  farming: 'Farming',
  dungeon: 'Dungeon',
  gear: 'Gear',
  gold: 'Gold',
  other: 'Other',
}

export const statusLabels: Record<Status, string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
}

// Who an objective is for, in words: a player's name, or "Both" / "Everyone" for the whole party.
export function assigneeLabel(assignee: Assignee, players: Player[]) {
  if (assignee === EVERYONE) return players.length === 2 ? 'Both' : 'Everyone'
  return players.find((p) => p.id === assignee)?.displayName ?? 'Former member'
}

// The "who" choices for objectives: each party member, then the whole party.
export function assigneeOptions(players: Player[]): Record<string, string> {
  const options: Record<string, string> = {}
  for (const p of players) options[p.id] = p.displayName
  options[EVERYONE] = assigneeLabel(EVERYONE, players)
  return options
}

// Classic WoW class colours, used for character name accents.
export const classColors: Record<string, string> = {
  Warrior: '#C69B6D',
  Rogue: '#FFF468',
  Mage: '#3FC7EB',
  Priest: '#FFFFFF',
  Warlock: '#8788EE',
  Hunter: '#AAD372',
  Shaman: '#0070DD',
  Druid: '#FF7C0A',
  Paladin: '#F48CBA',
}

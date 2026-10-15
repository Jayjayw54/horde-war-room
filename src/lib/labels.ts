import type { Assignee, Category, Status } from '../types'

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

export const assigneeLabels: Record<Assignee, string> = {
  josh: 'Josh',
  cel: 'Cel',
  both: 'Both',
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

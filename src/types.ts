// Shapes of the data the war room tracks. These match the Supabase tables planned in CLAUDE.md.

export type PlayerId = 'josh' | 'cel'
export type Assignee = PlayerId | 'both'

export type Category = 'profession' | 'farming' | 'dungeon' | 'gear' | 'gold' | 'other'
export type Status = 'todo' | 'doing' | 'done'

export interface Player {
  id: PlayerId
  displayName: string
  userId?: string | null
}

export interface Profession {
  id: string
  name: string
  skillLevel: number
  maxSkill: number
}

export interface Character {
  id: string
  playerId: PlayerId
  name: string
  race: string
  className: string
  level: number
  notes?: string
  professions: Profession[]
  gold: number // copper
  xp: number | null
  xpMax: number | null
  restedXp: number
  lastPlayed: string | null
  bankSeenAt: string | null
  stats: CharacterStats | null
  gear: GearItem[] | null
  weaponSkills: WeaponSkill[] | null
  isMain: boolean
  raceFile: string | null
  sex: number | null
}

export interface StatValue {
  total: number
  bonus: number
}

// Everything is optional: Forever may not report every stat.
export interface CharacterStats {
  strength?: StatValue
  agility?: StatValue
  stamina?: StatValue
  intellect?: StatValue
  spirit?: StatValue
  health?: number
  power?: number
  powerType?: string
  armor?: number
  attackPower?: number
  rangedAttackPower?: number
  meleeCrit?: number
  rangedCrit?: number
  spellCrit?: number
  spellPower?: number
  healing?: number
  dodge?: number
  parry?: number
  block?: number
  resistances?: Partial<Record<'fire' | 'nature' | 'frost' | 'shadow' | 'arcane', number>>
}

export interface GearItem {
  slot: number
  id: number
  name: string
  quality: number | null
  ilvl: number | null
  subType?: string | null
  equipLoc?: string | null
}

export interface WeaponSkill {
  name: string
  skill: number
  max: number
}

export interface Item {
  id: string
  characterId: string
  location: 'bags' | 'bank'
  itemId: number
  name: string
  quantity: number
  quality: number | null
  ilvl: number | null
  minLevel: number | null
  equipLoc: string | null
  itemType: string | null
  subType: string | null
}

export interface Objective {
  id: string
  title: string
  description?: string
  assignee: Assignee
  category: Category
  status: Status
  tonight: boolean
  createdAt: string
}

export interface HistoryPoint {
  characterId: string
  recordedAt: string
  level: number
  xp: number | null
  xpMax: number | null
  gold: number | null
}

export interface Reagent {
  id: number | null
  name: string
  count: number
}

export interface Recipe {
  id: string
  characterId: string
  profession: string
  recipeId: number | null
  name: string
  itemId: number | null
  makes: number | null
  reagents: Reagent[]
}

export interface BisItem {
  id: string
  characterId: string
  slot: number
  itemName: string
  itemId: number | null
  note: string | null
}

export interface WarEvent {
  id: number
  createdAt: string
  characterId: string | null
  kind: string
  text: string
}

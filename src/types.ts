// Shapes of the data the war room tracks. These match the Supabase tables planned in CLAUDE.md.

export type PlayerId = 'josh' | 'mate'
export type Assignee = PlayerId | 'both'

export type Category = 'profession' | 'farming' | 'dungeon' | 'gear' | 'gold' | 'other'
export type Status = 'todo' | 'doing' | 'done'

export interface Player {
  id: PlayerId
  displayName: string
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

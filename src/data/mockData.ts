// Placeholder data for Milestone 1. Replaced by Supabase in Milestone 3.
import type { Character, Objective, Player } from '../types'

export const players: Player[] = [
  { id: 'josh', displayName: 'Josh' },
  { id: 'cel', displayName: 'Cel' },
]

export const characters: Character[] = [
  {
    id: 'c1',
    playerId: 'josh',
    name: 'Grimsley',
    race: 'Undead',
    className: 'Rogue',
    level: 14,
    professions: [
      { id: 'p1', name: 'Alchemy', skillLevel: 62, maxSkill: 150 },
      { id: 'p2', name: 'Herbalism', skillLevel: 88, maxSkill: 150 },
    ],
  },
  {
    id: 'c2',
    playerId: 'cel',
    name: 'Kragnor',
    race: 'Orc',
    className: 'Warrior',
    level: 16,
    professions: [
      { id: 'p3', name: 'Blacksmithing', skillLevel: 45, maxSkill: 150 },
      { id: 'p4', name: 'Mining', skillLevel: 97, maxSkill: 150 },
    ],
  },
]

const now = new Date().toISOString()

export const objectives: Objective[] = [
  { id: 'o1', title: 'Get Alchemy to 100', assignee: 'josh', category: 'profession', status: 'doing', tonight: true, createdAt: now },
  { id: 'o2', title: 'Mine 20 copper ore for blacksmithing', assignee: 'cel', category: 'farming', status: 'todo', tonight: true, createdAt: now },
  { id: 'o3', title: 'Clear Ragefire Chasm', description: 'Bring healing potions.', assignee: 'both', category: 'dungeon', status: 'todo', tonight: true, createdAt: now },
  { id: 'o4', title: 'Buy a better dagger off the auction house', assignee: 'josh', category: 'gear', status: 'todo', tonight: false, createdAt: now },
  { id: 'o5', title: 'Save 10 gold for level 20 skills', assignee: 'both', category: 'gold', status: 'todo', tonight: false, createdAt: now },
]

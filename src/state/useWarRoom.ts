// All app state lives here for Milestone 1. In Milestone 3 these functions
// will read and write Supabase instead of local React state.
import { useState } from 'react'
import { characters as initialCharacters, objectives as initialObjectives, players } from '../data/mockData'
import type { Objective, Status } from '../types'

export type NewObjective = Omit<Objective, 'id' | 'createdAt'>

export function useWarRoom() {
  const [characters] = useState(initialCharacters)
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives)

  function addObjective(input: NewObjective) {
    const objective: Objective = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setObjectives((prev) => [objective, ...prev])
  }

  function updateObjective(id: string, changes: Partial<Objective>) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)))
  }

  function setStatus(id: string, status: Status) {
    updateObjective(id, { status })
  }

  function deleteObjective(id: string) {
    setObjectives((prev) => prev.filter((o) => o.id !== id))
  }

  return { players, characters, objectives, addObjective, updateObjective, setStatus, deleteObjective }
}

export type WarRoom = ReturnType<typeof useWarRoom>

// All war room data, loaded from and saved to Supabase.
// The pages only talk to this file, so they didn't need to change when we swapped
// placeholder data for the real database.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Character, Objective, Player, Profession, Status } from '../types'

export type NewObjective = Omit<Objective, 'id' | 'createdAt'>
export type CharacterInput = Omit<Character, 'id' | 'professions'>
export type ProfessionInput = Omit<Profession, 'id'>

// The database uses snake_case column names (created_at); the app uses camelCase (createdAt).
// These helpers translate between the two.
interface ObjectiveRow {
  id: string
  title: string
  description: string | null
  assignee: Objective['assignee']
  category: Objective['category']
  status: Status
  tonight: boolean
  created_at: string
}

function toObjective(row: ObjectiveRow): Objective {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    assignee: row.assignee,
    category: row.category,
    status: row.status,
    tonight: row.tonight,
    createdAt: row.created_at,
  }
}

function toObjectiveRow(o: Partial<Objective>) {
  const row: Record<string, unknown> = {}
  if (o.title !== undefined) row.title = o.title
  if (o.description !== undefined) row.description = o.description || null
  if (o.assignee !== undefined) row.assignee = o.assignee
  if (o.category !== undefined) row.category = o.category
  if (o.status !== undefined) row.status = o.status
  if (o.tonight !== undefined) row.tonight = o.tonight
  return row
}

export function useWarRoom() {
  const [players, setPlayers] = useState<Player[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch everything from the database.
  const load = useCallback(async () => {
    const [playersRes, charactersRes, objectivesRes] = await Promise.all([
      supabase.from('players').select('id, display_name').order('id'),
      supabase.from('characters').select('*, professions(*)').order('name'),
      supabase.from('objectives').select('*').order('created_at', { ascending: false }),
    ])

    const failed = playersRes.error ?? charactersRes.error ?? objectivesRes.error
    if (failed) {
      setError(failed.message)
      setLoading(false)
      return
    }

    setPlayers((playersRes.data ?? []).map((p) => ({ id: p.id, displayName: p.display_name })))
    setCharacters(
      (charactersRes.data ?? []).map((c) => ({
        id: c.id,
        playerId: c.player_id,
        name: c.name,
        race: c.race,
        className: c.class,
        level: c.level,
        notes: c.notes ?? undefined,
        professions: (c.professions ?? []).map((p: { id: string; name: string; skill_level: number; max_skill: number }) => ({
          id: p.id,
          name: p.name,
          skillLevel: p.skill_level,
          maxSkill: p.max_skill,
        })),
      })),
    )
    setObjectives(((objectivesRes.data ?? []) as ObjectiveRow[]).map(toObjective))
    setError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // If a save fails, show the error and reload so the screen matches the database again.
  function handleSaveError(message: string) {
    setError(`Couldn't save: ${message}`)
    load()
  }

  async function addObjective(input: NewObjective) {
    const { data, error } = await supabase.from('objectives').insert(toObjectiveRow(input)).select().single()
    if (error) return handleSaveError(error.message)
    setObjectives((prev) => [toObjective(data as ObjectiveRow), ...prev])
  }

  async function updateObjective(id: string, changes: Partial<Objective>) {
    // Update the screen straight away so it feels instant, then save.
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)))
    const { error } = await supabase.from('objectives').update(toObjectiveRow(changes)).eq('id', id)
    if (error) handleSaveError(error.message)
  }

  function setStatus(id: string, status: Status) {
    return updateObjective(id, { status })
  }

  async function deleteObjective(id: string) {
    setObjectives((prev) => prev.filter((o) => o.id !== id))
    const { error } = await supabase.from('objectives').delete().eq('id', id)
    if (error) handleSaveError(error.message)
  }

  // Roster changes: save to the database, then reload so every card shows what's really stored.
  // Returns an error message if the save failed (e.g. a toon with that name already exists).
  async function saveRoster(request: PromiseLike<{ error: { message: string; code?: string } | null }>) {
    const { error } = await request
    if (error) {
      return error.code === '23505' ? 'That name is already taken.' : error.message
    }
    await load()
    return null
  }

  function characterRow(c: Partial<CharacterInput>) {
    const row: Record<string, unknown> = {}
    if (c.playerId !== undefined) row.player_id = c.playerId
    if (c.name !== undefined) row.name = c.name
    if (c.race !== undefined) row.race = c.race
    if (c.className !== undefined) row.class = c.className
    if (c.level !== undefined) row.level = c.level
    if (c.notes !== undefined) row.notes = c.notes || null
    return row
  }

  function professionRow(p: Partial<ProfessionInput>) {
    const row: Record<string, unknown> = {}
    if (p.name !== undefined) row.name = p.name
    if (p.skillLevel !== undefined) row.skill_level = p.skillLevel
    if (p.maxSkill !== undefined) row.max_skill = p.maxSkill
    return row
  }

  const addCharacter = (input: CharacterInput) => saveRoster(supabase.from('characters').insert(characterRow(input)))
  const updateCharacter = (id: string, changes: Partial<CharacterInput>) =>
    saveRoster(supabase.from('characters').update(characterRow(changes)).eq('id', id))
  const deleteCharacter = (id: string) => saveRoster(supabase.from('characters').delete().eq('id', id))

  const addProfession = (characterId: string, input: ProfessionInput) =>
    saveRoster(supabase.from('professions').insert({ character_id: characterId, ...professionRow(input) }))
  const updateProfession = (id: string, changes: Partial<ProfessionInput>) =>
    saveRoster(supabase.from('professions').update(professionRow(changes)).eq('id', id))
  const deleteProfession = (id: string) => saveRoster(supabase.from('professions').delete().eq('id', id))

  return {
    players,
    characters,
    objectives,
    loading,
    error,
    addObjective,
    updateObjective,
    setStatus,
    deleteObjective,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addProfession,
    updateProfession,
    deleteProfession,
  }
}

export type WarRoom = ReturnType<typeof useWarRoom>

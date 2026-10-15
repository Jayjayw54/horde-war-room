// All war room data, loaded from and saved to Supabase.
// The pages only talk to this file, so they didn't need to change when we swapped
// placeholder data for the real database.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { importSnapshots as runImport, notifyDiscord } from '../lib/importer'
import type { CharacterSnapshot } from '../lib/savedVariables'
import type { BisItem, Character, HistoryPoint, WarEvent, Item, Objective, Player, PlayerId, Recipe, Status } from '../types'

export type NewObjective = Omit<Objective, 'id' | 'createdAt'>

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

export function useWarRoom(userId: string) {
  const [players, setPlayers] = useState<Player[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [bis, setBis] = useState<BisItem[]>([])
  const [events, setEvents] = useState<WarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch everything from the database.
  const load = useCallback(async () => {
    const [playersRes, charactersRes, objectivesRes, itemsRes] = await Promise.all([
      supabase.from('players').select('id, display_name, user_id').order('id'),
      supabase.from('characters').select('*, professions(*)').order('name'),
      supabase.from('objectives').select('*').order('created_at', { ascending: false }),
      supabase.from('items').select('*').order('name'),
    ])

    // History is optional: if its table isn't set up yet, the rest of the app still works.
    const historyRes = await supabase.from('character_history').select('*').order('recorded_at')
    setHistory(
      (historyRes.data ?? []).map((h) => ({
        characterId: h.character_id,
        recordedAt: h.recorded_at,
        level: h.level,
        xp: h.xp,
        xpMax: h.xp_max,
        gold: h.gold === null ? null : Number(h.gold),
      })),
    )

    const recipesRes = await supabase.from('recipes').select('*').order('name')
    setRecipes(
      (recipesRes.data ?? []).map((r) => ({
        id: r.id,
        characterId: r.character_id,
        profession: r.profession,
        recipeId: r.recipe_id,
        name: r.name,
        itemId: r.item_id,
        makes: r.makes,
        reagents: r.reagents ?? [],
      })),
    )

    const bisRes = await supabase.from('bis_items').select('*').order('slot')
    setBis(
      (bisRes.data ?? []).map((b) => ({
        id: b.id,
        characterId: b.character_id,
        slot: b.slot,
        itemName: b.item_name,
        itemId: b.item_id,
        note: b.note,
      })),
    )

    const eventsRes = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(60)
    setEvents(
      (eventsRes.data ?? []).map((e) => ({
        id: e.id,
        createdAt: e.created_at,
        characterId: e.character_id,
        kind: e.kind,
        text: e.text,
      })),
    )

    const failed = playersRes.error ?? charactersRes.error ?? objectivesRes.error ?? itemsRes.error
    if (failed) {
      setError(failed.message)
      setLoading(false)
      return
    }

    // Josh first, then everyone else alphabetically (this sets the left/right order on the Roster).
    const sortedPlayers = (playersRes.data ?? [])
      .map((p) => ({ id: p.id, displayName: p.display_name, userId: p.user_id }))
      .sort((a, b) => (a.id === 'josh' ? -1 : b.id === 'josh' ? 1 : a.id.localeCompare(b.id)))
    setPlayers(sortedPlayers)
    setCharacters(
      (charactersRes.data ?? []).map((c) => ({
        id: c.id,
        playerId: c.player_id,
        name: c.name,
        race: c.race,
        className: c.class,
        level: c.level,
        notes: c.notes ?? undefined,
        gold: Number(c.gold ?? 0),
        xp: c.xp,
        xpMax: c.xp_max,
        restedXp: c.rested_xp ?? 0,
        lastPlayed: c.last_played,
        bankSeenAt: c.bank_seen_at,
        stats: c.stats ?? null,
        gear: c.gear ?? null,
        weaponSkills: c.weapon_skills ?? null,
        isMain: c.is_main ?? false,
        raceFile: c.race_file ?? null,
        sex: c.sex ?? null,
        professions: (c.professions ?? []).map((p: { id: string; name: string; skill_level: number; max_skill: number }) => ({
          id: p.id,
          name: p.name,
          skillLevel: p.skill_level,
          maxSkill: p.max_skill,
        })),
      })),
    )
    setObjectives(((objectivesRes.data ?? []) as ObjectiveRow[]).map(toObjective))
    setItems(
      (itemsRes.data ?? []).map((i) => ({
        id: i.id,
        characterId: i.character_id,
        location: i.location,
        itemId: i.item_id,
        name: i.name,
        quantity: i.quantity,
        quality: i.quality ?? null,
        ilvl: i.ilvl ?? null,
        minLevel: i.min_level ?? null,
        equipLoc: i.equip_loc ?? null,
        itemType: i.item_type ?? null,
        subType: i.sub_type ?? null,
      })),
    )
    setError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Live updates: when anything changes in the database (Cel ticks an objective, the companion app
  // uploads a new file...), reload. Changes often arrive in bursts, so wait a moment and reload once.
  const [live, setLive] = useState(false)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const channel = supabase
      .channel('war-room')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        clearTimeout(timer)
        timer = setTimeout(load, 800)
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))
    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
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

  // Import characters from the addon's file (the real work lives in lib/importer.ts, shared with the companion app).
  async function importSnapshots(snapshots: CharacterSnapshot[], ownerId: PlayerId) {
    const result = await runImport(supabase, snapshots, ownerId)
    await load()
    if (result.error) return result.error
    const { data } = await supabase.auth.getSession()
    notifyDiscord(window.location.origin, data.session?.access_token ?? '', me?.displayName ?? 'Someone', snapshots.length, result.summary)
    return null
  }

  // Star / unstar a toon as a main. Updates the screen straight away, then saves.
  async function setMain(id: string, isMain: boolean) {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, isMain } : c)))
    const { error } = await supabase.from('characters').update({ is_main: isMain }).eq('id', id)
    if (error) handleSaveError(error.message)
  }

  // BiS wishlist
  async function addBis(input: Omit<BisItem, 'id'>) {
    const { error } = await supabase.from('bis_items').insert({
      character_id: input.characterId,
      slot: input.slot,
      item_name: input.itemName,
      item_id: input.itemId,
      note: input.note,
    })
    if (error) return error.message
    await load()
    return null
  }

  async function removeBis(id: string) {
    setBis((prev) => prev.filter((b) => b.id !== id))
    const { error } = await supabase.from('bis_items').delete().eq('id', id)
    if (error) handleSaveError(error.message)
  }

  const me = players.find((p) => p.userId === userId) ?? null

  return {
    me,
    importSnapshots,
    players,
    characters,
    objectives,
    items,
    history,
    recipes,
    bis,
    events,
    setMain,
    addBis,
    removeBis,
    loading,
    error,
    live,
    addObjective,
    updateObjective,
    setStatus,
    deleteObjective,
  }
}

export type WarRoom = ReturnType<typeof useWarRoom>

// All war room data, loaded from and saved to Supabase.
// The pages only talk to this file, so they didn't need to change when we swapped
// placeholder data for the real database.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CharacterSnapshot } from '../lib/savedVariables'
import type { BisItem, Character, HistoryPoint, Item, Objective, Player, PlayerId, Recipe, Status } from '../types'

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

// Plain-language list of what changed for one toon since the last import.
function describeChanges(before: Character | undefined, snap: CharacterSnapshot): string[] {
  if (!before) return [`🆕 **${snap.name}** joined the roster (level ${snap.level} ${snap.race} ${snap.className})`]
  const lines: string[] = []
  if (snap.level > before.level) lines.push(`⬆️ **${snap.name}** dinged **${snap.level}** (was ${before.level})`)
  for (const p of snap.professions) {
    const old = before.professions.find((x) => x.name === p.name)
    if (!old) lines.push(`📜 **${snap.name}** learned ${p.name} (${p.skill}/${p.max})`)
    else if (p.skill > old.skillLevel) lines.push(`⚒️ **${snap.name}** ${p.name} ${old.skillLevel} → ${p.skill}`)
  }
  if (snap.gold !== null) {
    const diff = Math.trunc((snap.gold - before.gold) / 10000)
    if (Math.abs(diff) >= 1) lines.push(`💰 **${snap.name}** ${diff > 0 ? '+' : ''}${diff}g`)
  }
  return lines
}

export function useWarRoom(userId: string) {
  const [players, setPlayers] = useState<Player[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [bis, setBis] = useState<BisItem[]>([])
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
      })),
    )
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

  // Import characters from the addon's file. Toons are matched by full name:
  // existing ones get their level, race, class and professions updated (owner stays the same);
  // new ones are added to whoever is logged in. Professions are made to match the game exactly.
  async function importSnapshots(snapshots: CharacterSnapshot[], ownerId: PlayerId) {
    const summary: string[] = [] // what changed, for the Discord message
    const history: Record<string, unknown>[] = [] // one row per toon, for the graphs

    for (const snap of snapshots) {
      const existing = characters.find((c) => c.name.toLowerCase() === snap.name.toLowerCase())
      summary.push(...describeChanges(existing, snap))
      const details: Record<string, unknown> = {
        name: snap.name,
        race: snap.race,
        class: snap.className,
        level: Math.min(60, Math.max(1, snap.level)),
      }
      // Only overwrite these when the file has them (older addon versions didn't record them).
      if (snap.gold !== null) details.gold = snap.gold
      if (snap.xp !== null) details.xp = snap.xp
      if (snap.xpMax !== null) details.xp_max = snap.xpMax
      if (snap.rested !== null) details.rested_xp = snap.rested
      if (snap.lastPlayed) details.last_played = snap.lastPlayed.toISOString()
      if (snap.bankSeen) details.bank_seen_at = snap.bankSeen.toISOString()
      if (snap.stats) details.stats = snap.stats
      if (snap.gear) details.gear = snap.gear
      if (snap.weaponSkills) details.weapon_skills = snap.weaponSkills
      if (snap.raceFile) details.race_file = snap.raceFile
      if (snap.sex) details.sex = snap.sex

      let characterId = existing?.id
      if (characterId) {
        const { error } = await supabase.from('characters').update(details).eq('id', characterId)
        if (error) return `${snap.name}: ${error.message}`
      } else {
        const { data, error } = await supabase
          .from('characters')
          .insert({ ...details, player_id: ownerId })
          .select('id')
          .single()
        if (error) return `${snap.name}: ${error.message}`
        characterId = data.id as string
      }

      if (snap.professions.length > 0) {
        const { error } = await supabase.from('professions').upsert(
          snap.professions.map((p) => ({ character_id: characterId, name: p.name, skill_level: p.skill, max_skill: p.max })),
          { onConflict: 'character_id,name' },
        )
        if (error) return `${snap.name} professions: ${error.message}`
      }

      // Items: replace what we have for this toon's bags (and bank, if the bank was opened) with the file's list.
      for (const [location, list] of [
        ['bags', snap.bags],
        ['bank', snap.bank],
      ] as const) {
        if (!list) continue
        const del = await supabase.from('items').delete().eq('character_id', characterId).eq('location', location)
        if (del.error) return `${snap.name} ${location}: ${del.error.message}`
        if (list.length > 0) {
          const ins = await supabase.from('items').insert(
            list.map((i) => ({
              character_id: characterId,
              location,
              item_id: i.id,
              name: i.name,
              quantity: i.count,
              quality: i.quality,
            })),
          )
          if (ins.error) return `${snap.name} ${location}: ${ins.error.message}`
        }
      }

      // Recipes: replace each profession the file has (the addon only knows professions whose window you opened).
      for (const [profession, list] of Object.entries(snap.recipes ?? {})) {
        const before = recipes.filter((r) => r.characterId === characterId && r.profession === profession).length
        const del = await supabase.from('recipes').delete().eq('character_id', characterId).eq('profession', profession)
        if (del.error) break // recipes table not set up yet: skip quietly
        // Some games list a recipe twice (e.g. ranks); keep one per name.
        const unique = [...new Map(list.map((r) => [r.name, r])).values()]
        if (unique.length > 0) {
          await supabase.from('recipes').insert(
            unique.map((r) => ({
              character_id: characterId,
              profession,
              recipe_id: r.id,
              name: r.name,
              item_id: r.itemId,
              makes: r.makes,
              reagents: r.reagents,
            })),
          )
        }
        if (existing && unique.length > before && before > 0) {
          summary.push(`📖 **${snap.name}** learned ${unique.length - before} new ${profession} recipe${unique.length - before === 1 ? '' : 's'}`)
        }
      }

      history.push({
        character_id: characterId,
        level: snap.level,
        xp: snap.xp,
        xp_max: snap.xpMax,
        gold: snap.gold,
        recorded_at: (snap.updated ?? new Date()).toISOString(),
      })

      // Remove professions the character no longer has in game.
      const keep = snap.professions.map((p) => p.name)
      const stale = (existing?.professions ?? []).filter((p) => !keep.includes(p.name)).map((p) => p.id)
      if (stale.length > 0) {
        const { error } = await supabase.from('professions').delete().in('id', stale)
        if (error) return `${snap.name} professions: ${error.message}`
      }
    }
    // History for the graphs. If this fails (e.g. the history table isn't set up yet), the import still counts.
    await supabase.from('character_history').insert(history)

    await load()
    notifyDiscord(snapshots.length, summary)
    return null
  }

  // Posts the import summary to Discord via our Netlify Function. Fire-and-forget: a failure here never
  // affects the import (and on your PC, where Netlify Functions don't run, it simply does nothing).
  async function notifyDiscord(count: number, lines: string[]) {
    try {
      const { data } = await supabase.auth.getSession()
      const who = me?.displayName ?? 'Someone'
      await fetch('/api/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
        body: JSON.stringify({ title: `${who} imported ${count} ${count === 1 ? 'toon' : 'toons'}`, lines }),
      })
    } catch {
      /* ignore */
    }
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
    setMain,
    addBis,
    removeBis,
    loading,
    error,
    addObjective,
    updateObjective,
    setStatus,
    deleteObjective,
  }
}

export type WarRoom = ReturnType<typeof useWarRoom>

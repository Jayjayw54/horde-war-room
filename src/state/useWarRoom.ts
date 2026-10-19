// All war room data, loaded from and saved to Supabase.
// The pages only talk to this file, so they didn't need to change when we swapped
// placeholder data for the real database, or when war parties arrived.
//
// War parties: the database only ever hands us what we're allowed to see (our parties and their
// members' toons). If you're in more than one party, this file narrows everything down to the
// party you've picked, so every page shows one party at a time.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildGameData } from '../lib/gameData'
import { applyActions, importSnapshots as runImport, notifyDiscord } from '../lib/importer'
import { selectAll, toCharacter, toHistory, toItem, toObjective, toPlayer, toRecipe } from '../lib/rows'
import type { CharacterSnapshot, GameAction } from '../lib/savedVariables'
import type {
  BisItem,
  Character,
  HistoryPoint,
  WarEvent,
  Item,
  Objective,
  Party,
  Player,
  Recipe,
  Status,
} from '../types'

export type NewObjective = Omit<Objective, 'id' | 'createdAt' | 'partyId'>

// The database uses snake_case column names (created_at); the app uses camelCase (createdAt).
// lib/rows.ts translates rows coming in; this translates objective changes going out.
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

// Which party you were last looking at, remembered in this browser.
const PARTY_KEY = 'hwr-party'
function readSavedParty() {
  try {
    return localStorage.getItem(PARTY_KEY)
  } catch {
    return null
  }
}

export function useWarRoom(userId: string) {
  // Everything we're allowed to see, across all our parties.
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [allCharacters, setAllCharacters] = useState<Character[]>([])
  const [allObjectives, setAllObjectives] = useState<Objective[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [allHistory, setAllHistory] = useState<HistoryPoint[]>([])
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [allBis, setAllBis] = useState<BisItem[]>([])
  const [allEvents, setAllEvents] = useState<WarEvent[]>([])
  const [partyId, setPartyId] = useState<string | null>(readSavedParty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch everything from the database.
  const load = useCallback(async () => {
    const [playersRes, partiesRes, membersRes, charactersRes, objectivesRes, itemsRes] = await Promise.all([
      supabase.from('players').select('id, display_name, user_id').order('display_name'),
      supabase.from('parties').select('id, name, invite_code').order('created_at'),
      supabase.from('party_members').select('party_id, player_id, role, joined_at').order('joined_at'),
      selectAll(supabase, 'characters', '*, professions(*)', (q) => q.order('name')),
      selectAll(supabase, 'objectives', '*', (q) => q.order('created_at', { ascending: false })),
      selectAll(supabase, 'items', '*', (q) => q.order('name').order('id')),
    ])

    // These are optional: if a table isn't set up yet, the rest of the app still works.
    const [historyRes, recipesRes, bisRes, eventsRes] = await Promise.all([
      selectAll(supabase, 'character_history', '*', (q) => q.order('recorded_at').order('id')),
      selectAll(supabase, 'recipes', '*', (q) => q.order('name').order('id')),
      supabase.from('bis_items').select('*').order('slot'),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(300),
    ])
    setAllHistory(historyRes.data.map(toHistory))
    setAllRecipes(recipesRes.data.map(toRecipe))
    setAllBis(
      (bisRes.data ?? []).map((b) => ({
        id: b.id,
        characterId: b.character_id,
        slot: b.slot,
        itemName: b.item_name,
        itemId: b.item_id,
        note: b.note,
      })),
    )
    setAllEvents(
      (eventsRes.data ?? []).map((e) => ({
        id: e.id,
        createdAt: e.created_at,
        characterId: e.character_id,
        kind: e.kind,
        text: e.text,
      })),
    )

    const failed =
      playersRes.error?.message ??
      partiesRes.error?.message ??
      membersRes.error?.message ??
      charactersRes.error ??
      objectivesRes.error ??
      itemsRes.error
    if (failed) {
      // The most likely cause right after an update: the database step (supabase/009-war-parties.sql) hasn't been run.
      setError(
        /part(y|ies)/.test(failed)
          ? `The database needs updating for war parties (${failed}). Run supabase/009-war-parties.sql in Supabase.`
          : failed,
      )
      setLoading(false)
      return
    }

    setAllPlayers((playersRes.data ?? []).map(toPlayer))
    const members = membersRes.data ?? []
    setParties(
      (partiesRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        inviteCode: p.invite_code,
        members: members
          .filter((m) => m.party_id === p.id)
          .map((m) => ({ playerId: m.player_id, role: m.role, joinedAt: m.joined_at })),
      })),
    )
    setAllCharacters(charactersRes.data.map(toCharacter))
    setAllObjectives(objectivesRes.data.map(toObjective))
    setAllItems(itemsRes.data.map(toItem))
    setError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Live updates: when anything changes in the database (a party member ticks an objective, the
  // launcher uploads a new file...), reload. Changes often arrive in bursts, so wait a moment and reload once.
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

  // ---- Narrow everything down to the party you're looking at ----
  const me = allPlayers.find((p) => p.userId === userId) ?? null
  const party = parties.find((p) => p.id === partyId) ?? parties[0] ?? null
  const myRole = party?.members.find((m) => m.playerId === me?.id)?.role ?? null

  const view = useMemo(() => {
    const memberIds = new Set(party?.members.map((m) => m.playerId) ?? [])
    // You first, then everyone else alphabetically (this sets the left-to-right order on the Roster).
    const players = allPlayers
      .filter((p) => memberIds.has(p.id))
      .sort((a, b) => (a.id === me?.id ? -1 : b.id === me?.id ? 1 : a.displayName.localeCompare(b.displayName)))
    const characters = allCharacters.filter((c) => memberIds.has(c.playerId))
    const toonIds = new Set(characters.map((c) => c.id))
    const ofParty = <T extends { characterId: string | null }>(list: T[]) =>
      list.filter((x) => x.characterId !== null && toonIds.has(x.characterId))
    return {
      players,
      characters,
      objectives: allObjectives.filter((o) => o.partyId === party?.id),
      items: ofParty(allItems),
      history: ofParty(allHistory),
      recipes: ofParty(allRecipes),
      bis: ofParty(allBis),
      events: ofParty(allEvents).slice(0, 60),
    }
  }, [party, me?.id, allPlayers, allCharacters, allObjectives, allItems, allHistory, allRecipes, allBis, allEvents])

  function switchParty(id: string) {
    setPartyId(id)
    try {
      localStorage.setItem(PARTY_KEY, id)
    } catch {
      /* fine: it just won't be remembered next visit */
    }
  }

  // If a save fails, show the error and reload so the screen matches the database again.
  function handleSaveError(message: string) {
    setError(`Couldn't save: ${message}`)
    load()
  }

  // ---- Objectives ----
  async function addObjective(input: NewObjective) {
    if (!party) return
    const { data, error } = await supabase
      .from('objectives')
      .insert({ ...toObjectiveRow(input), party_id: party.id })
      .select()
      .single()
    if (error) return handleSaveError(error.message)
    setAllObjectives((prev) => [toObjective(data), ...prev])
  }

  async function updateObjective(id: string, changes: Partial<Objective>) {
    // Update the screen straight away so it feels instant, then save.
    setAllObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)))
    const { error } = await supabase.from('objectives').update(toObjectiveRow(changes)).eq('id', id)
    if (error) handleSaveError(error.message)
  }

  function setStatus(id: string, status: Status) {
    return updateObjective(id, { status })
  }

  async function deleteObjective(id: string) {
    setAllObjectives((prev) => prev.filter((o) => o.id !== id))
    const { error } = await supabase.from('objectives').delete().eq('id', id)
    if (error) handleSaveError(error.message)
  }

  // Import characters from the addon's file (the real work lives in lib/importer.ts, shared with the
  // website's sync function). Toons always belong to whoever is logged in.
  // Also applies anything ticked off in the game's War Room window.
  async function importSnapshots(snapshots: CharacterSnapshot[], actions: GameAction[] = []) {
    if (!me) return 'Set up your name first.'
    const result = await runImport(supabase, snapshots, me.id, allPlayers.map((p) => p.id))
    if (!result.error && actions.length > 0) await applyActions(supabase, actions, parties.map((p) => p.id))
    await load()
    if (result.error) return result.error
    const { data } = await supabase.auth.getSession()
    notifyDiscord(window.location.origin, data.session?.access_token ?? '', me.displayName, snapshots.length, result.summary)
    return null
  }

  // Star / unstar a toon as a main. Updates the screen straight away, then saves.
  async function setMain(id: string, isMain: boolean) {
    setAllCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, isMain } : c)))
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
    setAllBis((prev) => prev.filter((b) => b.id !== id))
    const { error } = await supabase.from('bis_items').delete().eq('id', id)
    if (error) handleSaveError(error.message)
  }

  // ---- You and your war parties ----
  // Each returns an error message to show, or null when it worked.
  async function call(fn: string, args: Record<string, unknown>) {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) return { data: null, error: error.message }
    await load()
    return { data, error: null }
  }

  async function setDisplayName(name: string) {
    return (await call('ensure_player', { p_display_name: name })).error
  }

  async function createParty(name: string) {
    const { data, error } = await call('create_party', { p_name: name })
    if (!error && typeof data === 'string') switchParty(data)
    return error
  }

  async function joinParty(code: string) {
    const { data, error } = await call('join_party', { p_code: code })
    if (!error && typeof data === 'string') switchParty(data)
    return error
  }

  async function leaveParty(id: string) {
    return (await call('leave_party', { p_party: id })).error
  }

  async function removeMember(playerId: string) {
    if (!party) return null
    return (await call('remove_party_member', { p_party: party.id, p_player: playerId })).error
  }

  async function makeLeader(playerId: string) {
    if (!party) return null
    return (await call('make_party_leader', { p_party: party.id, p_player: playerId })).error
  }

  async function resetInviteCode() {
    if (!party) return null
    return (await call('reset_invite_code', { p_party: party.id })).error
  }

  async function renameParty(name: string) {
    if (!party) return null
    const { error } = await supabase.from('parties').update({ name: name.trim() }).eq('id', party.id)
    if (error) return error.message
    await load()
    return null
  }

  // Discord settings are leader-only (the database refuses anyone else).
  async function getDiscordSettings() {
    if (!party) return null
    const { data } = await supabase
      .from('party_secrets')
      .select('discord_webhook_url, discord_guild_id')
      .eq('party_id', party.id)
      .maybeSingle()
    return { webhookUrl: data?.discord_webhook_url ?? '', guildId: data?.discord_guild_id ?? '' }
  }

  async function saveDiscordSettings(webhookUrl: string, guildId: string) {
    if (!party) return null
    const { error } = await supabase.from('party_secrets').upsert({
      party_id: party.id,
      discord_webhook_url: webhookUrl.trim() || null,
      discord_guild_id: guildId.trim() || null,
    })
    return error ? error.message : null
  }

  // ---- Sync keys (for the launcher) ----
  async function listSyncKeys() {
    const { data } = await supabase.from('sync_keys').select('id, label, created_at, last_used_at').order('created_at')
    return (data ?? []).map((k) => ({
      id: k.id as string,
      label: k.label as string,
      createdAt: k.created_at as string,
      lastUsedAt: (k.last_used_at as string | null) ?? null,
    }))
  }

  // Returns the new key (shown once, never again), or an error message.
  async function newSyncKey(label: string) {
    const { data, error } = await supabase.rpc('new_sync_key', { p_label: label })
    if (error) return { key: null, error: error.message }
    return { key: data as string, error: null }
  }

  async function deleteSyncKey(id: string) {
    const { error } = await supabase.from('sync_keys').delete().eq('id', id)
    return error ? error.message : null
  }

  // The file the addon reads for its in-game War Room window (every party you're in).
  function gameDataFile() {
    if (!me) return ''
    return buildGameData({
      meId: me.id,
      players: allPlayers,
      parties,
      characters: allCharacters,
      items: allItems,
      objectives: allObjectives,
    })
  }

  return {
    me,
    party,
    gameDataFile,
    parties,
    myRole,
    switchParty,
    importSnapshots,
    ...view,
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
    setDisplayName,
    createParty,
    joinParty,
    leaveParty,
    removeMember,
    makeLeader,
    resetInviteCode,
    renameParty,
    getDiscordSettings,
    saveDiscordSettings,
    listSyncKeys,
    newSyncKey,
    deleteSyncKey,
    reload: load,
  }
}

export type WarRoom = ReturnType<typeof useWarRoom>

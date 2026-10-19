// Netlify Function: /api/sync — how the launcher (or anything you give your sync key to) talks to the War Room.
//
//   POST /api/sync   body: the addon's file (HordeWarRoom.lua from WTF\…\SavedVariables)
//                    → imports your toons and applies anything ticked off in game. Answers with a
//                      short summary (JSON).
//   GET  /api/sync   → the fresh in-game data: the WarRoomData.lua file itself, as plain text.
//                      (Plain text rather than JSON, because older Windows PowerShell struggles
//                      with very big JSON answers, and a guild's bank gets big.)
//
// Either way, send your personal sync key:  Authorization: Bearer hwr_…
// Make one on the War party page. The key only ever touches its owner's toons, and the party's objectives.
//
// Netlify environment variables it needs: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (secret).
import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildGameData } from '../../src/lib/gameData.ts'
import { applyActions, importSnapshots } from '../../src/lib/importer.ts'
import { chunks, selectAll, toCharacter, toItem, toObjective, toPlayer } from '../../src/lib/rows.ts'
import { readSavedVariables } from '../../src/lib/savedVariables.ts'
import { postToPartyDiscords } from '../lib/admin.mjs'

const MAX_FILE = 8 * 1024 * 1024 // 8 MB is far bigger than any real addon file

function adminClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Netlify')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Which player does this key belong to? null if it's not a real key.
async function playerForKey(db: SupabaseClient, key: string) {
  if (!/^hwr_[0-9a-f]{64}$/.test(key)) return null
  const hash = createHash('sha256').update(key, 'utf8').digest('hex')
  const { data } = await db.from('sync_keys').select('id, player_id, players(display_name)').eq('key_hash', hash).maybeSingle()
  if (!data) return null
  await db.from('sync_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
  const player = data.players as unknown as { display_name: string } | null
  return { id: data.player_id as string, name: player?.display_name ?? 'Someone' }
}

// The parties this player is in, and everyone in them.
async function membership(db: SupabaseClient, playerId: string) {
  const { data: mine } = await db.from('party_members').select('party_id').eq('player_id', playerId)
  const partyIds = (mine ?? []).map((m) => m.party_id as string)
  const { data: partyRows } = partyIds.length
    ? await db.from('parties').select('id, name, invite_code, party_members(player_id, role, joined_at)').in('id', partyIds)
    : { data: [] }
  const parties = (partyRows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    inviteCode: p.invite_code as string,
    members: ((p.party_members ?? []) as { player_id: string; role: 'leader' | 'member'; joined_at: string }[]).map((m) => ({
      playerId: m.player_id,
      role: m.role,
      joinedAt: m.joined_at,
    })),
  }))
  const memberIds = [...new Set([playerId, ...parties.flatMap((p) => p.members.map((m) => m.playerId))])]
  return { partyIds, parties, memberIds }
}

// Everything the in-game window needs, for every party this player is in.
async function gameDataFor(db: SupabaseClient, playerId: string) {
  const { partyIds, parties, memberIds } = await membership(db, playerId)
  const { data: playerRows } = await db.from('players').select('id, display_name, user_id').in('id', memberIds)
  const characters = (
    await selectAll(db, 'characters', '*, professions(*)', (q) => q.in('player_id', memberIds).order('name'))
  ).data.map(toCharacter)
  const items = []
  for (const ids of chunks(characters.map((c) => c.id))) {
    const res = await selectAll(db, 'items', '*', (q) => q.in('character_id', ids).order('id'))
    items.push(...res.data.map(toItem))
  }
  const objectives = partyIds.length
    ? (await selectAll(db, 'objectives', '*', (q) => q.in('party_id', partyIds).order('created_at'))).data.map(toObjective)
    : []

  return buildGameData({
    meId: playerId,
    players: (playerRows ?? []).map(toPlayer),
    parties,
    characters,
    items,
    objectives,
  })
}

export default async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'POST') return new Response('GET or POST only', { status: 405 })

  let db: SupabaseClient
  try {
    db = adminClient()
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }

  const key = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  const player = await playerForKey(db, key)
  if (!player) return Response.json({ error: 'That sync key is not valid. Make a new one on the War party page.' }, { status: 401 })

  // GET: the in-game data file.
  if (req.method === 'GET') {
    return new Response(await gameDataFor(db, player.id), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-War-Room-Player': encodeURIComponent(player.name),
      },
    })
  }

  // POST: import the addon's file first.
  const text = await req.text()
  if (text.length > MAX_FILE) return Response.json({ error: 'That file is too big to be an addon file.' }, { status: 413 })
  let parsed
  try {
    parsed = readSavedVariables(text)
  } catch (e) {
    return Response.json({ error: `Couldn't read the addon file: ${(e as Error).message}` }, { status: 400 })
  }

  const { partyIds, memberIds } = await membership(db, player.id)
  const result = await importSnapshots(db, parsed.snapshots, player.id, memberIds)
  if (result.error) return Response.json({ error: result.error }, { status: 500 })
  const applied = await applyActions(db, parsed.actions, partyIds)

  // Only bother Discord when something actually happened (the launcher syncs on every /reload).
  if (result.summary.length > 0) {
    const count = parsed.snapshots.length
    await postToPartyDiscords(player.id, `${player.name} synced ${count} ${count === 1 ? 'toon' : 'toons'}`, result.summary).catch(
      () => 0,
    )
  }

  return Response.json({
    player: player.name,
    imported: parsed.snapshots.length,
    ordersUpdated: applied,
    summary: result.summary,
  })
}

export const config = { path: '/api/sync' }

// Turns database rows (snake_case, e.g. created_at) into the app's shapes (camelCase, e.g. createdAt).
// Shared by the website and the server's sync function, so both read the data the same way.
// (Only type imports here, so the server can use this file too.)
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Character, HistoryPoint, Item, Objective, Player, Recipe, Status } from '../types'

// The database hands back at most 1,000 rows at a time. A guild's bank is bigger than that,
// so fetch big tables page by page. `build` makes the query, e.g. (q) => q.eq('player_id', 'josh').
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any
export async function selectAll<T = Record<string, unknown>>(
  db: SupabaseClient,
  table: string,
  columns = '*',
  build: (query: Query) => Query = (q) => q,
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(db.from(table).select(columns)).range(from, from + 999)
    if (error) return { data: rows, error: error.message as string }
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) return { data: rows, error: null }
  }
}

// Split a long list into chunks, for "is one of these" filters (web addresses have a length limit).
export function chunks<T>(list: T[], size = 150): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toPlayer = (p: any): Player => ({ id: p.id, displayName: p.display_name, userId: p.user_id })

export const toCharacter = (c: any): Character => ({
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
  professions: (c.professions ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    skillLevel: p.skill_level,
    maxSkill: p.max_skill,
  })),
})

export const toItem = (i: any): Item => ({
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
})

export const toObjective = (row: any): Objective => ({
  id: row.id,
  partyId: row.party_id,
  title: row.title,
  description: row.description ?? undefined,
  assignee: row.assignee,
  category: row.category,
  status: row.status as Status,
  tonight: row.tonight,
  createdAt: row.created_at,
})

export const toHistory = (h: any): HistoryPoint => ({
  characterId: h.character_id,
  recordedAt: h.recorded_at,
  level: h.level,
  xp: h.xp,
  xpMax: h.xp_max,
  gold: h.gold === null ? null : Number(h.gold),
})

export const toRecipe = (r: any): Recipe => ({
  id: r.id,
  characterId: r.character_id,
  profession: r.profession,
  recipeId: r.recipe_id,
  name: r.name,
  itemId: r.item_id,
  makes: r.makes,
  reagents: r.reagents ?? [],
})
/* eslint-enable @typescript-eslint/no-explicit-any */

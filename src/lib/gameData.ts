// Builds BloodboundData.lua: everything the in-game crew window shows, written as Lua so the addon
// can read it. The game only reads it at login or /reload. It goes in the addon's own folder:
//   <your WoW: Forever folder>\Interface\AddOns\Bloodbound\BloodboundData.lua
// The launcher writes it after every sync; the website's "Download in-game data" button gives you
// the same file by hand. (Only type imports here, so the server can use this file too.)
import type { Character, Item, Objective, Party, Player } from '../types'

export interface GameDataInput {
  meId: string
  players: Player[]
  parties: Party[]
  characters: Character[]
  items: Item[]
  objectives: Objective[]
  now?: Date
}

// Bump this if the shape changes, so the addon can tell an old file from a new one.
export const GAME_DATA_VERSION = 1

type LuaValue = string | number | boolean | null | undefined | LuaValue[] | { [key: string]: LuaValue }

// A Lua string with quotes, backslashes and line breaks escaped. Other bytes pass straight through.
function luaString(text: string) {
  return (
    '"' +
    text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, (c) => `\\${c.charCodeAt(0)}`) +
    '"'
  )
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/
const LUA_WORDS = new Set(['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while', 'goto'])

export function toLua(value: LuaValue, indent = ''): string {
  if (value === null || value === undefined) return 'nil'
  if (typeof value === 'string') return luaString(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'nil'
  const inner = indent + '  '
  if (Array.isArray(value)) {
    if (value.length === 0) return '{}'
    return `{\n${value.map((v) => inner + toLua(v, inner)).join(',\n')},\n${indent}}`
  }
  const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined)
  if (entries.length === 0) return '{}'
  const key = (k: string) => (IDENTIFIER.test(k) && !LUA_WORDS.has(k) ? k : `[${luaString(k)}]`)
  return `{\n${entries.map(([k, v]) => `${inner}${key(k)} = ${toLua(v, inner)}`).join(',\n')},\n${indent}}`
}

const epoch = (iso: string | null) => (iso ? Math.floor(new Date(iso).getTime() / 1000) : undefined)

export function buildGameData(input: GameDataInput): string {
  const now = input.now ?? new Date()
  const playerName = new Map(input.players.map((p) => [p.id, p.displayName]))
  const toonName = new Map(input.characters.map((c) => [c.id, c.name]))

  // Orders: everything not done yet, plus tonight's done ones (so tonight's progress shows).
  const orders = (partyId: string) =>
    input.objectives
      .filter((o) => o.partyId === partyId && (o.status !== 'done' || o.tonight))
      .map((o) => ({
        id: o.id,
        title: o.title,
        who: o.assignee,
        category: o.category,
        status: o.status,
        tonight: o.tonight,
      }))

  // The shared bank, one entry per kind of item, with who holds how many.
  const byItem = new Map<number, { id: number; name: string; quality?: number; holders: LuaValue[] }>()
  for (const i of input.items) {
    const toon = toonName.get(i.characterId)
    if (!toon) continue
    const entry = byItem.get(i.itemId) ?? { id: i.itemId, name: i.name, quality: i.quality ?? undefined, holders: [] }
    entry.holders.push({ toon, n: i.quantity, where: i.location })
    byItem.set(i.itemId, entry)
  }

  const data = {
    version: GAME_DATA_VERSION,
    generatedAt: Math.floor(now.getTime() / 1000),
    me: input.meId,
    players: Object.fromEntries(playerName),
    parties: input.parties.map((p) => ({
      id: p.id,
      name: p.name,
      members: p.members.map((m) => m.playerId),
      orders: orders(p.id),
    })),
    toons: input.characters.map((c) => ({
      name: c.name,
      player: c.playerId,
      level: c.level,
      race: c.race,
      class: c.className,
      gold: c.gold,
      lastPlayed: epoch(c.lastPlayed),
      professions: c.professions.map((p) => ({ name: p.name, skill: p.skillLevel, max: p.maxSkill })),
    })),
    items: [...byItem.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }

  return [
    '-- The Bloodbound: data for the in-game window. Made by The Bloodbound website; safe to delete.',
    `-- Made ${now.toISOString()}. Type /reload in game to load a newer copy.`,
    `BloodboundData = ${toLua(data as unknown as LuaValue)}`,
    '',
  ].join('\n')
}

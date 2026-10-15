// Reads the file the WoW addon writes (SavedVariables/HordeWarRoom.lua).
// That file is Lua code, e.g.  HordeWarRoomDB = { ["characters"] = { ... } }
// so this is a small reader for the parts of Lua that WoW uses when saving data:
// tables { }, ["keys"] = values, strings, numbers, true/false/nil.

type LuaValue = string | number | boolean | null | LuaTable
interface LuaTable {
  [key: string]: LuaValue
}

function parseLua(text: string): LuaValue {
  let i = 0

  function skipSpace() {
    while (i < text.length) {
      if (/\s/.test(text[i])) i++
      else if (text.startsWith('--', i)) {
        while (i < text.length && text[i] !== '\n') i++
      } else break
    }
  }

  function fail(message: string): never {
    throw new Error(`${message} (at character ${i})`)
  }

  function parseString(): string {
    const quote = text[i++]
    let out = ''
    while (i < text.length && text[i] !== quote) {
      if (text[i] === '\\') {
        i++
        const c = text[i++]
        if (c === 'n') out += '\n'
        else if (c === 't') out += '\t'
        else if (c === '\n') out += '\n'
        else if (/\d/.test(c)) {
          let digits = c
          while (digits.length < 3 && /\d/.test(text[i])) digits += text[i++]
          out += String.fromCharCode(Number(digits))
        } else out += c
      } else out += text[i++]
    }
    if (text[i] !== quote) fail('Unfinished text value')
    i++
    return out
  }

  function parseValue(): LuaValue {
    skipSpace()
    const c = text[i]
    if (c === '{') return parseTable()
    if (c === '"' || c === "'") return parseString()
    const word = /^(-?\d+(\.\d+)?([eE][-+]?\d+)?|true|false|nil)/.exec(text.slice(i))
    if (!word) fail('Unexpected content')
    i += word[0].length
    if (word[0] === 'true') return true
    if (word[0] === 'false') return false
    if (word[0] === 'nil') return null
    return Number(word[0])
  }

  function parseTable(): LuaTable {
    i++ // {
    const table: LuaTable = {}
    let nextIndex = 1
    for (;;) {
      skipSpace()
      if (text[i] === '}') {
        i++
        return table
      }
      if (text[i] === '[') {
        i++
        const key = parseValue()
        skipSpace()
        if (text[i] !== ']') fail('Expected ]')
        i++
        skipSpace()
        if (text[i] !== '=') fail('Expected =')
        i++
        table[String(key)] = parseValue()
      } else {
        table[String(nextIndex++)] = parseValue()
      }
      skipSpace()
      if (text[i] === ',' || text[i] === ';') i++
    }
  }

  // The file is one or more lines of:  Name = value
  skipSpace()
  const assign = /^[A-Za-z_][A-Za-z0-9_]*\s*=/.exec(text.slice(i))
  if (!assign) fail("This doesn't look like a SavedVariables file")
  i += assign[0].length
  return parseValue()
}

export interface SnapshotProfession {
  name: string
  skill: number
  max: number
}

export interface SnapshotItem {
  id: number
  name: string
  count: number
  quality: number | null
  // Added in addon v0.6.0, for the gear upgrade finder:
  ilvl: number | null
  minLevel: number | null
  equipLoc: string | null // e.g. "INVTYPE_HEAD"; empty for things you can't wear
  itemType: string | null // e.g. "Armor", "Weapon"
  subType: string | null // e.g. "Cloth", "One-Handed Swords"
}

export interface CharacterSnapshot {
  name: string
  race: string
  className: string
  level: number
  faction: string
  professions: SnapshotProfession[]
  updated: Date | null
  // Added in addon v0.3.0 (missing from older files, so all optional):
  gold: number | null // copper
  xp: number | null
  xpMax: number | null
  rested: number | null
  lastPlayed: Date | null
  bags: SnapshotItem[] | null
  bank: SnapshotItem[] | null
  bankSeen: Date | null
  // Added in addon v0.4.0:
  stats: unknown | null
  gear: unknown[] | null
  weaponSkills: unknown[] | null
  // Added in addon v0.5.0: recipes by profession name.
  recipes: Record<string, SnapshotRecipe[]> | null
  // Added in addon v0.5.1:
  raceFile: string | null
  sex: number | null
}

export interface SnapshotRecipe {
  id: number | null
  name: string
  itemId: number | null
  makes: number | null
  reagents: { id: number | null; name: string; count: number }[]
}

const asTable = (v: LuaValue | undefined): LuaTable => (v && typeof v === 'object' ? v : {})
const num = (v: LuaValue | undefined) => (typeof v === 'number' ? v : null)
const date = (v: LuaValue | undefined) => (typeof v === 'number' ? new Date(v * 1000) : null)

// Converts a Lua table to plain JSON: tables keyed 1, 2, 3... become arrays.
function toJson(v: LuaValue | undefined): unknown {
  if (v === undefined || v === null) return null
  if (typeof v !== 'object') return v
  const keys = Object.keys(v)
  const isList = keys.length > 0 && keys.every((k, i) => k === String(i + 1))
  if (isList) return keys.map((k) => toJson(v[k]))
  if (keys.length === 0) return []
  return Object.fromEntries(keys.map((k) => [k, toJson(v[k])]))
}

const list = (v: LuaValue | undefined): unknown[] | null => {
  const j = toJson(v)
  return Array.isArray(j) ? j : null
}

function readRecipes(v: LuaValue | undefined): Record<string, SnapshotRecipe[]> | null {
  if (!v || typeof v !== 'object') return null
  const out: Record<string, SnapshotRecipe[]> = {}
  for (const [profession, listValue] of Object.entries(v)) {
    out[profession] = Object.values(asTable(listValue))
      .map(asTable)
      .filter((r) => typeof r.name === 'string')
      .map((r) => ({
        id: num(r.id),
        name: String(r.name),
        itemId: num(r.itemId),
        makes: num(r.makes),
        reagents: Object.values(asTable(r.reagents))
          .map(asTable)
          .map((g) => ({ id: num(g.id), name: String(g.name ?? (g.id ? `Item ${g.id}` : '?')), count: Number(g.count ?? 1) })),
      }))
  }
  return out
}

function items(v: LuaValue | undefined): SnapshotItem[] | null {
  if (!v || typeof v !== 'object') return null
  return Object.values(v)
    .map(asTable)
    .map((i) => ({
      id: Number(i.id),
      name: String(i.name ?? ''),
      count: Number(i.count ?? 1),
      quality: num(i.quality),
      ilvl: num(i.ilvl),
      minLevel: num(i.minLevel),
      equipLoc: typeof i.equipLoc === 'string' && i.equipLoc ? i.equipLoc : null,
      itemType: typeof i.itemType === 'string' ? i.itemType : null,
      subType: typeof i.subType === 'string' ? i.subType : null,
    }))
    .filter((i) => Number.isFinite(i.id) && i.name)
}

// Turns the file's text into a list of characters, or throws an Error with a readable message.
export function readSnapshotFile(text: string): CharacterSnapshot[] {
  const db = asTable(parseLua(text))
  const characters = asTable(db.characters)
  return Object.values(characters)
    .map(asTable)
    .filter((c) => typeof c.name === 'string')
    .map((c) => ({
      name: String(c.name),
      race: String(c.race ?? ''),
      className: String(c.class ?? ''),
      level: Number(c.level ?? 1),
      faction: String(c.faction ?? ''),
      professions: Object.values(asTable(c.professions))
        .map(asTable)
        .map((p) => ({ name: String(p.name ?? ''), skill: Number(p.skill ?? 0), max: Number(p.max ?? 0) }))
        .filter((p) => p.name),
      updated: date(c.updated),
      gold: num(c.money),
      xp: num(c.xp),
      xpMax: num(c.xpMax),
      rested: num(c.rested),
      lastPlayed: date(c.lastPlayed) ?? date(c.updated),
      bags: items(c.bags),
      bank: items(c.bank),
      bankSeen: date(c.bankUpdated),
      stats: c.stats && typeof c.stats === 'object' ? toJson(c.stats) : null,
      gear: list(c.gear),
      weaponSkills: list(c.weaponSkills),
      recipes: readRecipes(c.recipes),
      raceFile: typeof c.raceFile === 'string' ? c.raceFile : null,
      sex: num(c.sex),
    }))
}

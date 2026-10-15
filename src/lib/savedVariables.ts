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
}

const asTable = (v: LuaValue | undefined): LuaTable => (v && typeof v === 'object' ? v : {})
const num = (v: LuaValue | undefined) => (typeof v === 'number' ? v : null)
const date = (v: LuaValue | undefined) => (typeof v === 'number' ? new Date(v * 1000) : null)

function items(v: LuaValue | undefined): SnapshotItem[] | null {
  if (!v || typeof v !== 'object') return null
  return Object.values(v)
    .map(asTable)
    .map((i) => ({ id: Number(i.id), name: String(i.name ?? ''), count: Number(i.count ?? 1), quality: num(i.quality) }))
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
    }))
}

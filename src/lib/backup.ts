// "Export backup": downloads everything you can see in The Bloodbound (your crews) as one file on your computer.
import { supabase } from './supabase'

const TABLES = [
  'parties',
  'party_members',
  'players',
  'characters',
  'professions',
  'items',
  'recipes',
  'objectives',
  'bis_items',
  'character_history',
  'events',
]

// Supabase hands back at most 1,000 rows at a time, so fetch big tables in pages.
async function fetchAll(table: string) {
  const rows: unknown[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999)
    if (error) {
      // A table from a database update that hasn't been run yet: skip it rather than fail the whole backup.
      if (/does not exist|schema cache/i.test(error.message)) return null
      throw new Error(`${table}: ${error.message}`)
    }
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) return rows
  }
}

export async function downloadBackup() {
  const tables: Record<string, unknown[]> = {}
  for (const t of TABLES) {
    const rows = await fetchAll(t)
    if (rows) tables[t] = rows
  }
  const backup = { app: 'The Bloodbound', exportedAt: new Date().toISOString(), tables }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `bloodbound-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  return Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length]))
}

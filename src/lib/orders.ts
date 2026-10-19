// Gathering orders look like "Get 20 Copper Ore" (the Professions planner writes them that way).
// This works out how many of that item the crew already holds, across everyone's bags and banks.
import type { Item } from '../types'

export function orderProgress(title: string, items: Item[]): { have: number; want: number; item: string } | null {
  const m = /^Get (\d+) (.+)$/.exec(title.trim())
  if (!m) return null
  const want = Number(m[1])
  const item = m[2]
  const name = item.toLowerCase()
  const have = items.filter((i) => i.name.toLowerCase() === name).reduce((sum, i) => sum + i.quantity, 0)
  return { have: Math.min(have, want), want, item }
}

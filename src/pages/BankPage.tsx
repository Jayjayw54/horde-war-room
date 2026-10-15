// The shared bank: everything in both players' bags and banks, searchable. "Who has copper ore?"
import { useMemo, useState } from 'react'
import { timeAgo } from '../lib/format'
import { classColors } from '../lib/labels'
import type { WarRoom } from '../state/useWarRoom'

interface Holder {
  characterId: string
  bags: number
  bank: number
}

interface Stack {
  itemId: number
  name: string
  total: number
  holders: Holder[]
}

export function BankPage({ warRoom }: { warRoom: WarRoom }) {
  const [query, setQuery] = useState('')

  // Group rows by item, so each item appears once with everyone who has it.
  const stacks = useMemo(() => {
    const byItem = new Map<number, Stack>()
    for (const row of warRoom.items) {
      const stack = byItem.get(row.itemId) ?? { itemId: row.itemId, name: row.name, total: 0, holders: [] }
      let holder = stack.holders.find((h) => h.characterId === row.characterId)
      if (!holder) {
        holder = { characterId: row.characterId, bags: 0, bank: 0 }
        stack.holders.push(holder)
      }
      holder[row.location] += row.quantity
      stack.total += row.quantity
      byItem.set(row.itemId, stack)
    }
    return [...byItem.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [warRoom.items])

  const q = query.trim().toLowerCase()
  const shown = q ? stacks.filter((s) => s.name.toLowerCase().includes(q)) : stacks
  const character = (id: string) => warRoom.characters.find((c) => c.id === id)
  const owner = (playerId: string) => warRoom.players.find((p) => p.id === playerId)?.displayName ?? ''
  const neverBanked = warRoom.characters.filter((c) => !c.bankSeenAt)

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold">Bank</h2>
      <p className="mt-1 text-ash">Everything in both your bags and banks. Who has what?</p>

      <label htmlFor="bank-search" className="sr-only">
        Search items
      </label>
      <input
        id="bank-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Who has… e.g. copper ore, linen, potion"
        className="mt-4 w-full max-w-xl rounded-md border border-leather-light bg-ink px-4 py-3 text-lg text-parchment placeholder:text-ash/70"
        autoFocus
      />
      <p className="mt-2 text-xs text-ash">
        {shown.length} of {stacks.length} items. Bags update whenever you play a toon; banks update when you open the bank in game.
        {neverBanked.length > 0 && <> Bank not seen yet for: {neverBanked.map((c) => c.name).join(', ')}.</>}
      </p>

      {stacks.length === 0 ? (
        <p className="mt-6 text-ash">Nothing here yet. Update the addon to v0.3.0, play a toon, then use Import from game on the Roster.</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-ash">Nobody has anything matching “{query}”.</p>
      ) : (
        <ul className="mt-6 divide-y divide-ink bg-leather">
          {shown.map((s) => (
            <li key={s.itemId} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-parchment">{s.name}</span>
                <span className="font-display text-lg font-bold text-gold tabular-nums">{s.total.toLocaleString()}</span>
              </div>
              <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {s.holders
                  .sort((a, b) => b.bags + b.bank - (a.bags + a.bank))
                  .map((h) => {
                    const c = character(h.characterId)
                    if (!c) return null
                    return (
                      <li key={h.characterId}>
                        <span style={{ color: classColors[c.className] }}>{c.name}</span>
                        <span className="text-ash"> ({owner(c.playerId)})</span>{' '}
                        {h.bags > 0 && <span className="tabular-nums">{h.bags} in bags</span>}
                        {h.bags > 0 && h.bank > 0 && ', '}
                        {h.bank > 0 && (
                          <span className="tabular-nums" title={`Bank seen ${timeAgo(c.bankSeenAt)}`}>
                            {h.bank} in bank
                          </span>
                        )}
                      </li>
                    )
                  })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

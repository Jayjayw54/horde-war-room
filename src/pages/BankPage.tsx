// The shared bank: everything in the crew's bags and banks. Grid (like bags) or list, searchable.
import { useMemo, useState } from 'react'
import { ItemIcon, qualityColor } from '../components/bank/ItemIcon'
import { PageHeader } from '../components/layout/PageHeader'
import { timeAgo } from '../lib/format'
import { orderProgress } from '../lib/orders'
import { classColors } from '../lib/labels'
import type { WarRoom } from '../state/useWarRoom'
import type { PlayerId } from '../types'

interface Holder {
  characterId: string
  bags: number
  bank: number
}

interface Stack {
  itemId: number
  name: string
  quality: number | null
  total: number
  holders: Holder[]
}

type View = 'grid' | 'table'
type Where = 'all' | 'bags' | 'bank'
type Sort = 'name' | 'most' | 'rarity'

const VIEW_KEY = 'hwr-bank-view'
function savedView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'table'
  } catch {
    return 'table'
  }
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
        on ? 'bg-blood text-parchment' : 'bg-leather text-ash hover:text-parchment'
      }`}
    >
      {children}
    </button>
  )
}

export function BankPage({ warRoom, initialQuery = '' }: { warRoom: WarRoom; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [view, setViewState] = useState<View>(savedView)
  const [who, setWho] = useState<PlayerId | 'all'>('all')
  const [where, setWhere] = useState<Where>('all')
  const [sort, setSort] = useState<Sort>('name')
  const [selected, setSelected] = useState<number | null>(null)

  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* fine, it just won't be remembered */
    }
  }

  const character = (id: string) => warRoom.characters.find((c) => c.id === id)
  const owner = (playerId: string) => warRoom.players.find((p) => p.id === playerId)?.displayName ?? ''

  // Group rows by item (after the who/where filters), so each item appears once with everyone who has it.
  const stacks = useMemo(() => {
    const byItem = new Map<number, Stack>()
    for (const row of warRoom.items) {
      if (where !== 'all' && row.location !== where) continue
      const ch = warRoom.characters.find((c) => c.id === row.characterId)
      if (who !== 'all' && ch?.playerId !== who) continue
      const stack = byItem.get(row.itemId) ?? { itemId: row.itemId, name: row.name, quality: row.quality, total: 0, holders: [] }
      let holder = stack.holders.find((h) => h.characterId === row.characterId)
      if (!holder) {
        holder = { characterId: row.characterId, bags: 0, bank: 0 }
        stack.holders.push(holder)
      }
      holder[row.location] += row.quantity
      stack.total += row.quantity
      byItem.set(row.itemId, stack)
    }
    for (const s of byItem.values()) s.holders.sort((a, b) => b.bags + b.bank - (a.bags + a.bank))
    const list = [...byItem.values()]
    if (sort === 'most') list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    else if (sort === 'rarity') list.sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0) || a.name.localeCompare(b.name))
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [warRoom.items, warRoom.characters, who, where, sort])

  const q = query.trim().toLowerCase()
  const shown = q ? stacks.filter((s) => s.name.toLowerCase().includes(q)) : stacks
  const picked = shown.find((s) => s.itemId === selected) ?? null
  const neverBanked = warRoom.characters.filter((c) => !c.bankSeenAt)

  // What open "Get N X" orders still want, by item name, so the table can show shortfalls.
  const needed = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of warRoom.objectives) {
      if (o.status === 'done') continue
      const p = orderProgress(o.title, [])
      if (p) m.set(p.item.toLowerCase(), (m.get(p.item.toLowerCase()) ?? 0) + p.want)
    }
    return m
  }, [warRoom.objectives])
  const crewTotal = (name: string) =>
    warRoom.items.filter((i) => i.name.toLowerCase() === name).reduce((sum, i) => sum + i.quantity, 0)

  function HolderList({ stack }: { stack: Stack }) {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
        {stack.holders.map((h) => {
          const c = character(h.characterId)
          if (!c) return null
          return (
            <li key={h.characterId}>
              <span style={{ color: classColors[c.className] }}>{c.name}</span>
              <span className="text-ash"> ({owner(c.playerId)})</span>{' '}
              {h.bags > 0 && <span className="tabular-nums">{h.bags} bags</span>}
              {h.bags > 0 && h.bank > 0 && ' · '}
              {h.bank > 0 && (
                <span className="tabular-nums" title={`Bank seen ${timeAgo(c.bankSeenAt)}`}>
                  {h.bank} bank
                </span>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section>
      <PageHeader title="Shared stores" subtitle="Everything in the crew's bags and banks: who has what, and what orders still need." />

      <label htmlFor="bank-search" className="sr-only">
        Search items
      </label>
      <input
        id="bank-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Who has… e.g. copper ore, linen, potion"
        className="mt-4 w-full max-w-xl rounded-md border border-leather-light bg-ink px-4 py-2.5 text-parchment placeholder:text-ash/70"
      />

      {/* Filters and view switch */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Whose items">
          <Chip on={who === 'all'} onClick={() => setWho('all')}>
            Everyone
          </Chip>
          {warRoom.players.map((p) => (
            <Chip key={p.id} on={who === p.id} onClick={() => setWho(p.id)}>
              {p.displayName}
            </Chip>
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label="Where">
          <Chip on={where === 'all'} onClick={() => setWhere('all')}>
            Bags + bank
          </Chip>
          <Chip on={where === 'bags'} onClick={() => setWhere('bags')}>
            Bags
          </Chip>
          <Chip on={where === 'bank'} onClick={() => setWhere('bank')}>
            Bank
          </Chip>
        </div>
        <label className="flex items-center gap-2 text-sm text-ash">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded bg-leather px-2 py-1 text-parchment">
            <option value="name">A–Z</option>
            <option value="most">Most</option>
            <option value="rarity">Rarity</option>
          </select>
        </label>
        <div className="ml-auto flex gap-1" role="group" aria-label="View">
          <Chip on={view === 'table'} onClick={() => setView('table')}>
            Table
          </Chip>
          <Chip on={view === 'grid'} onClick={() => setView('grid')}>
            Grid
          </Chip>
        </div>
      </div>

      <p className="mt-2 text-xs text-ash">
        {shown.length} items. Bags update as you play; banks update when you open the bank in game.
        {neverBanked.length > 0 && <> Bank not seen yet for: {neverBanked.map((c) => c.name).join(', ')}.</>}
      </p>

      {(() => {
        const missing = [...needed.entries()].filter(([name, want]) => crewTotal(name) < want)
        if (missing.length === 0) return null
        return (
          <div className="mt-3 panel px-4 py-3 text-sm">
            <p className="font-semibold text-parchment">Orders still need</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {missing.map(([name, want]) => {
                const have = crewTotal(name)
                const label = [...warRoom.objectives]
                  .map((o) => orderProgress(o.title, []))
                  .find((p) => p?.item.toLowerCase() === name)?.item ?? name
                return (
                  <li key={name}>
                    <button type="button" onClick={() => setQuery(label)} className="text-gold hover:underline">
                      {label}
                    </button>{' '}
                    <span className="stat text-ash">
                      {have}/{want}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })()}

      {warRoom.items.length === 0 ? (
        <p className="mt-6 text-ash">Nothing here yet. Update the addon, play a toon, then use Import from game on the Roster.</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-ash">Nothing matching “{query}”.</p>
      ) : view === 'grid' ? (
        <>
          {/* Details for the clicked item */}
          <div className="mt-4 min-h-[4.5rem] panel px-4 py-3" aria-live="polite">
            {picked ? (
              <div className="flex gap-3">
                <ItemIcon itemId={picked.itemId} name={picked.name} quality={picked.quality} size={40} />
                <div className="min-w-0">
                  <p className="font-semibold" style={{ color: qualityColor(picked.quality) }}>
                    {picked.name} <span className="text-gold tabular-nums">×{picked.total.toLocaleString()}</span>
                  </p>
                  <HolderList stack={picked} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-ash">Click an item to see who has it.</p>
            )}
          </div>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1.5">
            {shown.map((s) => (
              <li key={s.itemId}>
                <button
                  type="button"
                  onClick={() => setSelected(s.itemId === selected ? null : s.itemId)}
                  title={`${s.name} ×${s.total}`}
                  aria-label={`${s.name}, ${s.total}`}
                  aria-pressed={s.itemId === selected}
                  className={`relative block rounded transition-transform hover:scale-110 ${
                    s.itemId === selected ? 'ring-2 ring-gold ring-offset-2 ring-offset-ink' : ''
                  }`}
                >
                  <ItemIcon itemId={s.itemId} name={s.name} quality={s.quality} size={48} />
                  {s.total > 1 && (
                    <span className="absolute right-1 bottom-0.5 text-xs font-bold text-white tabular-nums [text-shadow:0_0_2px_#000,0_0_2px_#000]">
                      {s.total > 999 ? `${Math.floor(s.total / 1000)}k` : s.total}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-4 panel overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-rim text-xs tracking-wide text-ash uppercase">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Item</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Crew has</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Held by</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Orders need</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rim/60">
              {shown.map((s) => {
                const need = needed.get(s.name.toLowerCase())
                const have = need ? crewTotal(s.name.toLowerCase()) : 0
                return (
                  <tr key={s.itemId} className="align-top hover:bg-leather-light/40">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <ItemIcon itemId={s.itemId} name={s.name} quality={s.quality} size={28} />
                        <span className="font-semibold" style={{ color: qualityColor(s.quality) }}>
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="stat px-3 py-2 text-right text-base text-gold">{s.total.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <HolderList stack={s} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {need ? (
                        <span className={`stat text-base ${have >= need ? 'text-success' : 'text-warning'}`}>
                          {need.toLocaleString()}
                          {have < need && <span className="ml-1 text-xs text-ash">({need - have} short)</span>}
                        </span>
                      ) : (
                        <span className="text-ash/60">–</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

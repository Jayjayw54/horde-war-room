// The shared bank: everything in the crew's bags and banks. Grid (like bags) or list, searchable.
import { useMemo, useState } from 'react'
import { ItemIcon, qualityColor } from '../components/bank/ItemIcon'
import { timeAgo } from '../lib/format'
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

type View = 'grid' | 'list'
type Where = 'all' | 'bags' | 'bank'
type Sort = 'name' | 'most' | 'rarity'

const VIEW_KEY = 'hwr-bank-view'
function savedView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
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
      <h2 className="font-display text-2xl font-semibold text-gold sm:text-3xl">Bank</h2>
      <p className="mt-1 text-ash">Everything in the crew's bags and banks. Who has what?</p>

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
          <Chip on={view === 'grid'} onClick={() => setView('grid')}>
            ▦ Grid
          </Chip>
          <Chip on={view === 'list'} onClick={() => setView('list')}>
            ☰ List
          </Chip>
        </div>
      </div>

      <p className="mt-2 text-xs text-ash">
        {shown.length} items. Bags update as you play; banks update when you open the bank in game.
        {neverBanked.length > 0 && <> Bank not seen yet for: {neverBanked.map((c) => c.name).join(', ')}.</>}
      </p>

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
        <ul className="mt-4 panel divide-y divide-ink">
          {shown.map((s) => (
            <li key={s.itemId} className="flex items-start gap-3 px-3 py-2">
              <ItemIcon itemId={s.itemId} name={s.name} quality={s.quality} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-semibold" style={{ color: qualityColor(s.quality) }}>
                    {s.name}
                  </span>
                  <span className="font-bold text-gold tabular-nums">{s.total.toLocaleString()}</span>
                </div>
                <HolderList stack={s} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

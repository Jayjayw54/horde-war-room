// BiS: each toon's best-in-slot wishlist, ticked off automatically from what they wear and carry,
// plus links to the class guides to find out what BiS is.
import { useState, type FormEvent } from 'react'
import { ItemIcon } from '../components/bank/ItemIcon'
import { SPEC_GUIDES } from '../lib/guides'
import { classColors } from '../lib/labels'
import { BIS_SLOTS, SLOT_NAMES } from '../lib/slots'
import type { WarRoom } from '../state/useWarRoom'
import type { BisItem, Character } from '../types'

type Status = { label: string; tone: 'done' | 'close' | 'need' }

export function BisPage({ warRoom }: { warRoom: WarRoom }) {
  const { characters } = warRoom
  const defaultToon =
    characters.filter((c) => c.playerId === warRoom.me?.id).sort((a, b) => b.level - a.level)[0] ?? characters[0]
  const [toonId, setToonId] = useState<string | undefined>(defaultToon?.id)
  const toon = characters.find((c) => c.id === toonId)

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold">Best in slot</h2>
      <p className="mt-1 text-ash">
        What each toon is chasing. Items tick off by themselves once they show up in the toon's gear, bags or bank.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Toon">
        {characters.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={c.id === toonId}
            onClick={() => setToonId(c.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              c.id === toonId ? 'bg-leather-light' : 'bg-leather text-ash hover:text-parchment'
            }`}
            style={c.id === toonId ? { color: classColors[c.className] } : undefined}
          >
            {c.name}
          </button>
        ))}
      </div>

      {toon ? <Wishlist toon={toon} warRoom={warRoom} /> : <p className="mt-6 text-ash">Import some toons first.</p>}
    </section>
  )
}

function Wishlist({ toon, warRoom }: { toon: Character; warRoom: WarRoom }) {
  const wishes = warRoom.bis.filter((b) => b.characterId === toon.id)
  const guides = SPEC_GUIDES[toon.className] ?? []

  function statusOf(b: BisItem): Status {
    const matches = (id: number | null, name: string) =>
      (b.itemId !== null && id === b.itemId) || name.toLowerCase() === b.itemName.toLowerCase()
    if ((toon.gear ?? []).some((g) => matches(g.id, g.name))) return { label: 'Equipped', tone: 'done' }
    const mine = warRoom.items.find((i) => i.characterId === toon.id && matches(i.itemId, i.name))
    if (mine) return { label: `In ${mine.location}, equip it!`, tone: 'close' }
    const other = warRoom.items.find((i) => matches(i.itemId, i.name))
    if (other) {
      const holder = warRoom.characters.find((c) => c.id === other.characterId)
      return { label: `${holder?.name ?? 'Someone'} has one`, tone: 'close' }
    }
    return { label: 'Needed', tone: 'need' }
  }

  const done = wishes.filter((b) => statusOf(b).tone === 'done').length

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="bg-leather p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-semibold" style={{ color: classColors[toon.className] }}>
            {toon.name}
          </h3>
          {wishes.length > 0 && (
            <p className="text-sm text-ash">
              <span className="font-semibold text-parchment tabular-nums">
                {done} / {wishes.length}
              </span>{' '}
              equipped
            </p>
          )}
        </div>

        {wishes.length === 0 ? (
          <p className="mt-3 text-sm text-ash">No BiS items yet. Add the first one below.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink">
            {[...wishes]
              .sort((a, b) => BIS_SLOTS.indexOf(a.slot) - BIS_SLOTS.indexOf(b.slot))
              .map((b) => {
                const st = statusOf(b)
                return (
                  <li key={b.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-20 shrink-0 text-xs text-ash">{SLOT_NAMES[b.slot]}</span>
                    {b.itemId ? <ItemIcon itemId={b.itemId} name={b.itemName} quality={null} size={24} /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{b.itemName}</p>
                      {b.note && <p className="truncate text-xs text-ash">{b.note}</p>}
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        st.tone === 'done' ? 'text-[#1eff00]' : st.tone === 'close' ? 'text-gold' : 'text-ash'
                      }`}
                    >
                      {st.tone === 'done' ? '✓ ' : ''}
                      {st.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => warRoom.removeBis(b.id)}
                      aria-label={`Remove ${b.itemName}`}
                      className="shrink-0 px-1 text-ash hover:text-blood-light"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
          </ul>
        )}

        <AddBis toon={toon} warRoom={warRoom} />
      </div>

      <aside className="bg-leather p-4">
        <h3 className="font-display font-semibold text-parchment">{toon.className} guides</h3>
        <p className="mt-1 text-xs text-ash">Icy Veins' WoW: Forever guides. Each has a gear and stat priority section.</p>
        <ul className="mt-2 space-y-1 text-sm">
          {guides.map((g) => (
            <li key={g.url}>
              <a href={g.url} target="_blank" rel="noreferrer" className="text-gold underline hover:text-parchment">
                {g.spec} {toon.className}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ash">
          Tip: copy an item's Wowhead link into the "Item" box and it'll show the item's icon.
        </p>
      </aside>
    </div>
  )
}

function AddBis({ toon, warRoom }: { toon: Character; warRoom: WarRoom }) {
  const [slot, setSlot] = useState(BIS_SLOTS[0])
  const [item, setItem] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = item.trim()
    if (!text) return
    // Accept a plain name, or a Wowhead link like https://www.wowhead.com/classic/item=2770/copper-ore
    const idMatch = /item=(\d+)/.exec(text)
    const slugName = /item=\d+\/([a-z0-9-]+)/.exec(text)?.[1]
    const itemName = idMatch
      ? (slugName ?? `Item ${idMatch[1]}`).replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
      : text
    const problem = await warRoom.addBis({
      characterId: toon.id,
      slot,
      itemName,
      itemId: idMatch ? Number(idMatch[1]) : null,
      note: note.trim() || null,
    })
    if (problem) setError(problem)
    else {
      setItem('')
      setNote('')
      setError('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-2 border-t border-ink pt-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-gold">
        Slot
        <select value={slot} onChange={(e) => setSlot(Number(e.target.value))} className="rounded bg-ink px-2 py-1.5 text-sm text-parchment">
          {BIS_SLOTS.map((s) => (
            <option key={s} value={s}>
              {SLOT_NAMES[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold text-gold">
        Item (name or Wowhead link)
        <input value={item} onChange={(e) => setItem(e.target.value)} required className="rounded bg-ink px-2 py-1.5 text-sm text-parchment" />
      </label>
      <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-semibold text-gold">
        Where from (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Ragefire Chasm" className="rounded bg-ink px-2 py-1.5 text-sm text-parchment placeholder:text-ash/60" />
      </label>
      <button type="submit" className="rounded bg-blood px-4 py-1.5 font-semibold hover:bg-blood-light">
        Add
      </button>
      {error && <p className="w-full text-sm text-blood-light">{error}</p>}
    </form>
  )
}

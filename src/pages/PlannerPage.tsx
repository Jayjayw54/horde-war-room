// Profession planner: pick something to craft, and see the materials, what the shared bank already has,
// what's missing, and who should craft it.
import { useMemo, useState } from 'react'
import { ItemIcon } from '../components/bank/ItemIcon'
import { classColors } from '../lib/labels'
import type { WarRoom } from '../state/useWarRoom'
import type { Character, Recipe } from '../types'

interface KnownRecipe {
  key: string // profession + name
  name: string
  profession: string
  itemId: number | null
  makes: number
  reagents: Recipe['reagents']
  crafters: Character[]
}

export function PlannerPage({ warRoom }: { warRoom: WarRoom }) {
  const [query, setQuery] = useState('')
  const [profession, setProfession] = useState('all')
  const [pickedKey, setPickedKey] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const character = (id: string) => warRoom.characters.find((c) => c.id === id)
  const owner = (playerId: string) => warRoom.players.find((p) => p.id === playerId)?.displayName ?? ''

  // Merge everyone's recipes: one entry per recipe, listing every toon who knows it.
  const known = useMemo(() => {
    const byKey = new Map<string, KnownRecipe>()
    for (const r of warRoom.recipes) {
      const key = `${r.profession}|${r.name}`
      const entry = byKey.get(key) ?? {
        key,
        name: r.name,
        profession: r.profession,
        itemId: r.itemId,
        makes: r.makes ?? 1,
        reagents: r.reagents,
        crafters: [],
      }
      const c = character(r.characterId)
      if (c && !entry.crafters.includes(c)) entry.crafters.push(c)
      byKey.set(key, entry)
    }
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [warRoom.recipes, warRoom.characters])

  const professions = [...new Set(known.map((k) => k.profession))].sort()
  const q = query.trim().toLowerCase()
  const shown = known.filter((k) => (profession === 'all' || k.profession === profession) && (!q || k.name.toLowerCase().includes(q)))
  const picked = known.find((k) => k.key === pickedKey) ?? null

  // How many of an item the shared bank holds, and where.
  const holdings = (itemId: number | null, name: string) => {
    const rows = warRoom.items.filter((i) => (itemId ? i.itemId === itemId : i.name === name))
    const byToon = new Map<string, number>()
    for (const r of rows) byToon.set(r.characterId, (byToon.get(r.characterId) ?? 0) + r.quantity)
    return { total: rows.reduce((sum, r) => sum + r.quantity, 0), byToon }
  }

  const crafts = picked ? Math.ceil(quantity / picked.makes) : 0
  const plan = picked
    ? picked.reagents.map((g) => {
        const need = g.count * crafts
        const have = holdings(g.id, g.name)
        const makers = known.filter((k) => (g.id ? k.itemId === g.id : k.name === g.name))
        return { ...g, need, have, missing: Math.max(0, need - have.total), makers }
      })
    : []

  // Suggested crafter: whoever knows it and already holds the most of the materials (less mailing around).
  const suggested = picked
    ? [...picked.crafters].sort((a, b) => {
        const held = (c: Character) => plan.reduce((sum, g) => sum + Math.min(g.need, g.have.byToon.get(c.id) ?? 0), 0)
        return held(b) - held(a)
      })[0]
    : null

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold">Profession planner</h2>
      <p className="mt-1 text-ash">Pick something to craft. See the materials, what you already have between you, and who should make it.</p>

      {known.length === 0 ? (
        <p className="mt-6 text-ash">
          No recipes yet. With addon v0.5.0, open each profession window once in game (that's the only time the game shares
          recipes), then /reload and use Import from game on the Roster.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
          {/* Recipe picker */}
          <div className="bg-leather p-3">
            <label htmlFor="recipe-search" className="sr-only">
              Search recipes
            </label>
            <input
              id="recipe-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes…"
              className="w-full rounded bg-ink px-3 py-2 text-parchment placeholder:text-ash/70"
            />
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              aria-label="Profession"
              className="mt-2 w-full rounded bg-ink px-2 py-1.5 text-sm"
            >
              <option value="all">All professions ({known.length})</option>
              {professions.map((p) => (
                <option key={p} value={p}>
                  {p} ({known.filter((k) => k.profession === p).length})
                </option>
              ))}
            </select>
            <ul className="mt-2 max-h-[28rem] overflow-y-auto">
              {shown.map((k) => (
                <li key={k.key}>
                  <button
                    type="button"
                    onClick={() => setPickedKey(k.key)}
                    aria-pressed={k.key === pickedKey}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${
                      k.key === pickedKey ? 'bg-blood text-parchment' : 'hover:bg-leather-light'
                    }`}
                  >
                    {k.itemId ? <ItemIcon itemId={k.itemId} name={k.name} quality={null} size={20} /> : null}
                    <span className="min-w-0 flex-1 truncate">{k.name}</span>
                    <span className="shrink-0 text-xs text-ash">{k.profession}</span>
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="px-2 py-1 text-sm text-ash">No matches.</li>}
            </ul>
          </div>

          {/* The plan */}
          <div className="bg-leather p-4">
            {!picked ? (
              <p className="text-ash">Choose a recipe on the left.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  {picked.itemId && <ItemIcon itemId={picked.itemId} name={picked.name} quality={null} size={40} />}
                  <div>
                    <h3 className="font-display text-xl font-semibold text-parchment">{picked.name}</h3>
                    <p className="text-sm text-ash">
                      {picked.profession}
                      {picked.makes > 1 && ` · makes ${picked.makes} per craft`}
                    </p>
                  </div>
                  <label className="ml-auto flex items-center gap-2 text-sm">
                    How many?
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 rounded bg-ink px-2 py-1 text-right tabular-nums"
                    />
                  </label>
                </div>

                <p className="mt-3 text-sm">
                  Who can craft it:{' '}
                  {picked.crafters.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ', '}
                      <span style={{ color: classColors[c.className] }}>{c.name}</span>
                      <span className="text-ash"> ({owner(c.playerId)})</span>
                    </span>
                  ))}
                </p>
                {suggested && picked.crafters.length > 1 && (
                  <p className="text-sm text-gold">Suggested: {suggested.name}, who already holds the most of the materials.</p>
                )}

                <table className="mt-4 w-full text-left text-sm">
                  <thead className="text-ash">
                    <tr>
                      <th className="py-1 font-semibold">Material</th>
                      <th className="py-1 text-right font-semibold">Need</th>
                      <th className="py-1 text-right font-semibold">Have</th>
                      <th className="py-1 text-right font-semibold">Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.map((g) => (
                      <tr key={`${g.id}-${g.name}`} className="border-t border-ink align-top">
                        <td className="py-1.5">
                          <div className="flex items-center gap-2">
                            {g.id ? <ItemIcon itemId={g.id} name={g.name} quality={null} size={20} /> : null}
                            {g.name}
                          </div>
                          {g.have.byToon.size > 0 && (
                            <p className="mt-0.5 text-xs text-ash">
                              {[...g.have.byToon.entries()].map(([id, n]) => `${character(id)?.name ?? '?'} ${n}`).join(' · ')}
                            </p>
                          )}
                          {g.missing > 0 && g.makers.length > 0 && (
                            <p className="mt-0.5 text-xs text-gold">
                              Can be crafted: {g.makers.map((m) => `${m.name} (${m.crafters.map((c) => c.name).join(', ')})`).join('; ')}
                            </p>
                          )}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{g.need}</td>
                        <td className="py-1.5 text-right tabular-nums">{g.have.total}</td>
                        <td className={`py-1.5 text-right font-semibold tabular-nums ${g.missing > 0 ? 'text-blood-light' : 'text-[#1eff00]'}`}>
                          {g.missing > 0 ? g.missing : '✓'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {plan.length === 0 && <p className="mt-3 text-sm text-ash">The game didn't share this recipe's materials.</p>}
                {plan.length > 0 && plan.every((g) => g.missing === 0) && (
                  <p className="mt-3 font-semibold text-[#1eff00]">You've got everything between you. Get crafting.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

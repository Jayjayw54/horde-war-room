// Progress: the levelling race and gold over time, built from the history saved on every import.
import { useState } from 'react'
import { LineChart, type Series } from '../components/charts/LineChart'
import { Money } from '../components/Money'
import { timeAgo } from '../lib/format'
import type { WarRoom } from '../state/useWarRoom'

// Categorical colours checked for colour-blind separation and contrast on our dark background.
const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
const MAX_LINES = PALETTE.length

export function ProgressPage({ warRoom }: { warRoom: WarRoom }) {
  const { characters, players, history } = warRoom
  const owner = (id: string) => players.find((p) => p.id === id)?.displayName ?? ''

  // Default: each player's highest-level toon — that's the race.
  const [selected, setSelected] = useState<string[]>(() =>
    players
      .map((p) => [...characters].filter((c) => c.playerId === p.id).sort((a, b) => b.level - a.level)[0]?.id)
      .filter((id): id is string => !!id)
      .slice(0, MAX_LINES),
  )
  const [showTable, setShowTable] = useState(false)

  // Colour follows the toon, not its position in the selection (so toggling others never repaints it).
  // With more toons than colours, colours go to whichever toons are picked, in the order picked.
  const colorOf = (id: string) => {
    const idx = characters.length <= MAX_LINES ? characters.findIndex((c) => c.id === id) : selected.indexOf(id)
    return PALETTE[idx] ?? '#a3a6a5'
  }

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_LINES ? prev : [...prev, id]))

  // Levelling race: level plus progress into the level (e.g. 20.45 = level 20, 45% of the way to 21).
  const levelSeries: Series[] = selected
    .map((id) => characters.find((c) => c.id === id))
    .filter((c) => !!c)
    .map((c) => ({
      id: c.id,
      label: c.name,
      color: colorOf(c.id),
      points: history
        .filter((h) => h.characterId === c.id)
        .map((h) => ({ t: new Date(h.recordedAt).getTime(), v: h.level + (h.xp && h.xpMax ? h.xp / h.xpMax : 0) })),
    }))

  // Gold per player: at each recorded moment, add up every toon's most recent known gold.
  const goldSeries: Series[] = players.map((p, i) => {
    const toonIds = characters.filter((c) => c.playerId === p.id).map((c) => c.id)
    const rows = history.filter((h) => toonIds.includes(h.characterId) && h.gold !== null)
    const latest = new Map<string, number>()
    const points = rows.map((h) => {
      latest.set(h.characterId, h.gold!)
      return { t: new Date(h.recordedAt).getTime(), v: [...latest.values()].reduce((a, b) => a + b, 0) / 10000 }
    })
    return { id: p.id, label: p.displayName, color: PALETTE[i] ?? '#a3a6a5', points }
  })

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold sm:text-3xl">Progress</h2>
      <p className="mt-1 text-ash">The levelling race and the crew's gold over time. A new point is added every time you sync.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Toons on the chart">
        {characters.map((c) => {
          const on = selected.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                on ? 'bg-leather-light text-parchment' : 'bg-leather text-ash hover:text-parchment'
              }`}
            >
              {on && <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(c.id) }} />}
              {c.name}
              <span className="font-normal text-ash">{c.level}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-xs text-ash">Pick up to {MAX_LINES} toons. Starts with each player's highest level toon.</p>

      <div className="panel mt-4 p-4">
        <h3 className="font-display text-lg font-semibold text-parchment">Levelling race</h3>
        <LineChart title="Level over time" series={levelSeries} format={(v) => v.toFixed(v % 1 ? 1 : 0)} />
      </div>

      <div className="panel mt-4 p-4">
        <h3 className="font-display text-lg font-semibold text-parchment">Gold by player</h3>
        <LineChart title="Total gold per player over time" series={goldSeries} format={(v) => `${Math.round(v).toLocaleString()}g`} />
      </div>

      <button type="button" onClick={() => setShowTable((s) => !s)} className="mt-4 text-sm text-gold underline hover:text-parchment">
        {showTable ? 'Hide' : 'Show'} as a table
      </button>
      {showTable && (
        <table className="mt-2 w-full panel text-left text-sm">
          <thead className="text-ash">
            <tr>
              <th className="px-3 py-2 font-semibold">Toon</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 text-right font-semibold">Level</th>
              <th className="px-3 py-2 text-right font-semibold">Gold</th>
              <th className="px-3 py-2 text-right font-semibold">Imports</th>
              <th className="px-3 py-2 font-semibold">Last played</th>
            </tr>
          </thead>
          <tbody>
            {[...characters]
              .sort((a, b) => b.level - a.level)
              .map((c) => (
                <tr key={c.id} className="border-t border-ink">
                  <td className="px-3 py-1.5">{c.name}</td>
                  <td className="px-3 py-1.5 text-ash">{owner(c.playerId)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{c.level}</td>
                  <td className="px-3 py-1.5 text-right">
                    <Money copper={c.gold} />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{history.filter((h) => h.characterId === c.id).length}</td>
                  <td className="px-3 py-1.5 text-ash">{timeAgo(c.lastPlayed)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

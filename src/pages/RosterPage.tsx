// The Roster: every character the crew plays. A searchable table (filter by class and profession),
// or the detailed cards (stats, gear, weapons). Filled from the game with "Import from game".
import { useMemo, useState } from 'react'
import { SearchIcon } from '../components/brand/Icons'
import { PageHeader } from '../components/layout/PageHeader'
import { Money } from '../components/Money'
import { CharacterCard } from '../components/roster/CharacterCard'
import { ImportPanel } from '../components/roster/ImportPanel'
import { Avatar, classIcon } from '../components/roster/Portrait'
import { timeAgo } from '../lib/format'
import { classColors } from '../lib/labels'
import type { WarRoom } from '../state/useWarRoom'
import type { Character } from '../types'

type View = 'table' | 'cards'
const VIEW_KEY = 'hwr-roster-view'
function savedView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table'
  } catch {
    return 'table'
  }
}

// Played in the last day counts as "recently active"; the game doesn't tell us who is online right now.
const RECENT_MS = 24 * 60 * 60 * 1000
const recentlyActive = (c: Character) => !!c.lastPlayed && Date.now() - new Date(c.lastPlayed).getTime() < RECENT_MS

export function RosterPage({ warRoom, initialQuery = '' }: { warRoom: WarRoom; initialQuery?: string }) {
  const [importing, setImporting] = useState(false)
  const [view, setViewState] = useState<View>(savedView)
  const [query, setQuery] = useState(initialQuery)
  const [klass, setKlass] = useState('all')
  const [profession, setProfession] = useState('all')
  const { characters, players } = warRoom
  const totalGold = characters.reduce((sum, c) => sum + c.gold, 0)
  const owner = (c: Character) => players.find((p) => p.id === c.playerId)?.displayName ?? ''

  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* fine */
    }
  }

  const classes = useMemo(() => [...new Set(characters.map((c) => c.className))].sort(), [characters])
  const professions = useMemo(
    () => [...new Set(characters.flatMap((c) => c.professions.map((p) => p.name)))].sort(),
    [characters],
  )

  // Mains first, then highest level (and furthest into it), then A–Z.
  const progress = (c: Character) => c.level + (c.xp && c.xpMax ? c.xp / c.xpMax : 0)
  const q = query.trim().toLowerCase()
  const shown = characters
    .filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q) || owner(c).toLowerCase().includes(q)) &&
        (klass === 'all' || c.className === klass) &&
        (profession === 'all' || c.professions.some((p) => p.name === profession)),
    )
    .sort((a, b) => Number(b.isMain) - Number(a.isMain) || progress(b) - progress(a) || a.name.localeCompare(b.name))

  const select = 'rounded-md border border-rim bg-leather px-2.5 py-2 text-sm text-parchment'
  const tab = (on: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${on ? 'bg-blood text-parchment' : 'text-ash hover:text-parchment'}`

  return (
    <section>
      <PageHeader
        title="Roster"
        subtitle={
          <>
            Every character your crew plays, straight from the game. Crew gold:{' '}
            <Money copper={totalGold} className="font-semibold text-parchment" />
          </>
        }
        actions={
          !importing && (
            <button type="button" onClick={() => setImporting(true)} className="rounded-md bg-blood px-4 py-2 font-semibold hover:bg-blood-light">
              Import from game
            </button>
          )
        }
      />

      {importing && (
        <div className="mt-6">
          <ImportPanel warRoom={warRoom} onClose={() => setImporting(false)} />
        </div>
      )}

      {/* Toolbar: view switch, search, filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-rim bg-leather p-0.5" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} className={tab(view === 'table')}>
            Table
          </button>
          <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')} className={tab(view === 'cards')}>
            Cards
          </button>
        </div>
        <div className="relative min-w-0 flex-1 basis-56">
          <label htmlFor="roster-search" className="sr-only">
            Search characters
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ash" />
          <input
            id="roster-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters or players…"
            className="w-full rounded-md border border-rim bg-leather py-2 pr-3 pl-9 text-sm text-parchment placeholder:text-ash/70 focus:border-gold/60 focus:outline-none"
          />
        </div>
        <label className="sr-only" htmlFor="roster-class">
          Class
        </label>
        <select id="roster-class" value={klass} onChange={(e) => setKlass(e.target.value)} className={select}>
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="roster-prof">
          Profession
        </label>
        <select id="roster-prof" value={profession} onChange={(e) => setProfession(e.target.value)} className={select}>
          <option value="all">All professions</option>
          {professions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {characters.length === 0 ? (
        <p className="panel mt-6 p-6 text-ash">No characters yet. Use Import from game, or set up the addon on the Crew page.</p>
      ) : shown.length === 0 ? (
        <p className="panel mt-6 p-6 text-ash">No characters match. Try clearing the search or filters.</p>
      ) : view === 'table' ? (
        <div className="panel mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-rim text-xs text-ash">
                <th scope="col" className="px-4 py-3 font-semibold">Character</th>
                <th scope="col" className="px-3 py-3 font-semibold">Level</th>
                <th scope="col" className="px-3 py-3 font-semibold">Class</th>
                <th scope="col" className="px-3 py-3 font-semibold">Professions</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Gold</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last played</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rim/60">
              {shown.map((c) => {
                const color = classColors[c.className] ?? '#e7e2d8'
                const pct = c.xp && c.xpMax && c.level < 60 ? Math.round((c.xp / c.xpMax) * 100) : null
                return (
                  <tr key={c.id} className="transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-3">
                        <Avatar character={c} color={color} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-parchment">
                            {c.name}
                            {c.isMain && <span className="ml-1.5 text-gold" title="Main">★</span>}
                          </span>
                          <span className="block text-xs text-ash">{owner(c)}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="stat text-lg font-semibold text-parchment">{c.level}</span>
                      {pct !== null && <span className="ml-1.5 text-xs text-ash">{pct}%</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 font-semibold" style={{ color }}>
                        <img src={classIcon(c)} alt="" className="h-5 w-5 rounded-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        {c.className}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-ash">
                      {c.professions.length === 0
                        ? '—'
                        : c.professions.map((p, i) => (
                            <span key={p.id}>
                              {i > 0 && ' / '}
                              {p.name} <span className="stat text-parchment/80">{p.skillLevel}</span>
                            </span>
                          ))}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Money copper={c.gold} className="text-parchment" />
                    </td>
                    <td className="px-4 py-2.5">
                      {recentlyActive(c) ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {timeAgo(c.lastPlayed)}
                        </span>
                      ) : (
                        <span className="text-xs text-ash">{c.lastPlayed ? timeAgo(c.lastPlayed) : 'not yet'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards: one column per player, you first. Bigger crews wrap onto more rows. */
        <div className={`mt-6 grid gap-6 md:grid-cols-2 ${players.length > 2 ? 'xl:grid-cols-3' : ''}`}>
          {players.map((player) => {
            const toons = shown.filter((c) => c.playerId === player.id)
            if (toons.length === 0 && (q || klass !== 'all' || profession !== 'all')) return null
            const gold = toons.reduce((sum, c) => sum + c.gold, 0)
            return (
              <div key={player.id}>
                <header className="flex items-center justify-between gap-3">
                  <h3 className="ribbon flex-1 py-1.5 pr-10 pl-4 font-display text-2xl font-extrabold tracking-wide text-gold [text-shadow:0_1px_0_rgba(0,0,0,0.5)]">
                    {player.displayName}
                  </h3>
                  <p className="shrink-0 text-right text-sm text-ash">
                    {toons.length} {toons.length === 1 ? 'toon' : 'toons'}
                    <br />
                    <Money copper={gold} className="text-parchment" />
                  </p>
                </header>
                <div className="mt-3 space-y-3">
                  {toons.length === 0 && <p className="text-sm text-ash">No toons yet. Use Import from game.</p>}
                  {toons.map((c) => (
                    <CharacterCard
                      key={c.id}
                      character={c}
                      owner={player.displayName}
                      onToggleMain={player.id === warRoom.me?.id ? () => warRoom.setMain(c.id, !c.isMain) : undefined}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

import { useState } from 'react'
import { CharacterCard } from '../components/roster/CharacterCard'
import { ImportPanel } from '../components/roster/ImportPanel'
import { Money } from '../components/Money'
import type { WarRoom } from '../state/useWarRoom'

// The roster is filled from the game: use "Import from game" with the addon's file.
export function RosterPage({ warRoom }: { warRoom: WarRoom }) {
  const [importing, setImporting] = useState(false)
  const totalGold = warRoom.characters.reduce((sum, c) => sum + c.gold, 0)

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-gold">Roster</h2>
          <p className="mt-1 text-ash">Every character your crew plays, mains and alts, straight from the game.</p>
          <p className="mt-1 text-sm text-ash">
            War chest: <Money copper={totalGold} className="font-semibold text-parchment" />
          </p>
        </div>
        {!importing && (
          <button
            type="button"
            onClick={() => setImporting(true)}
            className="rounded bg-blood px-4 py-2 font-semibold hover:bg-blood-light"
          >
            Import from game
          </button>
        )}
      </div>

      {importing && (
        <div className="mt-6">
          <ImportPanel warRoom={warRoom} onClose={() => setImporting(false)} />
        </div>
      )}

      {/* One column per player: you on the left, then everyone else. Bigger parties wrap onto more rows. */}
      <div className={`mt-6 grid gap-6 md:grid-cols-2 ${warRoom.players.length > 2 ? 'xl:grid-cols-3' : ''}`}>
        {warRoom.players.map((player) => {
          // Starred mains first, then highest level (and furthest into that level), then A–Z.
          const progress = (c: (typeof warRoom.characters)[number]) => c.level + (c.xp && c.xpMax ? c.xp / c.xpMax : 0)
          const toons = warRoom.characters
            .filter((c) => c.playerId === player.id)
            .sort((a, b) => Number(b.isMain) - Number(a.isMain) || progress(b) - progress(a) || a.name.localeCompare(b.name))
          const gold = toons.reduce((sum, c) => sum + c.gold, 0)
          return (
            <div key={player.id}>
              {/* Player banner */}
              <header className="flex items-center justify-between gap-3">
                <h3 className="ribbon flex-1 py-1.5 pr-10 pl-4 font-display text-2xl font-extrabold tracking-wide text-gold [text-shadow:0_1px_0_#3a0d08]">
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
    </section>
  )
}

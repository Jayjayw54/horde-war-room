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
          <p className="mt-1 text-ash">Every character you both play, mains and alts, straight from the game.</p>
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

      {/* One column per player: Josh on the left, Cel on the right. */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {warRoom.players.map((player) => {
          const toons = warRoom.characters.filter((c) => c.playerId === player.id)
          const gold = toons.reduce((sum, c) => sum + c.gold, 0)
          return (
            <div key={player.id}>
              <h3 className="border-b-2 border-blood pb-1 font-display text-lg font-semibold text-parchment">
                {player.displayName}
                <span className="ml-2 text-sm font-normal text-ash">
                  {toons.length} {toons.length === 1 ? 'toon' : 'toons'} · <Money copper={gold} />
                </span>
              </h3>
              <div className="mt-3 space-y-3">
                {toons.length === 0 && <p className="text-sm text-ash">No toons yet. Use Import from game.</p>}
                {toons.map((c) => (
                  <CharacterCard key={c.id} character={c} owner={player.displayName} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

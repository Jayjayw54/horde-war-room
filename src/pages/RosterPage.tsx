import { useState } from 'react'
import { CharacterCard } from '../components/roster/CharacterCard'
import { CharacterForm } from '../components/roster/CharacterForm'
import type { WarRoom } from '../state/useWarRoom'

export function RosterPage({ warRoom }: { warRoom: WarRoom }) {
  const [adding, setAdding] = useState(false)
  const ownerName = (id: string) => warRoom.players.find((p) => p.id === id)?.displayName ?? 'Unknown'

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-gold">Roster</h2>
          <p className="mt-1 text-ash">Every character you both play, mains and alts.</p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded bg-blood px-4 py-2 font-semibold hover:bg-blood-light"
          >
            + Add toon
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-6">
          <CharacterForm
            players={warRoom.players}
            submitLabel="Add toon"
            onSave={async (input) => {
              const problem = await warRoom.addCharacter(input)
              if (!problem) setAdding(false)
              return problem
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {/* One column per player: Josh on the left, Cel on the right (in the order of the players table). */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {warRoom.players.map((player) => {
          const toons = warRoom.characters.filter((c) => c.playerId === player.id)
          return (
            <div key={player.id}>
              <h3 className="border-b-2 border-blood pb-1 font-display text-lg font-semibold text-parchment">
                {player.displayName}
                <span className="ml-2 text-sm font-normal text-ash">
                  {toons.length} {toons.length === 1 ? 'toon' : 'toons'}
                </span>
              </h3>
              <div className="mt-3 space-y-3">
                {toons.length === 0 && <p className="text-sm text-ash">No toons yet.</p>}
                {toons.map((c) => (
                  <CharacterCard key={c.id} character={c} owner={ownerName(c.playerId)} warRoom={warRoom} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

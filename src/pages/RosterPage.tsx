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

      {warRoom.characters.length === 0 && !adding ? (
        <p className="mt-6 text-ash">No toons yet. Add your first one.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {warRoom.characters.map((c) => (
            <CharacterCard key={c.id} character={c} owner={ownerName(c.playerId)} warRoom={warRoom} />
          ))}
        </div>
      )}
    </section>
  )
}

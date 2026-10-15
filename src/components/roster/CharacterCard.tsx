import { useState } from 'react'
import { classColors } from '../../lib/labels'
import type { Character } from '../../types'
import type { WarRoom } from '../../state/useWarRoom'
import { AddProfession } from './AddProfession'
import { CharacterForm } from './CharacterForm'
import { ProfessionBar } from './ProfessionBar'

interface Props {
  character: Character
  owner: string
  warRoom: WarRoom
}

export function CharacterCard({ character, owner, warRoom }: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState('')
  const color = classColors[character.className] ?? '#eadcb8'

  if (editing) {
    return (
      <CharacterForm
        players={warRoom.players}
        initial={character}
        submitLabel="Save changes"
        onSave={async (input) => {
          const problem = await warRoom.updateCharacter(character.id, input)
          if (!problem) setEditing(false)
          return problem
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  async function remove() {
    const problem = await warRoom.deleteCharacter(character.id)
    if (problem) setError(problem)
  }

  return (
    <article className="border-l-4 bg-leather p-5" style={{ borderLeftColor: color }}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl font-semibold" style={{ color }}>
          {character.name}
        </h3>
        <span className="font-display text-3xl font-extrabold text-gold tabular-nums">{character.level}</span>
      </div>
      <p className="text-ash">
        {character.race} {character.className}, played by {owner}
      </p>
      {character.notes && <p className="mt-2">{character.notes}</p>}

      <div className="mt-4 space-y-3">
        {character.professions.length === 0 && <p className="text-sm text-ash">No professions yet.</p>}
        {character.professions.map((p) => (
          <ProfessionBar key={p.id} profession={p} warRoom={warRoom} />
        ))}
        <AddProfession character={character} warRoom={warRoom} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink pt-3 text-sm">
        {confirmingDelete ? (
          <>
            <span>Remove {character.name} and their professions?</span>
            <button type="button" onClick={remove} className="font-semibold text-blood-light underline">
              Yes, remove
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="text-ash underline">
              Keep
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="text-gold underline hover:text-parchment">
              Edit
            </button>
            <button type="button" onClick={() => setConfirmingDelete(true)} className="text-ash underline hover:text-blood-light">
              Remove
            </button>
          </>
        )}
        {error && <span className="text-blood-light">{error}</span>}
      </div>
    </article>
  )
}

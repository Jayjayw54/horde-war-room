import { classColors } from '../../lib/labels'
import type { Character } from '../../types'
import { ProfessionBar } from './ProfessionBar'

export function CharacterCard({ character, owner }: { character: Character; owner: string }) {
  const color = classColors[character.className] ?? '#eadcb8'
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
        {character.professions.length === 0 ? (
          <p className="text-sm text-ash">No professions yet.</p>
        ) : (
          character.professions.map((p) => <ProfessionBar key={p.id} profession={p} />)
        )}
      </div>
    </article>
  )
}

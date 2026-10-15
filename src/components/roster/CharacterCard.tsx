import { classColors } from '../../lib/labels'
import type { Character } from '../../types'
import { ProfessionBar } from './ProfessionBar'

export function CharacterCard({ character, owner }: { character: Character; owner: string }) {
  const color = classColors[character.className] ?? '#eadcb8'
  return (
    <article
      className="border-l-4 bg-leather px-4 py-3"
      style={{ borderLeftColor: color }}
      aria-label={`${character.name}, played by ${owner}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-display text-xl font-semibold" style={{ color }}>
          {character.name}
        </h4>
        <span className="font-display text-2xl font-extrabold text-gold tabular-nums">{character.level}</span>
      </div>
      <p className="text-sm text-ash">
        {character.race} {character.className}
      </p>
      {character.notes && <p className="mt-1 text-sm">{character.notes}</p>}

      <div className="mt-3 space-y-2">
        {character.professions.length === 0 && <p className="text-sm text-ash">No professions yet.</p>}
        {character.professions.map((p) => (
          <ProfessionBar key={p.id} profession={p} />
        ))}
      </div>
    </article>
  )
}

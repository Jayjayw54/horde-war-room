import { timeAgo } from '../../lib/format'
import { classColors } from '../../lib/labels'
import type { Character } from '../../types'
import { Money } from '../Money'
import { ProfessionBar } from './ProfessionBar'
import { XpBar } from './XpBar'

const MAX_LEVEL = 60

export function CharacterCard({ character, owner }: { character: Character; owner: string }) {
  const color = classColors[character.className] ?? '#eadcb8'
  const showXp = character.level < MAX_LEVEL && character.xp !== null && character.xpMax
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-ash">
        <span>
          {character.race} {character.className}
        </span>
        <Money copper={character.gold} className="text-parchment" />
      </div>
      <p className="text-xs text-ash">Last played {timeAgo(character.lastPlayed)}</p>
      {character.notes && <p className="mt-1 text-sm">{character.notes}</p>}

      {showXp && (
        <div className="mt-2">
          <XpBar xp={character.xp!} xpMax={character.xpMax!} rested={character.restedXp} />
        </div>
      )}

      <div className="mt-3 space-y-2">
        {character.professions.length === 0 && <p className="text-sm text-ash">No professions yet.</p>}
        {character.professions.map((p) => (
          <ProfessionBar key={p.id} profession={p} />
        ))}
      </div>
    </article>
  )
}

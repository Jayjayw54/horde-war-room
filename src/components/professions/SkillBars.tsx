// Every toon's professions as skill bars: the "who can do what, and how far along" overview.
import { Avatar } from '../roster/Portrait'
import { classColors } from '../../lib/labels'
import type { Character, Player } from '../../types'

const SKILL_CAP = 300

export function SkillBars({ characters, players }: { characters: Character[]; players: Player[] }) {
  const owner = (id: string) => players.find((p) => p.id === id)?.displayName ?? ''
  const withProfs = [...characters].filter((c) => c.professions.length > 0).sort((a, b) => b.level - a.level)
  if (withProfs.length === 0) {
    return <p className="panel p-4 text-sm text-ash">No professions synced yet. Play a toon with the addon on and they'll show up here.</p>
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {withProfs.map((c) => (
        <li key={c.id} className="panel p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar character={c} color={classColors[c.className]} size={28} />
            <p className="min-w-0 truncate font-semibold" style={{ color: classColors[c.className] }}>
              {c.name} <span className="font-normal text-ash">({owner(c.playerId)}) · {c.level}</span>
            </p>
          </div>
          <ul className="mt-2.5 space-y-2">
            {[...c.professions]
              .sort((a, b) => b.skillLevel - a.skillLevel)
              .map((p) => {
                const pct = Math.min(100, Math.round((p.skillLevel / SKILL_CAP) * 100))
                const capped = p.maxSkill > 0 && p.skillLevel >= p.maxSkill
                return (
                  <li key={p.id}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-parchment">{p.name}</span>
                      <span className="stat text-ash">
                        <span className="text-parchment">{p.skillLevel}</span>/{p.maxSkill || SKILL_CAP}
                        {capped && p.maxSkill < SKILL_CAP && <span className="ml-1.5 text-warning">train next rank</span>}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink"
                      role="meter"
                      aria-label={`${c.name} ${p.name}`}
                      aria-valuemin={0}
                      aria-valuemax={SKILL_CAP}
                      aria-valuenow={p.skillLevel}
                    >
                      <div className="h-full rounded-full bg-gold-dim" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
          </ul>
        </li>
      ))}
    </ul>
  )
}

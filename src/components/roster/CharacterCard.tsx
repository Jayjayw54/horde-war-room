import { useState } from 'react'
import { timeAgo } from '../../lib/format'
import { classColors } from '../../lib/labels'
import type { Character } from '../../types'
import { Money } from '../Money'
import { GearTab } from './GearTab'
import { ProfessionBar } from './ProfessionBar'
import { StatsTab } from './StatsTab'
import { WeaponsTab } from './WeaponsTab'
import { XpBar } from './XpBar'

const MAX_LEVEL = 60
type Tab = 'overview' | 'stats' | 'weapons' | 'gear'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'stats', label: 'Stats' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'gear', label: 'Gear' },
]

export function CharacterCard({ character, owner }: { character: Character; owner: string }) {
  const [tab, setTab] = useState<Tab>('overview')
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

      {/* Card tabs */}
      <div className="mt-2 flex gap-1 border-b border-ink" role="tablist" aria-label={`${character.name} details`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-2 py-1 text-xs font-semibold transition-colors ${
              tab === t.id ? 'text-parchment' : 'border-transparent text-ash hover:text-parchment'
            }`}
            style={tab === t.id ? { borderColor: color } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3" role="tabpanel">
        {tab === 'overview' && (
          <>
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
          </>
        )}
        {tab === 'stats' && <StatsTab stats={character.stats} />}
        {tab === 'weapons' && <WeaponsTab skills={character.weaponSkills} />}
        {tab === 'gear' && <GearTab gear={character.gear} />}
      </div>
    </article>
  )
}

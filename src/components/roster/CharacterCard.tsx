import { useState } from 'react'
import { timeAgo } from '../../lib/format'
import { classColors } from '../../lib/labels'
import type { Character } from '../../types'
import { Money } from '../Money'
import { GearTab } from './GearTab'
import { Portrait } from './Portrait'
import { ProfessionBar } from './ProfessionBar'
import { StatsTab } from './StatsTab'
import { WeaponsTab } from './WeaponsTab'
import { XpBar } from './XpBar'

const MAX_LEVEL = 60
type Tab = 'overview' | 'professions' | 'stats' | 'weapons' | 'gear'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'professions', label: 'Professions' },
  { id: 'stats', label: 'Stats' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'gear', label: 'Gear' },
]

interface Props {
  character: Character
  owner: string
  // Only your own toons can be starred; leave this out for everyone else's.
  onToggleMain?: () => void
}

export function CharacterCard({ character, owner, onToggleMain }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const color = classColors[character.className] ?? '#eadcb8'
  const showXp = character.level < MAX_LEVEL && character.xp !== null && character.xpMax

  return (
    <article
      className={`panel border-l-4 px-4 pt-4 pb-3 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.7)] ${character.isMain ? 'ring-1 ring-gold/50' : ''}`}
      style={{ borderLeftColor: color }}
      aria-label={`${character.name}, played by ${owner}${character.isMain ? ', main' : ''}`}
    >
      <div className="flex items-center gap-4">
        <Portrait character={character} color={color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-display text-xl font-semibold" style={{ color }}>
              {character.name}
            </h4>
            {onToggleMain ? (
              <button
                type="button"
                onClick={onToggleMain}
                aria-pressed={character.isMain}
                aria-label={character.isMain ? `Unstar ${character.name} as a main` : `Star ${character.name} as a main`}
                title={character.isMain ? 'Main (click to unstar)' : 'Star as a main'}
                className={`ml-auto text-xl leading-none transition-colors ${character.isMain ? 'text-gold' : 'text-ash/40 hover:text-gold'}`}
              >
                {character.isMain ? '★' : '☆'}
              </button>
            ) : (
              character.isMain && (
                <span title="Main" aria-hidden className="ml-auto text-xl leading-none text-gold">
                  ★
                </span>
              )
            )}
          </div>
          <p className="text-sm text-ash">
            Level {character.level} {character.race} {character.className}
          </p>
        </div>
      </div>

      {/* Card tabs */}
      <div className="mt-3 flex flex-wrap gap-1 border-b border-ink" role="tablist" aria-label={`${character.name} details`}>
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
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <Money copper={character.gold} className="font-semibold text-parchment" />
              <span className="text-xs text-ash">Last played {timeAgo(character.lastPlayed)}</span>
            </div>
            {showXp ? (
              <XpBar xp={character.xp!} xpMax={character.xpMax!} rested={character.restedXp} />
            ) : character.level >= MAX_LEVEL ? (
              <p className="text-xs text-gold">Max level</p>
            ) : null}
            {character.notes && <p className="text-sm">{character.notes}</p>}
          </div>
        )}
        {tab === 'professions' && (
          <div className="space-y-2">
            {character.professions.length === 0 && <p className="text-sm text-ash">No professions yet.</p>}
            {character.professions.map((p) => (
              <ProfessionBar key={p.id} profession={p} />
            ))}
          </div>
        )}
        {tab === 'stats' && <StatsTab stats={character.stats} />}
        {tab === 'weapons' && <WeaponsTab skills={character.weaponSkills} />}
        {tab === 'gear' && <GearTab gear={character.gear} />}
      </div>
    </article>
  )
}

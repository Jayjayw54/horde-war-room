// A WoW-style unit frame portrait: the toon's race face in a gold ring, the level in a gem
// on the rim, and the class crest on the other side. Pictures come from Wowhead's icon library.
import { useState } from 'react'
import type { Character } from '../../types'

const ICONS = 'https://wow.zamimg.com/images/wow/icons/large/'

// The game's internal race name -> Wowhead's icon name (Undead are "Scourge" inside the game).
function raceIcon(c: Character): string | null {
  const key = (c.raceFile ?? c.race).toLowerCase().replace(/\s+/g, '')
  const known: Record<string, string> = { orc: 'orc', scourge: 'scourge', undead: 'scourge', troll: 'troll', tauren: 'tauren' }
  const race = known[key]
  if (!race || !c.sex) return null // unknown race (e.g. Skyborne) or not imported with addon v0.5.1 yet
  return `${ICONS}race_${race}_${c.sex === 3 ? 'female' : 'male'}.jpg`
}

const classIcon = (c: Character) => `${ICONS}classicon_${c.className.toLowerCase()}.jpg`

export function Portrait({ character, color }: { character: Character; color: string }) {
  const face = raceIcon(character)
  // If a picture fails to load, fall back: race face -> class crest -> first letter.
  const [failed, setFailed] = useState<string[]>([])
  const options = [face, classIcon(character)].filter((u): u is string => !!u && !failed.includes(u))
  const src = options[0]
  const showCrest = !!face && src === face

  return (
    <div className="relative h-16 w-16 shrink-0">
      <div
        className="h-16 w-16 overflow-hidden rounded-full border-[3px] border-gold bg-ink"
        style={{ boxShadow: `0 0 0 2px #111315, 0 0 14px -4px ${color}` }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full scale-110 object-cover"
            onError={() => setFailed((f) => [...f, src])}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold" style={{ color }}>
            {character.name.charAt(0)}
          </span>
        )}
      </div>
      {/* Level gem, bottom-left of the ring, like the in-game player frame */}
      <span className="absolute -bottom-1 -left-1 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-gold bg-blood px-1 font-display text-xs font-extrabold text-parchment tabular-nums">
        {character.level}
      </span>
      {/* Class crest, bottom-right */}
      {showCrest && (
        <img
          src={classIcon(character)}
          alt=""
          className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full border-2 border-ink"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </div>
  )
}

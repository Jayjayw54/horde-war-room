import type { GearItem } from '../../types'
import { SLOT_NAMES } from '../../lib/slots'
import { ItemIcon, qualityColor } from '../bank/ItemIcon'


export function GearTab({ gear }: { gear: GearItem[] | null }) {
  if (!gear) return <p className="text-sm text-ash">No gear yet. Update the addon to v0.4.0, log in on this toon, then import.</p>
  if (gear.length === 0) return <p className="text-sm text-ash">Nothing equipped. Brave.</p>
  const levels = gear.filter((g) => g.ilvl && g.slot !== 4 && g.slot !== 19).map((g) => g.ilvl!)
  const average = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : null
  return (
    <div>
      {average && <p className="mb-2 text-xs text-ash">Average item level {average}</p>}
      <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {[...gear]
          .sort((a, b) => a.slot - b.slot)
          .map((g) => (
            <li key={g.slot} className="flex min-w-0 items-center gap-2 text-sm">
              <ItemIcon itemId={g.id} name={g.name} quality={g.quality} size={24} />
              <span className="w-16 shrink-0 text-xs text-ash">{SLOT_NAMES[g.slot] ?? `Slot ${g.slot}`}</span>
              <span className="truncate" style={{ color: qualityColor(g.quality) }} title={g.name}>
                {g.name}
              </span>
              {g.ilvl && <span className="ml-auto shrink-0 text-xs text-ash tabular-nums">{g.ilvl}</span>}
            </li>
          ))}
      </ul>
    </div>
  )
}

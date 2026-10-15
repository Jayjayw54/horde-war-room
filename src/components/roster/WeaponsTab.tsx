import type { WeaponSkill } from '../../types'

export function WeaponsTab({ skills }: { skills: WeaponSkill[] | null }) {
  if (!skills) {
    return (
      <p className="text-sm text-ash">
        No weapon skills recorded. Either this toon needs a fresh import with addon v0.4.0, or WoW: Forever doesn't have
        weapon skills (it doesn't use Classic's old skills list).
      </p>
    )
  }
  if (skills.length === 0) return <p className="text-sm text-ash">No weapon skills learned yet.</p>
  return (
    <div className="space-y-2">
      {skills.map((s) => {
        const percent = Math.min(100, Math.round((s.skill / s.max) * 100))
        return (
          <div key={s.name}>
            <div className="flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="text-ash tabular-nums">
                {s.skill} / {s.max}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink" role="progressbar" aria-label={`${s.name} skill`} aria-valuenow={s.skill} aria-valuemin={0} aria-valuemax={s.max}>
              <div className={`h-full rounded-full ${s.skill >= s.max ? 'bg-[#1eff00]/70' : 'bg-gold'}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

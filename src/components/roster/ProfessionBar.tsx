import type { Profession } from '../../types'

export function ProfessionBar({ profession }: { profession: Profession }) {
  const percent = Math.min(100, Math.round((profession.skillLevel / profession.maxSkill) * 100))
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{profession.name}</span>
        <span className="text-ash tabular-nums">
          {profession.skillLevel} / {profession.maxSkill}
        </span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-ink"
        role="progressbar"
        aria-valuenow={profession.skillLevel}
        aria-valuemin={0}
        aria-valuemax={profession.maxSkill}
        aria-label={`${profession.name} skill`}
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

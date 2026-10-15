// XP bar: purple = earned XP into this level, blue = rested bonus on top (like the in-game bar).
export function XpBar({ xp, xpMax, rested }: { xp: number; xpMax: number; rested: number }) {
  const earned = Math.min(100, (xp / xpMax) * 100)
  const restedPart = Math.min(100 - earned, (rested / xpMax) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-ash">
        <span>
          XP <span className="tabular-nums">{Math.round(earned)}%</span>
        </span>
        {rested > 0 && (
          <span className="text-[#4f8fd8]">
            Rested <span className="tabular-nums">{Math.round((rested / xpMax) * 100)}%</span>
          </span>
        )}
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full bg-ink"
        role="progressbar"
        aria-label="Experience"
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={xpMax}
      >
        <div className="h-full bg-[#9a4fd8]" style={{ width: `${earned}%` }} />
        <div className="h-full bg-[#4f8fd8]/70" style={{ width: `${restedPart}%` }} />
      </div>
    </div>
  )
}

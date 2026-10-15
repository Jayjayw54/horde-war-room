import { splitMoney } from '../lib/format'

// Shows copper as WoW-style gold/silver/copper, e.g. 12g 40s 5c. Skips zero parts at the front.
export function Money({ copper, className = '' }: { copper: number; className?: string }) {
  const { gold, silver, copper: c } = splitMoney(copper)
  return (
    <span className={`tabular-nums ${className}`} aria-label={`${gold} gold ${silver} silver ${c} copper`}>
      {gold > 0 && (
        <>
          {gold.toLocaleString()}
          <span className="text-[#e8c34a]">g</span>{' '}
        </>
      )}
      {(gold > 0 || silver > 0) && (
        <>
          {silver}
          <span className="text-[#c0c6cc]">s</span>{' '}
        </>
      )}
      {c}
      <span className="text-[#c4794a]">c</span>
    </span>
  )
}

import type { CharacterStats, StatValue } from '../../types'

const pct = (v?: number) => (v === undefined || v === null ? null : `${v.toFixed(2)}%`)
const POWER_NAMES: Record<string, string> = { MANA: 'Mana', RAGE: 'Rage', ENERGY: 'Energy', FOCUS: 'Focus' }

function Row({ label, value, bonus }: { label: string; value: string | number | null | undefined; bonus?: number }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ash">{label}</dt>
      <dd className="tabular-nums">
        {value}
        {bonus ? (
          <span className={bonus > 0 ? 'text-[#1eff00]' : 'text-error'}>
            {' '}
            ({bonus > 0 ? '+' : ''}
            {bonus})
          </span>
        ) : null}
      </dd>
    </div>
  )
}

const stat = (label: string, v?: StatValue) => <Row label={label} value={v?.total} bonus={v?.bonus} />

export function StatsTab({ stats }: { stats: CharacterStats | null }) {
  if (!stats) return <p className="text-sm text-ash">No stats yet. Update the addon to v0.4.0, log in on this toon, then import.</p>
  const resist = Object.entries(stats.resistances ?? {}).filter(([, v]) => v)
  return (
    <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      <dl className="space-y-0.5">
        <p className="font-display text-xs font-semibold tracking-wide text-gold uppercase">Attributes</p>
        {stat('Strength', stats.strength)}
        {stat('Agility', stats.agility)}
        {stat('Stamina', stats.stamina)}
        {stat('Intellect', stats.intellect)}
        {stat('Spirit', stats.spirit)}
        <Row label="Health" value={stats.health?.toLocaleString()} />
        <Row label={POWER_NAMES[stats.powerType ?? ''] ?? 'Power'} value={stats.power?.toLocaleString()} />
        <Row label="Armor" value={stats.armor?.toLocaleString()} />
      </dl>
      <dl className="space-y-0.5">
        <p className="font-display text-xs font-semibold tracking-wide text-gold uppercase">Combat</p>
        <Row label="Attack power" value={stats.attackPower} />
        <Row label="Ranged attack power" value={stats.rangedAttackPower || null} />
        <Row label="Melee crit" value={pct(stats.meleeCrit)} />
        <Row label="Ranged crit" value={stats.rangedCrit ? pct(stats.rangedCrit) : null} />
        <Row label="Spell crit" value={pct(stats.spellCrit)} />
        <Row label="Spell power" value={stats.spellPower || null} />
        <Row label="Healing" value={stats.healing || null} />
        <Row label="Dodge" value={pct(stats.dodge)} />
        <Row label="Parry" value={stats.parry ? pct(stats.parry) : null} />
        <Row label="Block" value={stats.block ? pct(stats.block) : null} />
        {resist.length > 0 && (
          <Row label="Resistances" value={resist.map(([k, v]) => `${k.charAt(0).toUpperCase()}${k.slice(1)} ${v}`).join(', ')} />
        )}
      </dl>
    </div>
  )
}

// The war table: what's worth doing tonight, worked out from everything the War Room knows,
// plus who's been on and what's happened lately.
import type { ReactNode } from 'react'
import { ItemIcon, qualityColor } from '../components/bank/ItemIcon'
import type { Page } from '../components/layout/Header'
import { timeAgo } from '../lib/format'
import { classColors } from '../lib/labels'
import { SLOT_NAMES } from '../lib/slots'
import { findUpgrades } from '../lib/upgrades'
import type { WarRoom } from '../state/useWarRoom'
import type { Character } from '../types'

const MAX_LEVEL = 60

// Event text uses **bold** for names; turn that into real bold text.
function richText(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} className="text-parchment">{part}</strong> : part))
}

function Toon({ c }: { c: Character }) {
  return (
    <span className="font-semibold" style={{ color: classColors[c.className] }}>
      {c.name}
    </span>
  )
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-gold">{title}</h3>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export function HomePage({ warRoom, onNavigate }: { warRoom: WarRoom; onNavigate: (p: Page) => void }) {
  const { characters, players, objectives, recipes, items, events } = warRoom
  const owner = (c: Character) => players.find((p) => p.id === c.playerId)?.displayName ?? ''
  const pct = (c: Character) => (c.xp && c.xpMax ? c.xp / c.xpMax : 0)

  // ---- Work out tonight's suggestions ----
  const closeToDing = characters
    .filter((c) => c.level < MAX_LEVEL && pct(c) >= 0.75)
    .sort((a, b) => pct(b) - pct(a))
  const rested = characters
    .filter((c) => c.level < MAX_LEVEL && c.xpMax && c.restedXp / c.xpMax >= 0.5)
    .sort((a, b) => b.restedXp / (b.xpMax ?? 1) - a.restedXp / (a.xpMax ?? 1))
  const upgrades = findUpgrades(characters, items).slice(0, 6)
  const tonight = objectives.filter((o) => o.tonight && o.status !== 'done')

  // Things you could craft right now from what's in the shared bank.
  const held = new Map<number, number>()
  for (const i of items) held.set(i.itemId, (held.get(i.itemId) ?? 0) + i.quantity)
  const seen = new Set<string>()
  const craftable = recipes
    .filter((r) => r.reagents.length > 0 && r.reagents.every((g) => g.id && (held.get(g.id) ?? 0) >= g.count))
    .filter((r) => (seen.has(r.name) ? false : (seen.add(r.name), true)))
    .map((r) => ({ recipe: r, times: Math.min(...r.reagents.map((g) => Math.floor((held.get(g.id!) ?? 0) / g.count))) }))
    .sort((a, b) => b.times - a.times)
    .slice(0, 6)

  // Professions about to hit their cap (time to train the next rank).
  const capped = characters.flatMap((c) =>
    c.professions.filter((p) => p.maxSkill < 300 && p.skillLevel >= p.maxSkill - 5).map((p) => ({ c, p })),
  )

  // Who's been on: each player's most recently played toon.
  const lastOn = players.map((p) => {
    const toon = characters
      .filter((c) => c.playerId === p.id && c.lastPlayed)
      .sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))[0]
    return { player: p, toon }
  })

  const nothingToSuggest =
    closeToDing.length + rested.length + upgrades.length + tonight.length + craftable.length + capped.length === 0

  const link = 'text-sm text-gold/90 underline decoration-gold/40 underline-offset-2 hover:text-parchment'

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gold">War table</h2>
      <p className="mt-1 text-ash">What's worth doing tonight, from everything the War Room knows.</p>

      {/* Who's been on */}
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
        {lastOn.map(({ player, toon }) => (
          <p key={player.id}>
            <span className="font-display font-semibold text-parchment">{player.displayName}</span>{' '}
            <span className="text-ash">
              {toon ? (
                <>
                  last on <Toon c={toon} /> {timeAgo(toon.lastPlayed)}
                </>
              ) : (
                'hasn’t imported yet'
              )}
            </span>
          </p>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {nothingToSuggest && (
            <Section title="Nothing urgent">
              <p className="text-sm text-ash">No near-dings, upgrades or ready crafts right now. Go cause trouble in Ashenvale.</p>
            </Section>
          )}

          {tonight.length > 0 && (
            <Section title="Tonight's orders" action={<button type="button" onClick={() => onNavigate('objectives')} className={link}>Open objectives</button>}>
              <ul className="space-y-1 text-sm">
                {tonight.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    {o.title} <span className="text-ash">· {o.assignee === 'both' ? 'both of you' : (players.find((p) => p.id === o.assignee)?.displayName ?? o.assignee)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {upgrades.length > 0 && (
            <Section title="Gear upgrades waiting">
              <ul className="space-y-2 text-sm">
                {upgrades.map((u) => (
                  <li key={`${u.toon.id}-${u.item.itemId}`} className="flex items-center gap-3">
                    <ItemIcon itemId={u.item.itemId} name={u.item.name} quality={u.item.quality} size={28} />
                    <div className="min-w-0">
                      <p>
                        <Toon c={u.toon} /> could wear{' '}
                        <span style={{ color: qualityColor(u.item.quality) }}>{u.item.name}</span>{' '}
                        <span className="text-[#1eff00]">+{u.gain} item level</span>
                      </p>
                      <p className="text-xs text-ash">
                        {SLOT_NAMES[u.slotNumber]}, replacing {u.current ?? 'nothing'} ·{' '}
                        {u.holder.id === u.toon.id
                          ? `already in their ${u.item.location}`
                          : `${u.holder.name} (${owner(u.holder)}) has it in ${u.item.location}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ash">Based on item level, so check the stats suit your spec.</p>
            </Section>
          )}

          {(closeToDing.length > 0 || rested.length > 0) && (
            <Section title="Worth playing">
              <ul className="space-y-1 text-sm">
                {closeToDing.map((c) => (
                  <li key={`d-${c.id}`}>
                    <Toon c={c} /> is {Math.round(pct(c) * 100)}% to level {c.level + 1}. One good session.
                  </li>
                ))}
                {rested
                  .filter((c) => !closeToDing.includes(c))
                  .map((c) => (
                    <li key={`r-${c.id}`}>
                      <Toon c={c} /> has <span className="text-[#4f8fd8]">{Math.round((c.restedXp / (c.xpMax ?? 1)) * 100)}% rested</span>, so XP is doubled for a while.
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          {craftable.length > 0 && (
            <Section title="Ready to craft" action={<button type="button" onClick={() => onNavigate('planner')} className={link}>Open planner</button>}>
              <ul className="space-y-1 text-sm">
                {craftable.map(({ recipe, times }) => {
                  const crafter = characters.find((c) => c.id === recipe.characterId)
                  return (
                    <li key={recipe.id}>
                      Enough materials for <span className="text-parchment">{times}× {recipe.name}</span>
                      {crafter && (
                        <>
                          {' '}
                          by <Toon c={crafter} />
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}

          {capped.length > 0 && (
            <Section title="Train your next rank">
              <ul className="space-y-1 text-sm">
                {capped.map(({ c, p }) => (
                  <li key={`${c.id}-${p.id}`}>
                    <Toon c={c} />'s {p.name} is at {p.skillLevel}/{p.maxSkill}. Visit a trainer to keep levelling it.
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Activity feed */}
        <Section title="Recent activity">
          {events.length === 0 ? (
            <p className="text-sm text-ash">Dings, skill-ups, epics and milestones show up here after each import.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.slice(0, 25).map((e) => (
                <li key={e.id} className={e.kind === 'milestone' || e.kind === 'epic' ? 'text-gold' : 'text-ash'}>
                  <span>{richText(e.text)}</span>
                  <span className="ml-1 text-xs text-ash/70">{timeAgo(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

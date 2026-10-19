// The Stronghold: the crew's home base. Who's here, what's worth doing tonight (worked out from
// everything the crew has synced), and the Chronicle of what's happened lately.
import type { ReactNode } from 'react'
import { ItemIcon, qualityColor } from '../components/bank/ItemIcon'
import { ChronicleIcon, OrdersIcon, PlannerIcon, ProgressIcon, RosterIcon, ScrollIcon, WishlistIcon } from '../components/brand/Icons'
import { Money } from '../components/Money'
import { PageHeader } from '../components/layout/PageHeader'
import type { Page } from '../components/layout/Header'
import { timeAgo } from '../lib/format'
import { assigneeLabel, classColors } from '../lib/labels'
import { SLOT_NAMES } from '../lib/slots'
import { findUpgrades } from '../lib/upgrades'
import type { WarRoom } from '../state/useWarRoom'
import { EVERYONE, type Character } from '../types'

const MAX_LEVEL = 60

// Event text uses **bold** for names; turn that into real bold text. The importer starts each line
// with an emoji (for Discord); here each kind of event gets a proper icon instead.
function richText(text: string): ReactNode[] {
  const clean = text.replace(/^[^\p{L}\p{N}*]+/u, '')
  return clean.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} className="font-semibold text-parchment">{part}</strong> : part))
}

function EventIcon({ kind }: { kind: string }) {
  const cls = 'h-4 w-4'
  if (kind === 'ding' || kind === 'milestone') return <ProgressIcon className={cls} />
  if (kind === 'skill' || kind === 'profession' || kind === 'recipe') return <PlannerIcon className={cls} />
  if (kind === 'epic') return <WishlistIcon className={cls} />
  if (kind === 'new') return <RosterIcon className={cls} />
  return <ChronicleIcon className={cls} />
}

function Toon({ c }: { c: Character }) {
  return (
    <span className="font-semibold" style={{ color: classColors[c.className] }}>
      {c.name}
    </span>
  )
}

function Section({ title, icon, children, action }: { title: string; icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-parchment">
          {icon && <span className="text-gold">{icon}</span>}
          {title}
        </h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

// A number with a small label, for the crew overview.
function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ash">{label}</dt>
      <dd className="stat mt-0.5 text-3xl leading-none font-semibold text-parchment">{children}</dd>
    </div>
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
    closeToDing.length + rested.length + tonight.length + craftable.length + capped.length === 0

  const link = 'text-sm text-gold underline-offset-4 hover:underline'
  const openOrders = objectives.filter((o) => o.status !== 'done').length
  const crewGold = characters.reduce((sum, c) => sum + c.gold, 0)

  return (
    <div>
      <PageHeader title="Stronghold" subtitle={warRoom.party ? `${warRoom.party.name}: what's worth doing tonight.` : undefined} />

      {/* Crew overview: who's here and the state of things */}
      <section aria-label="Crew overview" className="panel mt-5 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label="Members">{players.length}</Stat>
          <Stat label="Characters">{characters.length}</Stat>
          <Stat label="Open orders">{openOrders}</Stat>
          <Stat label="Crew gold">
            <Money copper={crewGold} className="text-2xl" />
          </Stat>
        </dl>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-rim pt-3 text-sm">
          {lastOn.map(({ player, toon }) => (
            <li key={player.id}>
              <span className="font-semibold text-parchment">{player.displayName}</span>{' '}
              <span className="text-ash">
                {toon ? (
                  <>
                    last on <Toon c={toon} /> {timeAgo(toon.lastPlayed)}
                  </>
                ) : (
                  'hasn’t synced yet'
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {characters.length === 0 && (
        <section className="mt-4 rounded-lg border border-gold/30 bg-gold/[0.06] p-5">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-parchment">
            <ScrollIcon className="h-5 w-5 text-gold" /> Your stronghold is empty
          </h3>
          <p className="mt-2 max-w-2xl text-ash">
            Characters arrive from the game. Install the addon (Crew page), log in on each character, type /reload, then use
            Import from game on the Roster. Everyone in the crew sees them once they're in.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <button type="button" onClick={() => onNavigate('party')} className={link}>
              Get the addon
            </button>
            <button type="button" onClick={() => onNavigate('roster')} className={link}>
              Go to the Roster
            </button>
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {nothingToSuggest && characters.length > 0 && (
            <Section title="Nothing urgent">
              <p className="text-sm text-ash">No near-dings, upgrades or ready crafts right now. Go cause trouble in Ashenvale.</p>
            </Section>
          )}

          {tonight.length > 0 && (
            <Section
              title="Tonight's orders"
              icon={<OrdersIcon className="h-5 w-5" />}
              action={
                <button type="button" onClick={() => onNavigate('objectives')} className={link}>
                  All orders
                </button>
              }
            >
              <ul className="space-y-1 text-sm">
                {tonight.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    {o.title} <span className="text-ash">· {o.assignee === EVERYONE ? (players.length === 2 ? 'both of you' : 'everyone') : assigneeLabel(o.assignee, players)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Gear upgrades waiting" icon={<WishlistIcon className="h-5 w-5" />}>
            {upgrades.length === 0 ? (
              <p className="text-sm text-ash">
                {items.some((i) => i.ilvl)
                  ? "Nothing in your bags or banks beats what you're wearing right now."
                  : 'No item levels recorded yet. Use addon v0.6.0, log in on each toon, open your bank, /reload, then import.'}
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upgrades.map((u) => (
                  <li key={`${u.toon.id}-${u.item.itemId}`} className="flex items-center gap-3">
                    <ItemIcon itemId={u.item.itemId} name={u.item.name} quality={u.item.quality} size={28} />
                    <div className="min-w-0">
                      <p>
                        <Toon c={u.toon} /> could wear{' '}
                        <span style={{ color: qualityColor(u.item.quality) }}>{u.item.name}</span>{' '}
                        <span className="text-success">+{u.gain} item level</span>
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
            )}
            <p className="mt-2 text-xs text-ash">Based on item level, so check the stats suit your spec.</p>
          </Section>

          {(closeToDing.length > 0 || rested.length > 0) && (
            <Section title="Worth playing" icon={<ProgressIcon className="h-5 w-5" />}>
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
                      <Toon c={c} /> has <span className="text-info">{Math.round((c.restedXp / (c.xpMax ?? 1)) * 100)}% rested</span>, so XP is doubled for a while.
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          {craftable.length > 0 && (
            <Section
              title="Ready to craft"
              icon={<PlannerIcon className="h-5 w-5" />}
              action={
                <button type="button" onClick={() => onNavigate('planner')} className={link}>
                  Open planner
                </button>
              }
            >
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

        {/* The Chronicle: what's happened lately */}
        <Section title="Chronicle" icon={<ChronicleIcon className="h-5 w-5" />}>
          {events.length === 0 ? (
            <p className="text-sm text-ash">Dings, skill-ups, epics and milestones are written here after each sync.</p>
          ) : (
            <ul className="divide-y divide-rim/70 text-sm">
              {events.slice(0, 25).map((e) => {
                const big = e.kind === 'milestone' || e.kind === 'epic'
                return (
                  <li key={e.id} className="flex gap-2.5 py-2 first:pt-0">
                    <span className={`mt-0.5 shrink-0 ${big ? 'text-gold' : 'text-ash/80'}`}>
                      <EventIcon kind={e.kind} />
                    </span>
                    <span className="min-w-0">
                      <span className={big ? 'text-vellum' : 'text-ash'}>{richText(e.text)}</span>
                      <span className="mt-0.5 block text-xs text-ash/70">{timeAgo(e.createdAt)}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

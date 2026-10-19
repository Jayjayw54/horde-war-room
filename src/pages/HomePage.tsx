// The Stronghold: the crew's home base. Who's here, what's worth doing tonight (worked out from
// everything the crew has synced), and the Chronicle of what's happened lately.
import type { ReactNode } from 'react'
import { ItemIcon, qualityColor } from '../components/bank/ItemIcon'
import { ChronicleIcon, OrdersIcon, PlannerIcon, ProgressIcon, RosterIcon, ScrollIcon, WishlistIcon } from '../components/brand/Icons'
import { Avatar } from '../components/roster/Portrait'
import type { Page } from '../components/layout/Header'
import { timeAgo } from '../lib/format'
import { assigneeLabel, classColors } from '../lib/labels'
import { SLOT_NAMES } from '../lib/slots'
import { orderProgress } from '../lib/orders'
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

  const nothingToSuggest =
    closeToDing.length + rested.length + tonight.length + craftable.length + capped.length === 0

  const link = 'text-sm text-gold underline-offset-4 hover:underline'
  const openOrders = objectives.filter((o) => o.status !== 'done')
  const professionNames = new Set(characters.flatMap((c) => c.professions.map((p) => p.name)))

  // Next up: open orders, tonight's first. "Get 20 Copper Ore" orders show how close the crew is.
  const nextUp = [...openOrders].sort((a, b) => Number(b.tonight) - Number(a.tonight)).slice(0, 6)
  const progressOf = (title: string) => orderProgress(title, items)
  const toonById = (id: string | null) => characters.find((c) => c.id === id)

  return (
    <div className="space-y-5">
      {/* The banner: the stronghold itself */}
      <section className="relative overflow-hidden rounded-lg border border-rim">
        <picture>
          <source media="(min-width: 768px)" srcSet="/art/stronghold.jpg" />
          <img
            src="/art/stronghold-small.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
          />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,13,15,0.92)_0%,rgba(12,13,15,0.6)_45%,rgba(12,13,15,0.1)_100%)]" />
        <div className="relative px-5 py-8 sm:px-8 sm:py-12">
          <p className="text-sm font-semibold text-gold">{warRoom.party?.name ?? 'Your crew'}</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-parchment [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] sm:text-4xl">
            Stronger together.
          </h2>
          <p className="mt-1 text-lg text-parchment/85">Prepare. Plan. Progress.</p>
        </div>
      </section>

      {/* The crew at a glance */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Characters', characters.length],
          ['Active orders', openOrders.length],
          ['Items tracked', new Set(items.map((i) => i.itemId)).size],
          ['Professions', professionNames.size],
        ].map(([label, value]) => (
          <div key={label} className="panel px-4 py-4 text-center">
            <dd className="stat text-4xl leading-none font-semibold text-parchment">{value}</dd>
            <dt className="mt-1.5 text-sm text-ash">{label}</dt>
          </div>
        ))}
      </dl>

      {characters.length === 0 && (
        <section className="rounded-lg border border-gold/30 bg-gold/[0.06] p-5">
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

      {/* Recent activity and what's next */}
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Section
          title="Recent activity"
          icon={<ChronicleIcon className="h-5 w-5" />}
        >
          {events.length === 0 ? (
            <p className="text-sm text-ash">Dings, skill-ups, epics and milestones are written here after each sync.</p>
          ) : (
            <ul className="divide-y divide-rim/70 text-sm">
              {events.slice(0, 8).map((e) => {
                const toon = toonById(e.characterId)
                const big = e.kind === 'milestone' || e.kind === 'epic'
                return (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    {toon ? (
                      <Avatar character={toon} color={classColors[toon.className] ?? '#e7e2d8'} size={30} />
                    ) : (
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-rim text-ash">
                        <EventIcon kind={e.kind} />
                      </span>
                    )}
                    <span className={`min-w-0 flex-1 ${big ? 'text-vellum' : 'text-ash'}`}>{richText(e.text)}</span>
                    <span className="shrink-0 text-xs text-ash/70">{timeAgo(e.createdAt)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section
          title="Next up"
          icon={<OrdersIcon className="h-5 w-5" />}
          action={
            <button type="button" onClick={() => onNavigate('objectives')} className={link}>
              View all
            </button>
          }
        >
          {nextUp.length === 0 ? (
            <p className="text-sm text-ash">No open orders. Add one on the Orders page, or from a plan in Professions.</p>
          ) : (
            <ul className="space-y-1">
              {nextUp.map((o) => {
                const prog = progressOf(o.title)
                return (
                  <li key={o.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md px-1 py-1.5 hover:bg-white/[0.03]">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => warRoom.setStatus(o.id, 'done')}
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-blood"
                      />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="text-parchment">{o.title}</span>
                        {prog && (
                          <span className={`stat ml-1.5 ${prog.have >= prog.want ? 'text-success' : 'text-ash'}`}>
                            ({prog.have}/{prog.want})
                          </span>
                        )}
                        <span className="block text-xs text-ash">
                          {o.tonight && <span className="text-gold">Tonight · </span>}
                          {o.assignee === EVERYONE ? (players.length === 2 ? 'Both of you' : 'Everyone') : assigneeLabel(o.assignee, players)}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* Worth doing tonight, worked out from the crew's data */}
      <div className="grid gap-5 lg:grid-cols-2">
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
        {nothingToSuggest && characters.length > 0 && (
          <Section title="Nothing urgent">
            <p className="text-sm text-ash">No near-dings, upgrades or ready crafts right now. Go cause trouble in Ashenvale.</p>
          </Section>
        )}
      </div>
    </div>
  )
}

import { ObjectiveItem } from '../components/objectives/ObjectiveItem'
import { assigneeLabel } from '../lib/labels'
import type { WarRoom } from '../state/useWarRoom'
import { EVERYONE } from '../types'

export function TonightView({ warRoom }: { warRoom: WarRoom }) {
  const tonight = warRoom.objectives.filter((o) => o.tonight)
  const remaining = tonight.filter((o) => o.status !== 'done').length

  // A column for the whole party in the middle, with each player either side. In a duo that's
  // You | Both | Mate. In bigger parties, only players with orders tonight get a column.
  const [first, ...rest] = warRoom.players
  const people = warRoom.players.length <= 2 ? [first?.id, EVERYONE, ...rest.map((p) => p.id)] : [
    EVERYONE,
    ...warRoom.players.filter((p) => tonight.some((o) => o.assignee === p.id)).map((p) => p.id),
  ]
  const columns = people.filter((id): id is string => !!id)

  return (
    <section>
      <p className="text-ash">
        {tonight.length === 0
          ? 'Nothing planned yet. Flag orders with "Add to tonight" to build the session plan.'
          : remaining === 0
            ? 'Every order complete. Victory!'
            : `${remaining} of ${tonight.length} still to do.`}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {columns.map((who) => {
          const items = tonight.filter((o) => o.assignee === who)
          return (
            <div key={who} className={`p-4 ${who === EVERYONE ? 'bg-blood/25 ring-1 ring-blood' : 'panel'}`}>
              <h3 className="font-display text-lg font-semibold">{assigneeLabel(who, warRoom.players)}</h3>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-ash">No orders.</p>
              ) : (
                <ul className="mt-1">
                  {items.map((o) => (
                    <ObjectiveItem key={o.id} objective={o} warRoom={warRoom} compact />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

import { ObjectiveItem } from '../components/objectives/ObjectiveItem'
import { assigneeLabels } from '../lib/labels'
import type { WarRoom } from '../state/useWarRoom'
import type { Assignee } from '../types'

const columns: Assignee[] = ['josh', 'both', 'cel']

export function TonightView({ warRoom }: { warRoom: WarRoom }) {
  const tonight = warRoom.objectives.filter((o) => o.tonight)
  const remaining = tonight.filter((o) => o.status !== 'done').length

  return (
    <section>
      <p className="text-ash">
        {tonight.length === 0
          ? 'Nothing planned yet. Flag objectives with "Add to tonight" to build the session plan.'
          : remaining === 0
            ? 'Every order complete. Lok\u2019tar.'
            : `${remaining} of ${tonight.length} still to do.`}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {columns.map((who) => {
          const items = tonight.filter((o) => o.assignee === who)
          return (
            <div key={who} className={`p-4 ${who === 'both' ? 'bg-blood/25 ring-1 ring-blood' : 'bg-leather'}`}>
              <h3 className="font-display text-lg font-semibold">{assigneeLabels[who]}</h3>
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

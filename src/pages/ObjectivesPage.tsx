import { useState } from 'react'
import { Filters, type FilterState } from '../components/objectives/Filters'
import { ObjectiveForm } from '../components/objectives/ObjectiveForm'
import { ObjectiveItem } from '../components/objectives/ObjectiveItem'
import type { WarRoom } from '../state/useWarRoom'
import { TonightView } from './TonightPage'

type View = 'all' | 'tonight'

export function ObjectivesPage({ warRoom }: { warRoom: WarRoom }) {
  const [view, setView] = useState<View>('all')
  const tonightLeft = warRoom.objectives.filter((o) => o.tonight && o.status !== 'done').length
  const [filters, setFilters] = useState<FilterState>({ assignee: 'all', category: 'all', status: 'all' })

  const visible = warRoom.objectives.filter(
    (o) =>
      (filters.assignee === 'all' || o.assignee === filters.assignee) &&
      (filters.category === 'all' || o.category === filters.category) &&
      (filters.status === 'all' || o.status === filters.status),
  )

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-gold sm:text-3xl">Orders</h2>
        <p className="mt-1 text-ash">The crew's orders: tonight's plan, and everything still to do.</p>
      </div>

      <div className="flex gap-1 border-b border-leather-light" role="tablist" aria-label="Orders view">
        {(
          [
            ['all', 'All orders'],
            ['tonight', "Tonight's orders"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`-mb-px border-b-2 px-3 py-1.5 font-display text-sm font-semibold transition-colors ${
              view === id ? 'border-blood text-parchment' : 'border-transparent text-ash hover:text-parchment'
            }`}
          >
            {label}
            {id === 'tonight' && tonightLeft > 0 && (
              <span className="ml-1.5 rounded-full bg-blood px-1.5 text-xs text-parchment tabular-nums">{tonightLeft}</span>
            )}
          </button>
        ))}
      </div>

      {view === 'tonight' ? (
        <TonightView warRoom={warRoom} />
      ) : (
        <>
          <ObjectiveForm warRoom={warRoom} />
          <Filters value={filters} onChange={setFilters} players={warRoom.players} />
          {visible.length === 0 ? (
            <p className="text-ash">No orders match these filters.</p>
          ) : (
            <ul className="panel px-4">
              {visible.map((o) => (
                <ObjectiveItem key={o.id} objective={o} warRoom={warRoom} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

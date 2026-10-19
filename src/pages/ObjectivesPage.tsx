import { useState } from 'react'
import { Filters, type FilterState } from '../components/objectives/Filters'
import { ObjectiveForm } from '../components/objectives/ObjectiveForm'
import { ObjectiveItem } from '../components/objectives/ObjectiveItem'
import { PageHeader } from '../components/layout/PageHeader'
import type { WarRoom } from '../state/useWarRoom'
import { TonightView } from './TonightPage'

type View = 'active' | 'tonight' | 'done'

export function ObjectivesPage({ warRoom }: { warRoom: WarRoom }) {
  const [view, setView] = useState<View>('active')
  const tonightLeft = warRoom.objectives.filter((o) => o.tonight && o.status !== 'done').length
  const activeCount = warRoom.objectives.filter((o) => o.status !== 'done').length
  const doneCount = warRoom.objectives.length - activeCount
  const [filters, setFilters] = useState<FilterState>({ assignee: 'all', category: 'all', status: 'all' })

  const visible = warRoom.objectives.filter(
    (o) =>
      (filters.assignee === 'all' || o.assignee === filters.assignee) &&
      (filters.category === 'all' || o.category === filters.category) &&
      (filters.status === 'all' || o.status === filters.status) &&
      (view === 'done' ? o.status === 'done' : o.status !== 'done'),
  )

  return (
    <section className="space-y-5">
      <PageHeader title="Crew orders" subtitle="Tonight's plan, everything still to do, and what's been done." />

      <div className="flex flex-wrap gap-1 rounded-md border border-rim bg-leather p-1" role="tablist" aria-label="Orders view">
        {(
          [
            ['active', 'Active', activeCount],
            ['tonight', 'Tonight', tonightLeft],
            ['done', 'Completed', doneCount],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              view === id ? 'bg-blood text-parchment' : 'text-ash hover:text-parchment'
            }`}
          >
            {label} <span className="stat ml-0.5 opacity-80">({count})</span>
          </button>
        ))}
      </div>

      {view === 'tonight' ? (
        <TonightView warRoom={warRoom} />
      ) : (
        <>
          {view === 'active' && <ObjectiveForm warRoom={warRoom} />}
          <Filters value={filters} onChange={setFilters} players={warRoom.players} />
          {visible.length === 0 ? (
            <p className="panel p-5 text-ash">
              {view === 'done' ? 'Nothing completed yet. Tick off an order and it lands here.' : 'No orders match these filters.'}
            </p>
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

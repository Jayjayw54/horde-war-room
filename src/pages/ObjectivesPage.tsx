import { useState } from 'react'
import { Filters, type FilterState } from '../components/objectives/Filters'
import { ObjectiveForm } from '../components/objectives/ObjectiveForm'
import { ObjectiveItem } from '../components/objectives/ObjectiveItem'
import type { WarRoom } from '../state/useWarRoom'

export function ObjectivesPage({ warRoom }: { warRoom: WarRoom }) {
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
        <h2 className="font-display text-2xl font-semibold text-gold">Objectives</h2>
        <p className="mt-1 text-ash">Everything you both swore you'd remember.</p>
      </div>
      <ObjectiveForm warRoom={warRoom} />
      <Filters value={filters} onChange={setFilters} />
      {visible.length === 0 ? (
        <p className="text-ash">No objectives match these filters.</p>
      ) : (
        <ul className="bg-leather px-4">
          {visible.map((o) => (
            <ObjectiveItem key={o.id} objective={o} warRoom={warRoom} />
          ))}
        </ul>
      )}
    </section>
  )
}

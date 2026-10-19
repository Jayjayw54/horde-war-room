import { assigneeLabel, categoryLabels, statusLabels } from '../../lib/labels'
import type { Objective, Status } from '../../types'
import type { WarRoom } from '../../state/useWarRoom'

interface Props {
  objective: Objective
  warRoom: WarRoom
  compact?: boolean
}

const statuses: Status[] = ['todo', 'doing', 'done']

export function ObjectiveItem({ objective, warRoom, compact = false }: Props) {
  const done = objective.status === 'done'
  return (
    <li className="flex items-start gap-3 border-b border-leather-light py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={done}
        onChange={() => warRoom.setStatus(objective.id, done ? 'todo' : 'done')}
        aria-label={`Mark "${objective.title}" as ${done ? 'not done' : 'done'}`}
        className="mt-1 h-5 w-5 shrink-0 accent-blood"
      />
      <div className="min-w-0 flex-1">
        <p className={done ? 'text-ash line-through' : ''}>{objective.title}</p>
        {objective.description && !compact && <p className="text-sm text-ash">{objective.description}</p>}
        <p className="mt-0.5 text-sm text-ash">
          {categoryLabels[objective.category]}
          {!compact && <> for {assigneeLabel(objective.assignee, warRoom.players)}</>}
          {objective.status === 'doing' && <span className="text-gold">, in progress</span>}
        </p>
      </div>
      {!compact && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <select
            value={objective.status}
            onChange={(e) => warRoom.setStatus(objective.id, e.target.value as Status)}
            aria-label="Status"
            className="rounded bg-ink px-2 py-1 text-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => warRoom.updateObjective(objective.id, { tonight: !objective.tonight })}
            aria-pressed={objective.tonight}
            className={`rounded px-2 py-1 text-sm ${
              objective.tonight ? 'bg-blood text-parchment' : 'bg-ink text-ash hover:text-parchment'
            }`}
          >
            {objective.tonight ? 'On tonight' : 'Add to tonight'}
          </button>
          <button
            type="button"
            onClick={() => warRoom.deleteObjective(objective.id)}
            className="rounded px-2 py-1 text-sm text-ash hover:text-blood-light"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  )
}

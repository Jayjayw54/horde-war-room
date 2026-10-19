import { assigneeLabel, categoryLabels, statusLabels } from '../../lib/labels'
import { orderProgress } from '../../lib/orders'
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
  const prog = orderProgress(objective.title, warRoom.items)
  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-rim py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={done}
        onChange={() => warRoom.setStatus(objective.id, done ? 'todo' : 'done')}
        aria-label={`Mark "${objective.title}" as ${done ? 'not done' : 'done'}`}
        className="mt-1 h-5 w-5 shrink-0 accent-blood"
      />
      <div className="min-w-0 flex-1">
        <p className={done ? 'text-ash line-through' : 'text-parchment'}>
          {objective.title}
          {prog && !done && (
            <span className={`stat ml-2 ${prog.have >= prog.want ? 'text-success' : 'text-ash'}`}>
              {prog.have}/{prog.want}
            </span>
          )}
        </p>
        {prog && !done && !compact && (
          <div className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-ink" aria-hidden>
            <div
              className={`h-full rounded-full ${prog.have >= prog.want ? 'bg-success' : 'bg-gold-dim'}`}
              style={{ width: `${Math.round((prog.have / prog.want) * 100)}%` }}
            />
          </div>
        )}
        {objective.description && !compact && <p className="text-sm text-ash">{objective.description}</p>}
        <p className="mt-1 text-sm text-ash">
          <span className="mr-1.5 rounded border border-rim px-1.5 py-px text-xs">{categoryLabels[objective.category]}</span>
          {objective.tonight && <span className="mr-1.5 rounded border border-gold/40 px-1.5 py-px text-xs text-gold">Tonight</span>}
          {!compact && <>for {assigneeLabel(objective.assignee, warRoom.players)}</>}
          {objective.status === 'doing' && <span className="text-gold">, in progress</span>}
        </p>
      </div>
      {!compact && (
        <div className="flex w-full flex-wrap items-center gap-2 pl-8 sm:w-auto sm:shrink-0 sm:justify-end sm:pl-0">
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
            className="rounded px-2 py-1 text-sm text-ash hover:text-error"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  )
}

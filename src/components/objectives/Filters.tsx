import { assigneeLabels, categoryLabels, statusLabels } from '../../lib/labels'
import type { Assignee, Category, Status } from '../../types'

export interface FilterState {
  assignee: Assignee | 'all'
  category: Category | 'all'
  status: Status | 'all'
}

interface Props {
  value: FilterState
  onChange: (value: FilterState) => void
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | 'all'
  options: Record<T, string>
  onChange: (v: T | 'all') => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ash">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T | 'all')} className="rounded bg-leather px-2 py-1 text-parchment">
        <option value="all">Any</option>
        {(Object.keys(options) as T[]).map((k) => (
          <option key={k} value={k}>
            {options[k]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Filters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <Select label="Who" value={value.assignee} options={assigneeLabels} onChange={(assignee) => onChange({ ...value, assignee })} />
      <Select label="Category" value={value.category} options={categoryLabels} onChange={(category) => onChange({ ...value, category })} />
      <Select label="Status" value={value.status} options={statusLabels} onChange={(status) => onChange({ ...value, status })} />
    </div>
  )
}

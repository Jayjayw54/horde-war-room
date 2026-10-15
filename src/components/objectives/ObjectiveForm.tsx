import { useState } from 'react'
import { assigneeLabels, categoryLabels } from '../../lib/labels'
import type { Assignee, Category } from '../../types'
import type { WarRoom } from '../../state/useWarRoom'

const assignees: Assignee[] = ['josh', 'cel', 'both']
const categories = Object.keys(categoryLabels) as Category[]

export function ObjectiveForm({ warRoom }: { warRoom: WarRoom }) {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState<Assignee>('both')
  const [category, setCategory] = useState<Category>('other')
  const [tonight, setTonight] = useState(false)

  function add() {
    const trimmed = title.trim()
    if (!trimmed) return
    warRoom.addObjective({ title: trimmed, assignee, category, status: 'todo', tonight })
    setTitle('')
    setTonight(false)
  }

  return (
    <div className="panel p-4">
      <label htmlFor="new-objective" className="font-display text-sm font-semibold text-gold">
        New objective
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="new-objective"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="e.g. Farm 10 Peacebloom"
          className="min-w-0 flex-1 rounded bg-ink px-3 py-2 placeholder:text-ash/70"
        />
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value as Assignee)}
          aria-label="Who"
          className="rounded bg-ink px-2 py-2"
        >
          {assignees.map((a) => (
            <option key={a} value={a}>
              {assigneeLabels[a]}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          aria-label="Category"
          className="rounded bg-ink px-2 py-2"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-sm">
          <input type="checkbox" checked={tonight} onChange={(e) => setTonight(e.target.checked)} className="accent-blood" />
          Tonight
        </label>
        <button
          type="button"
          onClick={add}
          disabled={!title.trim()}
          className="rounded bg-blood px-4 py-2 font-semibold hover:bg-blood-light disabled:opacity-40"
        >
          Add objective
        </button>
      </div>
    </div>
  )
}

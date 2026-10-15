import { useState } from 'react'
import { skillCaps } from '../../lib/wow'
import type { Profession } from '../../types'
import type { WarRoom } from '../../state/useWarRoom'

export function ProfessionBar({ profession, warRoom }: { profession: Profession; warRoom: WarRoom }) {
  const [editing, setEditing] = useState(false)
  const [skill, setSkill] = useState(String(profession.skillLevel))
  const [cap, setCap] = useState(profession.maxSkill)
  const [error, setError] = useState('')
  const percent = Math.min(100, Math.round((profession.skillLevel / profession.maxSkill) * 100))

  async function save() {
    const problem = await warRoom.updateProfession(profession.id, {
      skillLevel: Math.max(0, Math.min(cap, Number(skill) || 0)),
      maxSkill: cap,
    })
    if (problem) setError(problem)
    else setEditing(false)
  }

  async function remove() {
    const problem = await warRoom.deleteProfession(profession.id)
    if (problem) setError(problem)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{profession.name}</span>
        {editing ? (
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={cap}
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              aria-label={`${profession.name} skill level`}
              className="w-16 rounded bg-ink px-2 py-0.5 text-right tabular-nums"
            />
            /
            <select
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
              aria-label={`${profession.name} max skill`}
              className="rounded bg-ink px-1 py-0.5"
            >
              {skillCaps.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="button" onClick={save} className="ml-1 text-gold underline">
              Save
            </button>
            <button type="button" onClick={remove} className="text-blood-light underline">
              Remove
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-ash underline">
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSkill(String(profession.skillLevel))
              setCap(profession.maxSkill)
              setError('')
              setEditing(true)
            }}
            className="text-ash tabular-nums hover:text-parchment"
            title="Click to update"
          >
            {profession.skillLevel} / {profession.maxSkill} ✎
          </button>
        )}
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-ink"
        role="progressbar"
        aria-valuenow={profession.skillLevel}
        aria-valuemin={0}
        aria-valuemax={profession.maxSkill}
        aria-label={`${profession.name} skill`}
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
      {error && <p className="mt-1 text-sm text-blood-light">{error}</p>}
    </div>
  )
}

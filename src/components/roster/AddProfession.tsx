// A small inline form under each toon for adding a profession.
import { useState } from 'react'
import { professionNames, skillCaps } from '../../lib/wow'
import type { Character } from '../../types'
import type { WarRoom } from '../../state/useWarRoom'

export function AddProfession({ character, warRoom }: { character: Character; warRoom: WarRoom }) {
  const [open, setOpen] = useState(false)
  const taken = character.professions.map((p) => p.name)
  const available = professionNames.filter((n) => !taken.includes(n))
  const [name, setName] = useState(available[0] ?? '')
  const [skill, setSkill] = useState('1')
  const [cap, setCap] = useState(skillCaps[0])
  const [error, setError] = useState('')

  if (available.length === 0) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setName(available[0])
          setOpen(true)
        }}
        className="text-sm text-gold underline hover:text-parchment"
      >
        + Add profession
      </button>
    )
  }

  async function add() {
    const problem = await warRoom.addProfession(character.id, {
      name,
      skillLevel: Math.max(0, Math.min(cap, Number(skill) || 0)),
      maxSkill: cap,
    })
    if (problem) setError(problem)
    else {
      setOpen(false)
      setSkill('1')
      setError('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select value={name} onChange={(e) => setName(e.target.value)} aria-label="Profession" className="rounded bg-ink px-2 py-1">
        {available.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        max={cap}
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        aria-label="Skill level"
        className="w-16 rounded bg-ink px-2 py-1 text-right tabular-nums"
      />
      /
      <select value={cap} onChange={(e) => setCap(Number(e.target.value))} aria-label="Max skill" className="rounded bg-ink px-2 py-1">
        {skillCaps.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button type="button" onClick={add} className="rounded bg-blood px-3 py-1 font-semibold hover:bg-blood-light">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-ash underline hover:text-parchment">
        Cancel
      </button>
      {error && <p className="w-full text-blood-light">{error}</p>}
    </div>
  )
}

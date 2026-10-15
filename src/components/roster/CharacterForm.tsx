// The form for adding a new toon or editing an existing one.
import { useState, type FormEvent } from 'react'
import { classes, maxLevel, races } from '../../lib/wow'
import type { CharacterInput } from '../../state/useWarRoom'
import type { Player, PlayerId } from '../../types'

interface Props {
  players: Player[]
  initial?: CharacterInput
  submitLabel: string
  onSave: (input: CharacterInput) => Promise<string | null>
  onCancel: () => void
}

const field = 'rounded bg-ink px-3 py-2 text-parchment placeholder:text-ash/70'
const label = 'flex flex-col gap-1 text-sm font-semibold text-gold font-display'

export function CharacterForm({ players, initial, submitLabel, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [playerId, setPlayerId] = useState<PlayerId>(initial?.playerId ?? players[0]?.id ?? 'josh')
  const [race, setRace] = useState(initial?.race ?? races[0])
  const [className, setClassName] = useState(initial?.className ?? classes[0])
  const [level, setLevel] = useState(String(initial?.level ?? 1))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const problem = await onSave({
      name: name.trim(),
      playerId,
      race,
      className,
      level: Math.min(maxLevel, Math.max(1, Number(level) || 1)),
      notes: notes.trim(),
    })
    setBusy(false)
    if (problem) setError(problem)
  }

  // If the toon's current race/class isn't in our lists, keep it as an option so editing doesn't lose it.
  const raceOptions = races.includes(race) ? races : [race, ...races]
  const classOptions = classes.includes(className) ? classes : [className, ...classes]

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 bg-leather p-5 sm:grid-cols-2">
      <label className={label}>
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="e.g. Grimsley" />
      </label>
      <label className={label}>
        Played by
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value as PlayerId)} className={field}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Race
        <select value={race} onChange={(e) => setRace(e.target.value)} className={field}>
          {raceOptions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className={label}>
        Class
        <select value={className} onChange={(e) => setClassName(e.target.value)} className={field}>
          {classOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className={label}>
        Level
        <input
          type="number"
          min={1}
          max={maxLevel}
          required
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={field}
        />
      </label>
      <label className={label}>
        Notes
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={field} placeholder="Optional" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded bg-blood px-4 py-2 font-semibold hover:bg-blood-light disabled:opacity-40"
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-ash underline hover:text-parchment">
          Cancel
        </button>
        {error && <p className="text-blood-light">{error}</p>}
      </div>
    </form>
  )
}

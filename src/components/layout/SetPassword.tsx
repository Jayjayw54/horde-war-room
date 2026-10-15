// Lets a logged-in player set or change their password.
import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export function SetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setMessage(error.message)
    } else {
      setPassword('')
      setMessage('Password saved.')
      setTimeout(onDone, 1200)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
      <label htmlFor="new-password" className="sr-only">
        New password
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="New password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-md border border-leather-light bg-ink px-3 py-1 text-sm text-parchment placeholder:text-ash"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-blood px-3 py-1 font-display text-sm font-semibold text-parchment hover:bg-blood-light disabled:opacity-60"
      >
        Save
      </button>
      <button type="button" onClick={onDone} className="text-sm text-ash underline hover:text-parchment">
        Cancel
      </button>
      {message && <span className="text-sm text-gold">{message}</span>}
    </form>
  )
}

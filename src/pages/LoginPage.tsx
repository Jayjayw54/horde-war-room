// The front gate: sign in with email and password, or create an account the first time.
import { useState, type FormEvent } from 'react'
import { Backdrop } from '../components/layout/Backdrop'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    // On success, useSession notices the new login and the war room opens by itself.
    if (error) setError(error.message)
    setBusy(false)
  }

  const inputClass = 'rounded-md border border-leather-light bg-ink px-3 py-2 text-parchment placeholder:text-ash'
  const labelClass = 'font-display text-sm font-semibold text-parchment'

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-5">
      <Backdrop />
      <div className="w-full max-w-md rounded-lg border-t-4 border-blood bg-leather p-8 shadow-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-wide text-gold">Horde War Room</h1>
        <p className="mt-1 text-ash">Members only. State your name, grunt.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-md bg-blood px-4 py-2 font-display font-semibold text-parchment transition-colors hover:bg-blood-light disabled:opacity-60"
          >
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          {error && <p className="text-blood-light">{error}</p>}
        </form>

        <p className="mt-6 text-sm text-ash">
          {mode === 'signin' ? 'First time here? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError('')
            }}
            className="text-gold underline hover:text-parchment"
          >
            {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
          </button>
        </p>
      </div>
    </div>
  )
}

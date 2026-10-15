// The front gate: enter your email, get a magic link, click it, you're in.
import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Stage = 'idle' | 'sending' | 'sent' | 'error'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStage('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStage('error')
    } else {
      setStage('sent')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-lg border-t-4 border-blood bg-leather p-8 shadow-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-wide text-gold">Horde War Room</h1>
        <p className="mt-1 text-ash">Members only. State your name, grunt.</p>

        {stage === 'sent' ? (
          <p className="mt-6 text-parchment">
            A magic link is on its way to <strong className="text-gold">{email}</strong>. Open it on this computer to
            enter the war room.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="email" className="font-display text-sm font-semibold text-parchment">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-leather-light bg-ink px-3 py-2 text-parchment placeholder:text-ash"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={stage === 'sending'}
              className="rounded-md bg-blood px-4 py-2 font-display font-semibold text-parchment transition-colors hover:bg-blood-light disabled:opacity-60"
            >
              {stage === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
            {stage === 'error' && <p className="text-blood-light">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}

// First visit after signing up: pick the name your war party will see, then start a war party
// or join one with an invite code. Invite links (…/?join=K7Q2MX) fill the code in for you.
import { useState, type FormEvent } from 'react'
import { Backdrop } from '../components/layout/Backdrop'
import { readInviteCode, clearInviteCode } from '../lib/invite'
import { supabase } from '../lib/supabase'
import type { WarRoom } from '../state/useWarRoom'

const input = 'rounded-md border border-leather-light bg-ink px-3 py-2 text-parchment placeholder:text-ash'
const button =
  'rounded-md bg-blood px-4 py-2 font-display font-semibold text-parchment transition-colors hover:bg-blood-light disabled:opacity-60'

export function WelcomePage({ warRoom }: { warRoom: WarRoom }) {
  const [name, setName] = useState('')
  const [partyName, setPartyName] = useState('')
  const [code, setCode] = useState(readInviteCode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<string | null>) {
    setBusy(true)
    setError('')
    const problem = await action()
    setBusy(false)
    if (problem) setError(problem)
    return !problem
  }

  async function saveName(event: FormEvent) {
    event.preventDefault()
    await run(() => warRoom.setDisplayName(name))
  }

  async function join(event: FormEvent) {
    event.preventDefault()
    if (await run(() => warRoom.joinParty(code))) clearInviteCode()
  }

  async function create(event: FormEvent) {
    event.preventDefault()
    await run(() => warRoom.createParty(partyName))
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-5 py-10">
      <Backdrop />
      <div className="w-full max-w-lg rounded-lg border-t-4 border-blood bg-leather p-8 shadow-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-wide text-gold">Welcome to the War Room</h1>

        {!warRoom.me ? (
          <>
            <p className="mt-2 text-ash">First, what should your war party call you? Your main's first name works well.</p>
            <form onSubmit={saveName} className="mt-5 flex flex-col gap-3">
              <label htmlFor="display-name" className="font-display text-sm font-semibold text-parchment">
                Your name
              </label>
              <input
                id="display-name"
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grimsley"
                className={input}
              />
              <button type="submit" disabled={busy || !name.trim()} className={button}>
                {busy ? 'One moment…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 text-ash">
              Lok'tar, <span className="text-parchment">{warRoom.me.displayName}</span>. A war room belongs to a war party: you and
              your mates, or your whole guild. Join one, or start your own and invite people.
            </p>

            <form onSubmit={join} className="mt-6 flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold text-gold">Join a war party</h2>
              <label htmlFor="invite-code" className="text-sm text-ash">
                Ask the party leader for the invite code (it's on their War party page).
              </label>
              <div className="flex gap-2">
                <input
                  id="invite-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. K7Q2MX"
                  className={`${input} min-w-0 flex-1 font-mono tracking-widest uppercase`}
                />
                <button type="submit" disabled={busy || !code.trim()} className={button}>
                  Join
                </button>
              </div>
            </form>

            <div className="my-6 flex items-center gap-3 text-sm text-ash">
              <span className="h-px flex-1 bg-leather-light" /> or <span className="h-px flex-1 bg-leather-light" />
            </div>

            <form onSubmit={create} className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold text-gold">Start a war party</h2>
              <label htmlFor="party-name" className="text-sm text-ash">
                Name it after your guild, your duo, or anything you like. You'll get an invite code to share.
              </label>
              <div className="flex gap-2">
                <input
                  id="party-name"
                  required
                  maxLength={60}
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Blood and Thunder"
                  className={`${input} min-w-0 flex-1`}
                />
                <button type="submit" disabled={busy || !partyName.trim()} className={button}>
                  Start
                </button>
              </div>
            </form>
          </>
        )}

        {error && <p className="mt-4 text-blood-light">{error}</p>}

        <button type="button" onClick={() => supabase.auth.signOut()} className="mt-8 text-sm text-ash underline hover:text-parchment">
          Sign out
        </button>
      </div>
    </div>
  )
}

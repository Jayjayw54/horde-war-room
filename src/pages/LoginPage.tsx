// The front gate and landing page: what The Bloodbound is, then sign in, create an account, or
// bring an invite code. The sign-in logic is unchanged; the page around it explains the product.
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { BloodboundMark, Wordmark } from '../components/brand/Logo'
import {
  OrdersIcon,
  PlannerIcon,
  ProgressIcon,
  RosterIcon,
  ScrollIcon,
  StoresIcon,
  SyncIcon,
  WishlistIcon,
} from '../components/brand/Icons'
import { Backdrop } from '../components/layout/Backdrop'
import { readInviteCode, saveInviteCode } from '../lib/invite'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup' | 'join'

const FEATURES: { icon: ReactNode; title: string; short: string; text: string }[] = [
  {
    icon: <RosterIcon />,
    title: 'Roster',
    short: 'Crew roster',
    text: "Every member's characters in one place: level, class, professions, gold, gear and stats, straight from the game.",
  },
  {
    icon: <OrdersIcon />,
    title: 'Orders',
    short: 'Crew orders',
    text: "A shared to-do list for the crew. Assign tasks, flag tonight's plan, and tick things off on the site or in game.",
  },
  {
    icon: <StoresIcon />,
    title: 'Shared stores',
    short: 'Shared stores',
    text: 'Search everyone’s bags and banks at once. Find out who has the Copper Ore before anyone farms more.',
  },
  {
    icon: <PlannerIcon />,
    title: 'Profession planner',
    short: 'Professions',
    text: 'Pick a craft and see the materials, what the crew already holds, what is missing, and who should make it.',
  },
  {
    icon: <WishlistIcon />,
    title: 'Best-in-slot lists',
    short: 'Gear wishlists',
    text: 'A gear wishlist for each character that ticks itself off when the item turns up in bags, bank or gear.',
  },
  {
    icon: <ProgressIcon />,
    title: 'Progress',
    short: 'Progression',
    text: 'The levelling race and the crew’s gold over time, charted from every sync.',
  },
]

export function LoginPage() {
  // Arriving from an invite link usually means you're new, so start on "Create account".
  const invited = readInviteCode() !== ''
  const [mode, setMode] = useState<Mode>(invited ? 'signup' : 'signin')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(readInviteCode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const panel = useRef<HTMLDivElement>(null)

  // The hero buttons open the right form and bring it into view (it sits beside the hero on wide screens).
  function open(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => panel.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }), 350)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (mode === 'join') {
      // Remember the code; after signing up (or in), the Welcome step offers to join with it.
      const clean = code.trim().toUpperCase()
      if (!/^[A-Z0-9]{6}$/.test(clean)) return setError('Invite codes are 6 letters and numbers, like K7Q2MX.')
      saveInviteCode(clean)
      setMode('signup')
      setNotice(`Code ${clean} saved. Make an account (or sign in) and you'll be asked to join that crew.`)
      return
    }
    setBusy(true)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      // If Supabase is set to confirm emails, there's no login yet: say so instead of doing nothing.
      else if (!data.session) setNotice('Check your email for a link to confirm your account, then sign in here.')
    }
    // On success, useSession notices the new login and the stronghold opens by itself.
    setBusy(false)
  }

  const input =
    'w-full rounded-md border border-rim bg-ink/80 px-3 py-2.5 text-parchment placeholder:text-ash/70 focus:border-gold/60 focus:outline-none'
  const label = 'text-sm font-semibold text-parchment'
  const title = { signin: 'Sign in', signup: 'Create your account', join: 'Join with an invite code' }[mode]

  return (
    <div className="relative isolate min-h-screen">
      <Backdrop />

      {/* ---- Top bar ---- */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <a href="#top" className="flex items-center gap-3" aria-label="The Bloodbound">
            <BloodboundMark className="h-10 w-10" />
            <Wordmark className="hidden items-start! text-lg text-parchment sm:inline-flex" />
          </a>
          <nav aria-label="Sections" className="ml-4 hidden gap-6 text-sm text-parchment/80 md:flex">
            <a href="#features" className="hover:text-parchment">Features</a>
            <a href="#how" className="hover:text-parchment">How it works</a>
            <a href="#ingame" className="hover:text-parchment">Addon</a>
          </nav>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => open('signin')} className="rounded-md border border-parchment/30 px-3.5 py-2 text-sm font-semibold text-parchment hover:border-parchment/60">
              Sign in
            </button>
            <button type="button" onClick={() => open('signup')} className="rounded-md bg-blood px-3.5 py-2 text-sm font-semibold text-parchment hover:bg-blood-light">
              Get started
            </button>
          </div>
        </div>
      </div>

      {/* ---- Hero: the fortress at dusk, name, oath, and the way in ---- */}
      <div id="top" className="relative overflow-hidden">
        <picture>
          <source media="(min-width: 768px)" srcSet="/art/hero.jpg" />
          <img src="/art/hero-small.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,13,15,0.94)_0%,rgba(12,13,15,0.75)_40%,rgba(12,13,15,0.25)_75%,rgba(12,13,15,0.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,#111315)]" />
      <header className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-28 pb-16 sm:pt-32 lg:grid-cols-[1fr_24rem] lg:gap-16 lg:pt-36 lg:pb-24">
        <div>
          <p className="mb-5 text-sm font-semibold text-gold">A companion for World of Warcraft: Forever crews</p>
          <div className="flex items-center gap-4 sm:gap-5">
            <BloodboundMark className="h-16 w-16 shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)] sm:h-24 sm:w-24" />
            <Wordmark className="items-start! text-[2rem] text-parchment [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] sm:text-6xl" />
          </div>
          <p className="mt-6 font-display text-xl text-gold sm:text-2xl">Bound by blood. United by battle.</p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-parchment/90">
            A shared stronghold for World of Warcraft: Forever crews. Keep everyone’s characters, orders, bags and
            profession plans in one place, so the whole crew knows what to do next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => open('signup')}
              className="rounded-md bg-blood px-5 py-3 font-semibold text-parchment shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-blood-light focus-visible:outline-2"
            >
              Start a crew
            </button>
            <button
              type="button"
              onClick={() => open('join')}
              className="rounded-md border border-gold/50 px-5 py-3 font-semibold text-gold transition-colors hover:border-gold hover:bg-gold/10"
            >
              Join with an invite code
            </button>
          </div>
          <p className="mt-4 text-sm text-parchment/70">Free. One crew or several: a duo of mates or a whole guild.</p>

          {/* What's inside, at a glance */}
          <ul className="mt-10 grid max-w-2xl grid-cols-3 gap-y-5 border-t border-parchment/15 pt-6 sm:grid-cols-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex flex-col items-center gap-1.5 px-1 text-center">
                <span className="text-gold">{f.icon}</span>
                <span className="text-xs font-semibold text-parchment/90">{f.short}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- The gate: sign in / create account / invite code ---- */}
        <div ref={panel} className="panel scroll-mt-6 border-t-2 border-t-blood p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] sm:p-7">
          <h2 className="font-display text-xl font-semibold text-parchment">{title}</h2>
          {invited && mode !== 'join' && (
            <p className="mt-1 text-sm text-gold">You've been invited to a crew. Make an account to take your oath.</p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {mode === 'join' ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite" className={label}>
                  Invite code
                </label>
                <input
                  id="invite"
                  required
                  autoComplete="off"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="K7Q2MX"
                  className={`${input} font-stat text-xl tracking-[0.3em] uppercase`}
                />
                <p className="text-sm text-ash">Ask your crew leader. It's on their Crew page.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className={label}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={input}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className={label}>
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
                    className={input}
                  />
                  {mode === 'signup' && <p className="text-sm text-ash">At least 8 characters.</p>}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 rounded-md bg-blood px-4 py-2.5 font-semibold text-parchment transition-colors hover:bg-blood-light disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Use this code'}
            </button>
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-success">
                {notice}
              </p>
            )}
          </form>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-rim pt-4 text-sm">
            {mode !== 'signin' && (
              <button type="button" onClick={() => open('signin')} className="text-gold underline-offset-4 hover:underline">
                I have an account
              </button>
            )}
            {mode !== 'signup' && (
              <button type="button" onClick={() => open('signup')} className="text-gold underline-offset-4 hover:underline">
                Create an account
              </button>
            )}
            {mode !== 'join' && (
              <button type="button" onClick={() => open('join')} className="text-gold underline-offset-4 hover:underline">
                I have an invite code
              </button>
            )}
          </div>
        </div>
      </header>
      </div>

      <main className="relative bg-[linear-gradient(180deg,rgba(17,19,21,0)_0%,#111315_6rem)]">
        {/* ---- What the crew gets ---- */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-6 px-5 pt-10 pb-16" aria-labelledby="features-title">
          <h2 id="features-title" className="font-display text-2xl font-semibold text-parchment sm:text-3xl">
            One stronghold for the whole crew
          </h2>
          <p className="mt-2 max-w-2xl text-ash">
            Everything below is filled in from the game by a small addon, so nobody has to type their bags in by hand.
          </p>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-lg border border-rim bg-rim sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="bg-leather p-6">
                <span className="text-gold">{f.icon}</span>
                <h3 className="mt-3 text-lg font-semibold text-parchment">{f.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ash">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- The game side ---- */}
        <section id="ingame" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-16" aria-labelledby="ingame-title">
          <div className="grid gap-6 rounded-lg border border-rim bg-[linear-gradient(135deg,#1f1a1c,#1c2022_55%)] p-6 sm:p-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <h2 id="ingame-title" className="font-display text-2xl font-semibold text-parchment">In the game, too</h2>
              <p className="mt-2 leading-relaxed text-ash">
                The Bloodbound addon records your characters as you play. Type <span className="font-stat text-lg text-parchment">/bloodbound</span>{' '}
                in game for the crew window: tonight's orders, who has an item, what's still needed, and everyone's toons.
              </p>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <ScrollIcon className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                <p className="text-ash">
                  <span className="font-semibold text-parchment">Addon.</span> Tick off orders in game; they reach the website on your next
                  reload.
                </p>
              </li>
              <li className="flex gap-3">
                <SyncIcon className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                <p className="text-ash">
                  <span className="font-semibold text-parchment">Optional launcher.</span> Syncs both ways every time you reload or log
                  out, then closes when you quit. Prefer not to? Upload the addon's file on the website instead.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* ---- How a crew comes together (a real sequence, so it's numbered) ---- */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-20" aria-labelledby="how-title">
          <h2 id="how-title" className="font-display text-2xl font-semibold text-parchment">How a crew comes together</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              ['Make an account', 'Sign up with an email and pick the name your crew will see.'],
              ['Start or join a crew', 'Start one and share its invite link, or join with a code from your leader.'],
              ['Bring your characters', 'Install the addon, play, then sync. Your crew sees your toons; only you can change them.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="font-stat text-4xl leading-none font-semibold text-blood-light">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-parchment">{t}</h3>
                  <p className="mt-1 text-ash">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-ash">
            Each crew only ever sees its own members' characters, bags and orders.
          </p>
        </section>
      </main>

      <footer className="border-t border-rim bg-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-ash">
          <span className="flex items-center gap-2">
            <BloodboundMark className="h-6 w-6" />
            The Bloodbound. One crew. No one left behind.
          </span>
          <span>A community project for WoW: Forever players. Not affiliated with or endorsed by Blizzard Entertainment.</span>
        </div>
      </footer>
    </div>
  )
}

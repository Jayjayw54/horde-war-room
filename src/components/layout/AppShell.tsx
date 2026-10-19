// The frame around every page once you're signed in: a left sidebar (a slide-out menu on phones), and a
// top bar with the crew's identity and a search box. Replaces the old hanging-banner header.
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { latestVersion } from '../../data/changelog'
import { downloadBackup } from '../../lib/backup'
import { supabase } from '../../lib/supabase'
import { BloodboundMark, Wordmark } from '../brand/Logo'
import {
  BannerIcon,
  BookIcon,
  ChronicleIcon,
  CloseIcon,
  MenuIcon,
  OrdersIcon,
  PlannerIcon,
  ProgressIcon,
  RosterIcon,
  SearchIcon,
  SettingsIcon,
  StoresIcon,
  StrongholdIcon,
  WishlistIcon,
} from '../brand/Icons'
import { SetPassword } from './SetPassword'

export type Page = 'home' | 'roster' | 'progress' | 'bank' | 'planner' | 'objectives' | 'notes' | 'bis' | 'changelog' | 'party'

const MAIN: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Stronghold', icon: <StrongholdIcon className="h-5 w-5" /> },
  { id: 'roster', label: 'Roster', icon: <RosterIcon className="h-5 w-5" /> },
  { id: 'bank', label: 'Stores', icon: <StoresIcon className="h-5 w-5" /> },
  { id: 'planner', label: 'Professions', icon: <PlannerIcon className="h-5 w-5" /> },
  { id: 'bis', label: 'Gear & wishlists', icon: <WishlistIcon className="h-5 w-5" /> },
  { id: 'objectives', label: 'Orders', icon: <OrdersIcon className="h-5 w-5" /> },
  { id: 'progress', label: 'Progress', icon: <ProgressIcon className="h-5 w-5" /> },
  { id: 'party', label: 'Crew', icon: <BannerIcon className="h-5 w-5" /> },
]
const MORE: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'notes', label: 'Beta notes', icon: <BookIcon className="h-5 w-5" /> },
  { id: 'changelog', label: "What's new", icon: <ChronicleIcon className="h-5 w-5" /> },
]

const SEEN_KEY = 'hwr-changelog-seen'
function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY)
  } catch {
    return null
  }
}

interface Props {
  page: Page
  onNavigate: (page: Page) => void
  email: string
  live: boolean
  partyName: string
  memberCount: number
  characterCount: number
  parties: { id: string; name: string }[]
  partyId: string | null
  onSwitchParty: (id: string) => void
  onSearch: (query: string) => void
  children: ReactNode
}

export function AppShell(props: Props) {
  const { page, onNavigate, live, children } = props
  const [menuOpen, setMenuOpen] = useState(false)
  const [seen, setSeen] = useState(readSeen)
  const hasNew = seen !== latestVersion

  function go(id: Page) {
    onNavigate(id)
    setMenuOpen(false)
    if (id === 'changelog') {
      setSeen(latestVersion)
      try {
        localStorage.setItem(SEEN_KEY, latestVersion)
      } catch {
        /* the dot just shows again next time */
      }
    }
    window.scrollTo({ top: 0 })
  }

  // Escape closes the phone menu.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const nav = (
    <nav aria-label="Main" className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {MAIN.map((item) => (
          <NavItem key={item.id} {...item} active={page === item.id} onClick={() => go(item.id)} />
        ))}
      </ul>
      <ul className="mt-6 space-y-0.5 border-t border-rim pt-4">
        {MORE.map((item) => (
          <NavItem
            key={item.id}
            {...item}
            active={page === item.id}
            dot={item.id === 'changelog' && hasNew}
            onClick={() => go(item.id)}
          />
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <SettingsMenu email={props.email} live={live} />
      </div>
    </nav>
  )

  return (
    <div className="lg:pl-64">
      {/* Sidebar (wide screens) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-rim bg-[linear-gradient(180deg,#16191b,#121416)] lg:flex">
        <button
          type="button"
          onClick={() => go('home')}
          className="flex items-center gap-3 border-b border-rim px-5 py-4 text-left"
          aria-label="The Bloodbound, go to the Stronghold"
        >
          <BloodboundMark className="h-10 w-10 shrink-0" />
          <Wordmark className="items-start! text-lg text-parchment" />
        </button>
        {nav}
      </aside>

      {/* Slide-out menu (phones and tablets) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-rim bg-[#141618] shadow-2xl">
            <div className="flex items-center justify-between border-b border-rim px-4 py-3">
              <span className="flex items-center gap-3">
                <BloodboundMark className="h-9 w-9" />
                <Wordmark className="items-start! text-base text-parchment" />
              </span>
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded p-2 text-ash hover:text-parchment" aria-label="Close menu">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <TopBar {...props} onOpenMenu={() => setMenuOpen(true)} />
      {children}
    </div>
  )
}

function NavItem({
  label,
  icon,
  active,
  dot,
  onClick,
}: {
  label: string
  icon: ReactNode
  active: boolean
  dot?: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] font-semibold transition-colors ${
          active
            ? 'bg-[linear-gradient(90deg,#76282e,#5e2227)] text-parchment shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
            : 'text-ash hover:bg-white/[0.04] hover:text-parchment'
        }`}
      >
        <span className={active ? 'text-gold' : ''}>{icon}</span>
        {label}
        {dot && <span className="ml-auto h-2 w-2 rounded-full bg-gold" aria-label="(new)" />}
      </button>
    </li>
  )
}

function SettingsMenu({ email, live }: { email: string; live: boolean }) {
  const [open, setOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [status, setStatus] = useState('')

  async function backup() {
    setStatus('Packing up…')
    try {
      const counts = await downloadBackup()
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      setStatus(`Saved ${total.toLocaleString()} records to your Downloads folder.`)
    } catch (e) {
      setStatus(`Backup failed: ${(e as Error).message}`)
    }
  }

  const item = 'block w-full rounded px-2 py-1.5 text-left text-sm text-ash hover:bg-white/[0.04] hover:text-parchment'
  return (
    <div className="rounded-md border border-rim bg-ink/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] font-semibold text-ash hover:text-parchment"
      >
        <SettingsIcon className="h-5 w-5" />
        Settings
        <span className={`ml-auto inline-flex items-center gap-1.5 text-xs font-normal ${live ? 'text-success' : 'text-ash/70'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-success' : 'bg-ash/60'}`} />
          {live ? 'Live' : 'Offline'}
        </span>
      </button>
      {open && (
        <div className="border-t border-rim p-2">
          <p className="truncate px-2 pb-1 text-xs text-ash" title={email}>
            {email}
          </p>
          <button type="button" onClick={backup} className={item}>
            Export backup
          </button>
          <button type="button" onClick={() => setChangingPassword(!changingPassword)} className={item}>
            Change password
          </button>
          {changingPassword && <SetPassword onDone={() => setChangingPassword(false)} />}
          <button type="button" onClick={() => supabase.auth.signOut()} className={item}>
            Sign out
          </button>
          {status && <p className="px-2 pt-1 text-xs text-gold">{status}</p>}
        </div>
      )}
    </div>
  )
}

function TopBar(props: Props & { onOpenMenu: () => void }) {
  const { partyName, memberCount, characterCount, parties, partyId, onSwitchParty, live, onSearch, onOpenMenu } = props
  const [query, setQuery] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <header className="sticky top-0 z-30 border-b border-rim bg-[#121416]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121416]/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-1 rounded p-2 text-ash hover:text-parchment lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* The crew: crest, name (switch if you're in several), members and characters */}
        <div className="flex min-w-0 items-center gap-3">
          <BloodboundMark className="hidden h-9 w-9 shrink-0 sm:block" />
          <div className="min-w-0">
            {parties.length > 1 ? (
              <label className="block">
                <span className="sr-only">Crew</span>
                <select
                  value={partyId ?? ''}
                  onChange={(e) => onSwitchParty(e.target.value)}
                  className="max-w-[12rem] truncate rounded bg-transparent font-display text-base font-semibold text-parchment sm:max-w-xs sm:text-lg"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id} className="bg-leather font-body text-base">
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="truncate font-display text-base font-semibold text-parchment sm:text-lg">{partyName}</p>
            )}
            <p className="truncate text-xs text-ash sm:text-sm">
              {memberCount} {memberCount === 1 ? 'member' : 'members'} · {characterCount}{' '}
              {characterCount === 1 ? 'character' : 'characters'}
              <span className={`ml-2 hidden sm:inline ${live ? 'text-success' : ''}`}>{live ? '· Live' : ''}</span>
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="ml-auto hidden w-full max-w-xs sm:block" role="search">
          <label htmlFor="global-search" className="sr-only">
            Search characters and items
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ash" />
            <input
              id="global-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search characters, items…"
              className="w-full rounded-md border border-rim bg-ink/80 py-2 pr-3 pl-9 text-sm text-parchment placeholder:text-ash/70 focus:border-gold/60 focus:outline-none"
            />
          </div>
        </form>
      </div>
    </header>
  )
}

import { useState } from 'react'
import { downloadBackup } from '../../lib/backup'
import { supabase } from '../../lib/supabase'
import { SetPassword } from './SetPassword'
import { latestVersion } from '../../data/changelog'
import { OathGlyph, Wordmark } from '../brand/Logo'

export type Page = 'home' | 'roster' | 'progress' | 'bank' | 'planner' | 'objectives' | 'notes' | 'bis' | 'changelog' | 'party'

// Tabs shown on the tab rail ("What's new" is opened from the link in the top corner instead).
const tabs: { id: Page; label: string }[] = [
  { id: 'home', label: 'Stronghold' },
  { id: 'roster', label: 'Roster' },
  { id: 'progress', label: 'Progress' },
  { id: 'bank', label: 'Bank' },
  { id: 'planner', label: 'Planner' },
  { id: 'bis', label: 'BiS' },
  { id: 'objectives', label: 'Orders' },
  { id: 'notes', label: 'Beta notes' },
  { id: 'party', label: 'Crew' },
]

const SEEN_KEY = 'hwr-changelog-seen'
function readSeenVersion() {
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
  // The crew on screen, and the others you're in (for the switcher).
  partyName: string
  parties: { id: string; name: string }[]
  partyId: string | null
  onSwitchParty: (id: string) => void
}

export function Header({ page, onNavigate, email, live, partyName, parties, partyId, onSwitchParty }: Props) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')

  async function backup() {
    setBackupStatus('Packing up…')
    try {
      const counts = await downloadBackup()
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      setBackupStatus(`Saved ${total.toLocaleString()} records to your Downloads folder.`)
    } catch (e) {
      setBackupStatus(`Backup failed: ${(e as Error).message}`)
    }
  }
  const [seenVersion, setSeenVersion] = useState(readSeenVersion)
  const hasNew = seenVersion !== latestVersion

  function openChangelog() {
    onNavigate('changelog')
    setSeenVersion(latestVersion)
    try {
      localStorage.setItem(SEEN_KEY, latestVersion)
    } catch {
      /* fine: the dot just shows again next time */
    }
  }

  const link = 'text-ash underline decoration-rim underline-offset-4 transition-colors hover:text-parchment hover:decoration-ash'

  return (
    <>
      {/* The header overlaps the top of the tab rail (so the banner can hang over it). Its empty space
          lets clicks through to the tabs; only the banner and the links on the right catch them. */}
      <header className="pointer-events-none relative z-40 mx-auto flex max-w-7xl items-start justify-between gap-4 px-5 *:pointer-events-auto">
        {/* The banner hangs from the top edge of the page */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="war-banner flex w-40 shrink-0 flex-col items-center px-4 pt-4 pb-9 text-center sm:w-52 sm:px-5 sm:pt-5 sm:pb-11"
          aria-label="The Bloodbound, go to the Stronghold"
        >
          <OathGlyph className="h-10 w-10 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] sm:h-12 sm:w-12" />
          <Wordmark className="mt-2 text-lg text-parchment [text-shadow:0_2px_0_rgba(0,0,0,0.45)] sm:text-[1.35rem]" />
          <span className="mt-2 line-clamp-2 block text-xs leading-snug text-vellum/80 sm:text-sm">
            {partyName || 'Bound by blood. United by battle.'}
          </span>
        </button>

        <div className="min-w-0 pt-4 text-right text-sm text-ash">
          <p>
            <span
              className={`mr-2 inline-flex items-center gap-1.5 text-xs ${live ? 'text-success' : 'text-ash/70'}`}
              title={live ? 'Changes from your crew appear by themselves' : 'Not connected for live updates'}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${live ? 'bg-success' : 'bg-ash/60'}`} />
              {live ? 'Live' : 'Offline'}
            </span>
            <span className="hidden sm:inline">{email}</span>
          </p>
          {parties.length > 1 && (
            <label className="mt-1 flex items-center justify-end gap-2 text-xs">
              Crew
              <select
                value={partyId ?? ''}
                onChange={(e) => onSwitchParty(e.target.value)}
                className="rounded border border-rim bg-leather px-2 py-0.5 text-sm text-parchment"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="mt-1 flex flex-wrap justify-end gap-x-4 gap-y-1">
            <button type="button" onClick={openChangelog} className={link}>
              What's new v{latestVersion}
              {hasNew && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-gold align-middle" aria-label="(new)" />}
            </button>
            <button type="button" onClick={backup} className={link}>
              Export backup
            </button>
            <button type="button" onClick={() => setChangingPassword(true)} className={link}>
              Change password
            </button>
            <button type="button" onClick={() => supabase.auth.signOut()} className={link}>
              Sign out
            </button>
          </p>
          {backupStatus && <p className="mt-1 text-xs text-gold">{backupStatus}</p>}
          {changingPassword && (
            <div className="flex justify-end">
              <SetPassword onDone={() => setChangingPassword(false)} />
            </div>
          )}
        </div>
      </header>

      {/* Tab rail: a forged-iron bar the tabs sit on. Stays in view while you scroll. */}
      <nav
        aria-label="Main"
        className="sticky top-0 z-30 border-y border-rim bg-[linear-gradient(180deg,#1f2326,#181b1d)] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.9)] sm:-mt-6"
      >
        {/* On wider screens the tabs start to the right of the banner, so it never covers them. */}
        <ul className="mx-auto flex max-w-7xl gap-0.5 overflow-x-auto px-3 [scrollbar-width:none] sm:pl-[15rem]">
          {tabs.map((tab) => {
            const active = tab.id === page
            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3.5 py-3 text-[15px] font-semibold transition-colors sm:px-4 ${
                    active ? 'bg-blood/20 text-parchment' : 'text-ash hover:bg-white/[0.03] hover:text-parchment'
                  }`}
                >
                  {tab.label}
                  {/* crimson bar under the active tab */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t-sm bg-blood-light transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

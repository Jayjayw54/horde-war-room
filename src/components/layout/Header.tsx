import { useState } from 'react'
import { downloadBackup } from '../../lib/backup'
import { supabase } from '../../lib/supabase'
import { SetPassword } from './SetPassword'
import { latestVersion } from '../../data/changelog'

export type Page = 'home' | 'roster' | 'progress' | 'bank' | 'planner' | 'objectives' | 'notes' | 'bis' | 'changelog' | 'party'

// Tabs shown on the tab rail ("What's new" is opened from the link in the top corner instead).
const tabs: { id: Page; label: string }[] = [
  { id: 'home', label: 'War table' },
  { id: 'roster', label: 'Roster' },
  { id: 'progress', label: 'Progress' },
  { id: 'bank', label: 'Bank' },
  { id: 'planner', label: 'Planner' },
  { id: 'bis', label: 'BiS' },
  { id: 'objectives', label: 'Objectives' },
  { id: 'notes', label: 'Beta notes' },
  { id: 'party', label: 'War party' },
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
  // The war party on screen, and the others you're in (for the switcher).
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

  const link = 'text-gold/90 underline decoration-gold/40 underline-offset-2 hover:text-parchment'

  return (
    <>
      {/* The header overlaps the top of the tab rail (so the banner can hang over it). Its empty space
          lets clicks through to the tabs; only the banner and the links on the right catch them. */}
      <header className="pointer-events-none relative z-40 mx-auto flex max-w-7xl items-start justify-between gap-4 px-5 *:pointer-events-auto">
        {/* The banner hangs from the top edge of the page */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="war-banner w-60 shrink-0 px-6 pt-6 pb-12 text-center"
          aria-label="Warcall, go to the war table"
        >
          <span className="block font-display text-3xl leading-none font-extrabold tracking-wide text-gold [text-shadow:0_2px_0_#3a0d08] sm:text-4xl">
            Warcall
          </span>
          <span className="mt-2 block text-sm text-parchment/80">{partyName || 'Answer the call.'}</span>
        </button>

        <div className="pt-5 text-right text-sm text-ash">
          <p>
            <span
              className={`mr-2 inline-flex items-center gap-1 text-xs ${live ? 'text-[#1eff00]/80' : 'text-ash/60'}`}
              title={live ? 'Changes from your war party appear by themselves' : 'Not connected for live updates'}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${live ? 'bg-[#1eff00]' : 'bg-ash/60'}`} />
              {live ? 'Live' : 'Offline'}
            </span>
            {email}
          </p>
          {parties.length > 1 && (
            <label className="mt-1 flex items-center justify-end gap-2 text-xs">
              War party
              <select
                value={partyId ?? ''}
                onChange={(e) => onSwitchParty(e.target.value)}
                className="rounded bg-ink px-2 py-0.5 text-sm text-parchment"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="mt-1 flex flex-wrap justify-end gap-x-3">
            <button type="button" onClick={openChangelog} className={link}>
              What's new v{latestVersion}
              {hasNew && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-blood-light align-middle" aria-label="(new)" />}
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

      {/* Tab rail: an iron bar the tabs hang on. Stays in view while you scroll. */}
      <nav
        aria-label="Main"
        className="sticky top-0 z-30 border-y sm:-mt-6 border-gold/25 bg-[linear-gradient(180deg,#201612,#170f0c)] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.8)]"
      >
        {/* On wider screens the tabs start to the right of the banner, so it never covers them. */}
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 [scrollbar-width:none] sm:pl-[17.5rem]">
          {tabs.map((tab) => {
            const active = tab.id === page
            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-4 py-3 font-display text-sm font-semibold tracking-wide transition-colors ${
                    active
                      ? 'bg-[linear-gradient(180deg,rgba(155,35,24,0.45),rgba(155,35,24,0.1))] text-gold'
                      : 'text-ash hover:text-parchment'
                  }`}
                >
                  {tab.label}
                  {/* gold bar under the active tab */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-2 bottom-0 h-0.5 bg-gold transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
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

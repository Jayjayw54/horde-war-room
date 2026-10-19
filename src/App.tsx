import { useState } from 'react'
import { Backdrop } from './components/layout/Backdrop'
import { Header, type Page } from './components/layout/Header'
import { captureInviteCode, clearInviteCode, readInviteCode } from './lib/invite'
import { BankPage } from './pages/BankPage'
import { BisPage } from './pages/BisPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { HomePage } from './pages/HomePage'
import { ObjectivesPage } from './pages/ObjectivesPage'
import { PartyPage } from './pages/PartyPage'
import { PlannerPage } from './pages/PlannerPage'
import { ProgressPage } from './pages/ProgressPage'
import { PatchNotesPage } from './pages/PatchNotesPage'
import { RosterPage } from './pages/RosterPage'
import { LoginPage } from './pages/LoginPage'
import { WelcomePage } from './pages/WelcomePage'
import { useSession } from './state/useSession'
import { useWarRoom, type WarRoom as WarRoomData } from './state/useWarRoom'

// If someone arrived from an invite link, remember the code before anything else happens.
captureInviteCode()

export default function App() {
  const { session, loading } = useSession()

  // Wait until we know whether someone is logged in, so the login screen doesn't flash.
  if (loading) return null
  if (!session) return <LoginPage />
  return <WarRoom email={session.user.email ?? ''} userId={session.user.id} />
}

function WarRoom({ email, userId }: { email: string; userId: string }) {
  const [page, setPage] = useState<Page>('home')
  const warRoom = useWarRoom(userId)

  // New here: pick a name, then join or start a crew.
  if (!warRoom.loading && !warRoom.error && (!warRoom.me || warRoom.parties.length === 0)) {
    return <WelcomePage warRoom={warRoom} />
  }

  return (
    <div className="relative isolate min-h-screen">
      <Backdrop />
      <Header
        page={page}
        onNavigate={setPage}
        email={email}
        live={warRoom.live}
        partyName={warRoom.party?.name ?? ''}
        parties={warRoom.parties}
        partyId={warRoom.party?.id ?? null}
        onSwitchParty={warRoom.switchParty}
      />
      {/* key: switching crew starts each page fresh (filters, picked toons...). */}
      <main key={warRoom.party?.id ?? 'none'} className="mx-auto max-w-7xl px-5 py-8">
        {warRoom.error && (
          <p role="alert" className="mb-6 rounded-md border border-blood bg-leather px-4 py-3 text-error">
            {warRoom.error}
          </p>
        )}
        {!warRoom.loading && <PendingInvite warRoom={warRoom} onJoined={() => setPage('party')} />}
        {warRoom.loading && <p className="text-ash">Unrolling the maps…</p>}
        {!warRoom.loading && page === 'home' && <HomePage warRoom={warRoom} onNavigate={setPage} />}
        {!warRoom.loading && page === 'roster' && <RosterPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'progress' && <ProgressPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'bank' && <BankPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'planner' && <PlannerPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'bis' && <BisPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'objectives' && <ObjectivesPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'party' && <PartyPage warRoom={warRoom} />}
        {page === 'changelog' && <ChangelogPage />}
        {!warRoom.loading && page === 'notes' && <PatchNotesPage warRoom={warRoom} />}
      </main>
    </div>
  )
}

// Already in a crew and opened someone's invite link: ask before joining.
function PendingInvite({ warRoom, onJoined }: { warRoom: WarRoomData; onJoined: () => void }) {
  const [code, setCode] = useState(readInviteCode)
  const [error, setError] = useState('')
  if (!code) return null
  const dismiss = () => {
    clearInviteCode()
    setCode('')
  }
  return (
    <div className="panel mb-6 flex flex-wrap items-center gap-3 p-4">
      <p className="flex-1">
        You've been invited to a crew (code <span className="font-stat text-lg tracking-widest text-gold">{code}</span>). Join it? You'll stay in
        your current one too.
      </p>
      <button
        type="button"
        className="rounded bg-blood px-3 py-1.5 text-sm font-semibold hover:bg-blood-light"
        onClick={async () => {
          const problem = await warRoom.joinParty(code)
          if (problem) return setError(problem)
          dismiss()
          onJoined()
        }}
      >
        Join
      </button>
      <button type="button" className="text-sm text-ash underline hover:text-parchment" onClick={dismiss}>
        No thanks
      </button>
      {error && <p className="w-full text-error">{error}</p>}
    </div>
  )
}

import { useState } from 'react'
import { Header, type Page } from './components/layout/Header'
import { BankPage } from './pages/BankPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { ObjectivesPage } from './pages/ObjectivesPage'
import { PatchNotesPage } from './pages/PatchNotesPage'
import { RosterPage } from './pages/RosterPage'
import { TonightPage } from './pages/TonightPage'
import { LoginPage } from './pages/LoginPage'
import { useSession } from './state/useSession'
import { useWarRoom } from './state/useWarRoom'

export default function App() {
  const { session, loading } = useSession()

  // Wait until we know whether someone is logged in, so the login screen doesn't flash.
  if (loading) return null
  if (!session) return <LoginPage />
  return <WarRoom email={session.user.email ?? ''} userId={session.user.id} />
}

function WarRoom({ email, userId }: { email: string; userId: string }) {
  const [page, setPage] = useState<Page>('tonight')
  const warRoom = useWarRoom(userId)

  return (
    <div className="min-h-screen">
      <Header page={page} onNavigate={setPage} email={email} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        {warRoom.error && (
          <p role="alert" className="mb-6 rounded-md border border-blood bg-leather px-4 py-3 text-blood-light">
            {warRoom.error}
          </p>
        )}
        {warRoom.loading && <p className="text-ash">Unrolling the maps…</p>}
        {!warRoom.loading && page === 'tonight' && <TonightPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'roster' && <RosterPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'bank' && <BankPage warRoom={warRoom} />}
        {!warRoom.loading && page === 'objectives' && <ObjectivesPage warRoom={warRoom} />}
        {page === 'changelog' && <ChangelogPage />}
        {!warRoom.loading && page === 'notes' && <PatchNotesPage warRoom={warRoom} />}
      </main>
    </div>
  )
}

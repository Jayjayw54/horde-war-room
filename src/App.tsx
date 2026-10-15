import { useState } from 'react'
import { Header, type Page } from './components/layout/Header'
import { ObjectivesPage } from './pages/ObjectivesPage'
import { RosterPage } from './pages/RosterPage'
import { TonightPage } from './pages/TonightPage'
import { useWarRoom } from './state/useWarRoom'

export default function App() {
  const [page, setPage] = useState<Page>('tonight')
  const warRoom = useWarRoom()

  return (
    <div className="min-h-screen">
      <Header page={page} onNavigate={setPage} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        {page === 'tonight' && <TonightPage warRoom={warRoom} />}
        {page === 'roster' && <RosterPage warRoom={warRoom} />}
        {page === 'objectives' && <ObjectivesPage warRoom={warRoom} />}
      </main>
    </div>
  )
}

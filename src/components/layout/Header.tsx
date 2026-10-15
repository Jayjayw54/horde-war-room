export type Page = 'tonight' | 'roster' | 'objectives'

const tabs: { id: Page; label: string }[] = [
  { id: 'tonight', label: "Tonight's orders" },
  { id: 'roster', label: 'Roster' },
  { id: 'objectives', label: 'Objectives' },
]

interface Props {
  page: Page
  onNavigate: (page: Page) => void
}

export function Header({ page, onNavigate }: Props) {
  return (
    <header className="border-b-4 border-blood bg-leather">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="pb-4">
          <h1 className="font-display text-4xl font-extrabold tracking-wide text-gold sm:text-5xl">
            Horde War Room
          </h1>
          <p className="mt-1 text-ash">Two mates. One Horde. Everything still to do.</p>
        </div>
        <nav aria-label="Main" className="flex gap-1">
          {tabs.map((tab) => {
            const active = tab.id === page
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-t-md px-4 py-2 font-display text-sm font-semibold transition-colors ${
                  active ? 'bg-blood text-parchment' : 'text-ash hover:bg-leather-light hover:text-parchment'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

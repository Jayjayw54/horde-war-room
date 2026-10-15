import { CharacterCard } from '../components/roster/CharacterCard'
import type { WarRoom } from '../state/useWarRoom'

export function RosterPage({ warRoom }: { warRoom: WarRoom }) {
  const ownerName = (id: string) => warRoom.players.find((p) => p.id === id)?.displayName ?? 'Unknown'
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold">Roster</h2>
      <p className="mt-1 text-ash">Every character you both play, mains and alts.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {warRoom.characters.map((c) => (
          <CharacterCard key={c.id} character={c} owner={ownerName(c.playerId)} />
        ))}
      </div>
    </section>
  )
}

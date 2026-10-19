// "Import from game": pick the addon's SavedVariables file, check what's in it, then save it.
import { useState, type ChangeEvent } from 'react'
import { readSavedVariables, type CharacterSnapshot, type GameAction } from '../../lib/savedVariables'
import { downloadGameData } from '../../lib/download'
import type { WarRoom } from '../../state/useWarRoom'

export function ImportPanel({ warRoom, onClose }: { warRoom: WarRoom; onClose: () => void }) {
  const [snapshots, setSnapshots] = useState<CharacterSnapshot[] | null>(null)
  const [actions, setActions] = useState<GameAction[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setDone(false)
    try {
      const { snapshots: found, actions: ticked } = readSavedVariables(await file.text())
      if (found.length === 0) setError('No characters found in that file. Log in to a character and type /reload first.')
      setSnapshots(found)
      setActions(ticked)
    } catch (e) {
      setSnapshots(null)
      setError(`Couldn't read that file: ${(e as Error).message}. Make sure it's HordeWarRoom.lua from WTF\\…\\SavedVariables.`)
    }
  }

  async function handleImport() {
    if (!snapshots) return
    setBusy(true)
    const problem = await warRoom.importSnapshots(snapshots, actions)
    setBusy(false)
    if (problem) setError(problem)
    else setDone(true)
  }

  // Toons always belong to whoever is logged in, so only compare against your own.
  const mine = warRoom.characters.filter((c) => c.playerId === warRoom.me?.id)
  const isNew = (name: string) => !mine.some((c) => c.name.toLowerCase() === name.toLowerCase())

  return (
    <div className="panel p-5">
      <h3 className="font-display text-lg font-semibold text-gold">Import from game</h3>
      <p className="mt-1 text-sm text-ash">
        Pick <code className="text-parchment">HordeWarRoom.lua</code> from your WoW folder:{' '}
        <code className="text-parchment">WTF\Account\&lt;account&gt;\SavedVariables\</code>. Type /reload in game first so
        it's up to date.
      </p>
      <input type="file" accept=".lua" onChange={handleFile} className="mt-3 block text-sm file:mr-3 file:rounded file:border-0 file:bg-blood file:px-3 file:py-1.5 file:font-semibold file:text-parchment hover:file:bg-blood-light" />

      {snapshots && snapshots.length > 0 && !done && (
        <div className="mt-4">
          <ul className="space-y-1 text-sm">
            {snapshots.map((s) => (
              <li key={s.name}>
                <span className={isNew(s.name) ? 'text-gold' : 'text-parchment'}>{isNew(s.name) ? 'New: ' : 'Update: '}</span>
                <strong>{s.name}</strong>, level {s.level} {s.race} {s.className}
                {s.gold !== null && <span className="text-ash"> · {Math.floor(s.gold / 10000)}g</span>}
                {s.bags && <span className="text-ash"> · {s.bags.length} items in bags</span>}
                {s.bank && <span className="text-ash"> · {s.bank.length} in bank</span>}
                {s.professions.length > 0 && (
                  <span className="text-ash"> · {s.professions.map((p) => `${p.name} ${p.skill}/${p.max}`).join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
          {actions.length > 0 && (
            <p className="mt-3 text-sm text-ash">
              Plus {actions.length} {actions.length === 1 ? 'order' : 'orders'} ticked off in game.
            </p>
          )}
          <p className="mt-3 text-sm text-ash">They'll be saved as your toons and shown to everyone in your war parties.</p>
          <button
            type="button"
            onClick={handleImport}
            disabled={busy}
            className="mt-3 rounded bg-blood px-4 py-2 font-semibold hover:bg-blood-light disabled:opacity-40"
          >
            {busy ? 'Importing…' : `Import ${snapshots.length} ${snapshots.length === 1 ? 'toon' : 'toons'}`}
          </button>
        </div>
      )}

      {done && (
        <div className="mt-4">
          <p className="text-gold">Imported. The roster below is up to date.</p>
          <p className="mt-2 text-sm text-ash">
            For the in-game window (/hwr): download the in-game data and put it in your addon folder,{' '}
            <code className="text-parchment">Interface\AddOns\HordeWarRoom\</code>, then /reload.
          </p>
          <button
            type="button"
            onClick={() => downloadGameData(warRoom.gameDataFile())}
            className="mt-2 rounded bg-ink px-3 py-1.5 text-sm font-semibold text-parchment hover:text-gold"
          >
            Download in-game data
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-blood-light">{error}</p>}
      <button type="button" onClick={onClose} className="mt-4 block text-sm text-ash underline hover:text-parchment">
        Close
      </button>
    </div>
  )
}

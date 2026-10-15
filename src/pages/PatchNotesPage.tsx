// Beta notes: class changes from Blizzard's "WoW Forever Beta Development Notes", newest first.
import { useEffect, useState } from 'react'
import { classColors } from '../lib/labels'
import { CLASSES, fetchPatchUpdates, type Note, type PatchUpdate } from '../lib/patchNotes'
import type { WarRoom } from '../state/useWarRoom'

const SEEN_KEY = 'hwr-patch-notes-seen'

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0
  } catch {
    return 0
  }
}

function NoteList({ notes }: { notes: Note[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1 marker:text-ash">
      {notes.map((n, i) => (
        <li key={i}>
          {n.text}
          {n.children.length > 0 && <NoteList notes={n.children} />}
        </li>
      ))}
    </ul>
  )
}

export function PatchNotesPage({ warRoom }: { warRoom: WarRoom }) {
  const [updates, setUpdates] = useState<PatchUpdate[] | null>(null)
  const [error, setError] = useState('')
  const [seenBefore] = useState(readSeen)

  // Default filter: the classes you two actually play.
  const played = CLASSES.filter((c) => warRoom.characters.some((ch) => ch.className === c))
  const [selected, setSelected] = useState<string[]>(played.length ? played : CLASSES)

  useEffect(() => {
    fetchPatchUpdates()
      .then((list) => {
        setUpdates(list)
        // Remember the newest update you've seen, so next visit can flag anything newer.
        try {
          if (list[0]) localStorage.setItem(SEEN_KEY, String(list[0].date.getTime()))
        } catch {
          /* private browsing: just skip the "new" badges */
        }
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  const toggle = (c: string) => setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold">Beta notes</h2>
      <p className="mt-1 text-ash">
        Class changes from Blizzard's WoW: Forever beta development notes, newest first.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Classes to show">
        {CLASSES.map((c) => {
          const on = selected.includes(c)
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                on ? 'bg-leather-light' : 'border-leather-light text-ash hover:text-parchment'
              }`}
              style={on ? { borderColor: classColors[c], color: classColors[c] } : undefined}
            >
              {c}
              {played.includes(c) && <span className="ml-1 text-xs opacity-70">●</span>}
            </button>
          )
        })}
        <button type="button" onClick={() => setSelected(CLASSES)} className="px-2 text-sm text-ash underline hover:text-parchment">
          All
        </button>
        {played.length > 0 && (
          <button type="button" onClick={() => setSelected(played)} className="px-2 text-sm text-ash underline hover:text-parchment">
            Ours only
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-ash">● = a class one of you plays</p>

      {error && <p className="mt-6 text-blood-light">{error}</p>}
      {!updates && !error && <p className="mt-6 text-ash">Reading the dispatches…</p>}

      <div className="mt-6 space-y-6">
        {updates?.map((u) => {
          const shown = CLASSES.filter((c) => selected.includes(c) && u.classes[c]?.length)
          const isNew = seenBefore > 0 && u.date.getTime() > seenBefore
          return (
            <article key={u.id} className="panel p-5">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-parchment">
                  {u.date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                  {isNew && <span className="ml-2 rounded bg-blood px-2 py-0.5 align-middle text-xs text-parchment">New</span>}
                </h3>
                <a href={u.url} target="_blank" rel="noreferrer" className="text-sm text-gold underline hover:text-parchment">
                  Full notes on the Blizzard forums
                </a>
              </header>
              {shown.length === 0 ? (
                <p className="mt-3 text-sm text-ash">No changes to the selected classes in this update.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {shown.map((c) => (
                    <div key={c}>
                      <h4 className="font-display font-semibold" style={{ color: classColors[c] }}>
                        {c}
                      </h4>
                      <div className="mt-1 text-sm leading-relaxed">
                        <NoteList notes={u.classes[c]} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

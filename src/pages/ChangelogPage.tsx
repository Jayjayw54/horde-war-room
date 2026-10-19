// "What's new": The Bloodbound's own patch notes.
import { changelog } from '../data/changelog'

export function ChangelogPage() {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-gold sm:text-3xl">What's new</h2>
      <p className="mt-1 text-ash">Patch notes for The Bloodbound itself.</p>
      <div className="mt-6 space-y-4">
        {changelog.map((r) => (
          <article key={r.version} className="panel p-5">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-semibold text-parchment">
                <span className="text-gold">v{r.version}</span> {r.title}
              </h3>
              <time dateTime={r.date} className="text-sm text-ash">
                {new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </header>
            <ul className="mt-3 ml-5 list-disc space-y-1 marker:text-error">
              {r.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

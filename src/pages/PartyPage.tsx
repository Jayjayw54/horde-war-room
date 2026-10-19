// War party: who's in it, the invite code, Discord, and switching / joining / starting / leaving parties.
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { inviteLink } from '../lib/invite'
import type { WarRoom } from '../state/useWarRoom'

const input = 'rounded bg-ink px-3 py-1.5 text-parchment placeholder:text-ash/70'
const button = 'rounded bg-blood px-3 py-1.5 text-sm font-semibold hover:bg-blood-light disabled:opacity-40'
const quiet = 'text-sm text-ash underline hover:text-parchment'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h3 className="font-display text-lg font-semibold text-gold">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function PartyPage({ warRoom }: { warRoom: WarRoom }) {
  const { party, me, myRole, players } = warRoom
  const leader = myRole === 'leader'
  const [message, setMessage] = useState('')

  // Shows the result of any action: an error, or a short "done" note.
  async function act(action: () => Promise<string | null>, done = '') {
    const problem = await action()
    setMessage(problem ?? done)
  }

  if (!party || !me) return null

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gold">War party</h2>
      <p className="mt-1 text-ash">Everyone in a war party shares one war room: toons, bank, objectives and the activity feed.</p>
      {message && <p className="mt-3 text-gold">{message}</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title={party.name}>
          {leader && <RenameParty warRoom={warRoom} onDone={setMessage} />}
          <ul className="mt-2 divide-y divide-leather-light">
            {party.members.map((m) => {
              const player = players.find((p) => p.id === m.playerId)
              const toons = warRoom.characters.filter((c) => c.playerId === m.playerId).length
              return (
                <li key={m.playerId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="font-display font-semibold">{player?.displayName ?? m.playerId}</span>
                  {m.role === 'leader' && <span className="rounded bg-gold/15 px-1.5 text-xs text-gold">Leader</span>}
                  {m.playerId === me.id && <span className="text-xs text-ash">(you)</span>}
                  <span className="text-sm text-ash">
                    {toons} {toons === 1 ? 'toon' : 'toons'}
                  </span>
                  {leader && m.playerId !== me.id && (
                    <span className="ml-auto flex gap-3">
                      <button
                        type="button"
                        className={quiet}
                        onClick={() => act(() => warRoom.makeLeader(m.playerId), `${player?.displayName} leads the party now.`)}
                      >
                        Make leader
                      </button>
                      <button
                        type="button"
                        className={quiet}
                        onClick={() => {
                          if (window.confirm(`Remove ${player?.displayName} from ${party.name}?`)) {
                            act(() => warRoom.removeMember(m.playerId), `${player?.displayName} was removed.`)
                          }
                        }}
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className={`mt-4 ${quiet}`}
            onClick={() => {
              const last = party.members.length === 1
              const warning = last
                ? `You're the last one in ${party.name}. Leaving deletes the party and its objectives (your toons stay yours). Leave?`
                : `Leave ${party.name}? You can rejoin with the invite code.`
              if (window.confirm(warning)) act(() => warRoom.leaveParty(party.id))
            }}
          >
            Leave this war party
          </button>
        </Card>

        <Card title="Invite people">
          <p className="text-sm text-ash">
            Send this link (or just the code). New people sign up, pick a name, and land straight in the party.
          </p>
          <p className="mt-3 font-mono text-3xl tracking-[0.3em] text-parchment">{party.inviteCode}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CopyButton text={inviteLink(party.inviteCode)} label="Copy invite link" />
            {leader && (
              <button
                type="button"
                className={quiet}
                onClick={() => {
                  if (window.confirm('Make a new code? The old code and link stop working.')) {
                    act(() => warRoom.resetInviteCode(), 'New invite code made.')
                  }
                }}
              >
                New code
              </button>
            )}
          </div>
        </Card>

        {leader && <DiscordSettings warRoom={warRoom} />}

        <Card title="Your war parties">
          {warRoom.parties.length > 1 && (
            <ul className="mb-4 space-y-1">
              {warRoom.parties.map((p) => (
                <li key={p.id}>
                  {p.id === party.id ? (
                    <span className="text-gold">▸ {p.name} (showing now)</span>
                  ) : (
                    <button type="button" className={quiet} onClick={() => warRoom.switchParty(p.id)}>
                      Switch to {p.name}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <JoinOrStart warRoom={warRoom} onDone={setMessage} />
        </Card>

        <Card title="You">
          <RenameMe warRoom={warRoom} onDone={setMessage} />
        </Card>
      </div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={button}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          window.prompt('Copy this:', text)
        }
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

function RenameParty({ warRoom, onDone }: { warRoom: WarRoom; onDone: (m: string) => void }) {
  const [name, setName] = useState(warRoom.party?.name ?? '')
  async function save(e: FormEvent) {
    e.preventDefault()
    onDone((await warRoom.renameParty(name)) ?? 'Party renamed.')
  }
  return (
    <form onSubmit={save} className="flex gap-2">
      <label htmlFor="party-rename" className="sr-only">
        Party name
      </label>
      <input id="party-rename" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={`${input} min-w-0 flex-1`} />
      <button type="submit" className={button} disabled={!name.trim() || name.trim() === warRoom.party?.name}>
        Rename
      </button>
    </form>
  )
}

function RenameMe({ warRoom, onDone }: { warRoom: WarRoom; onDone: (m: string) => void }) {
  const [name, setName] = useState(warRoom.me?.displayName ?? '')
  async function save(e: FormEvent) {
    e.preventDefault()
    onDone((await warRoom.setDisplayName(name)) ?? 'Name saved.')
  }
  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label htmlFor="my-name" className="text-sm text-ash">
        Your name
      </label>
      <input id="my-name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className={`${input} min-w-0 flex-1`} />
      <button type="submit" className={button} disabled={!name.trim() || name.trim() === warRoom.me?.displayName}>
        Save
      </button>
    </form>
  )
}

function JoinOrStart({ warRoom, onDone }: { warRoom: WarRoom; onDone: (m: string) => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  return (
    <div className="space-y-3">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const problem = await warRoom.joinParty(code)
          onDone(problem ?? 'Joined. You can switch parties here any time.')
          if (!problem) setCode('')
        }}
        className="flex gap-2"
      >
        <label htmlFor="join-code" className="sr-only">
          Invite code
        </label>
        <input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Invite code"
          className={`${input} min-w-0 flex-1 font-mono uppercase`}
        />
        <button type="submit" className={button} disabled={!code.trim()}>
          Join another
        </button>
      </form>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const problem = await warRoom.createParty(name)
          onDone(problem ?? 'New war party started. Share its invite code.')
          if (!problem) setName('')
        }}
        className="flex gap-2"
      >
        <label htmlFor="new-party" className="sr-only">
          New party name
        </label>
        <input
          id="new-party"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="New party name"
          className={`${input} min-w-0 flex-1`}
        />
        <button type="submit" className={button} disabled={!name.trim()}>
          Start new
        </button>
      </form>
    </div>
  )
}

function DiscordSettings({ warRoom }: { warRoom: WarRoom }) {
  const [webhook, setWebhook] = useState('')
  const [guildId, setGuildId] = useState('')
  const [status, setStatus] = useState('')
  const partyId = warRoom.party?.id

  useEffect(() => {
    let cancelled = false
    warRoom.getDiscordSettings().then((s) => {
      if (cancelled || !s) return
      setWebhook(s.webhookUrl)
      setGuildId(s.guildId)
    })
    return () => {
      cancelled = true
    }
    // Reload the settings when you switch parties.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (webhook.trim() && !/^https:\/\/(\w+\.)?discord(app)?\.com\/api\/webhooks\//.test(webhook.trim())) {
      setStatus("That doesn't look like a Discord webhook link.")
      return
    }
    setStatus((await warRoom.saveDiscordSettings(webhook, guildId)) ?? 'Saved.')
  }

  return (
    <Card title="Discord (leader only)">
      <form onSubmit={save} className="space-y-3 text-sm">
        <label className="block">
          <span className="text-ash">
            Webhook link, for import summaries in your channel. In Discord: channel settings › Integrations › Webhooks ›
            New Webhook › Copy Webhook URL.
          </span>
          <input
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
            className={`${input} mt-1 w-full`}
          />
        </label>
        <label className="block">
          <span className="text-ash">
            Server ID, so /whohas, /toon, /tonight and /gold answer for this party. Turn on Developer Mode (User Settings ›
            Advanced), then right-click your server icon › Copy Server ID.
          </span>
          <input
            value={guildId}
            onChange={(e) => setGuildId(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 112233445566778899"
            className={`${input} mt-1 w-full font-mono`}
          />
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className={button}>
            Save
          </button>
          {status && <span className="text-gold">{status}</span>}
        </div>
      </form>
    </Card>
  )
}

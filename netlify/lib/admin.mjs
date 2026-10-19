// Shared by the website's server functions (Netlify Functions). Not a function itself.
//
// These talk to the database with the server's all-access key (SUPABASE_SERVICE_ROLE_KEY), which
// skips the usual "only see your party" rules. So every query here must narrow itself down to the
// right player or party by hand. Never send that key to a browser.

const url = () => process.env.VITE_SUPABASE_URL

function adminHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in Netlify')
  const headers = { apikey: key, ...extra }
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}` // older-style keys need this too
  return headers
}

// Read rows, e.g. db('characters?select=name&player_id=eq.josh').
export async function db(path) {
  const res = await fetch(`${url()}/rest/v1/${path}`, { headers: adminHeaders() })
  if (!res.ok) throw new Error(`database said ${res.status}`)
  return res.json()
}

// Builds a PostgREST "is one of" filter: in.("a","b").
export const oneOf = (values) => `in.(${values.map((v) => `"${String(v).replace(/"/g, '')}"`).join(',')})`

// Who is this logged-in website user? Checks their login token with Supabase. Returns the player id or null.
export async function playerFromToken(token) {
  if (!token) return null
  const res = await fetch(`${url()}/auth/v1/user`, {
    headers: { apikey: process.env.VITE_SUPABASE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const user = await res.json()
  const rows = await db(`players?select=id&user_id=eq.${encodeURIComponent(user.id)}`)
  return rows[0]?.id ?? null
}

// The crews a player is in, and everyone in them.
export async function partiesOf(playerId) {
  const mine = await db(`party_members?select=party_id&player_id=eq.${encodeURIComponent(playerId)}`)
  const partyIds = mine.map((m) => m.party_id)
  if (partyIds.length === 0) return { partyIds, memberIds: [playerId] }
  const all = await db(`party_members?select=player_id&party_id=${oneOf(partyIds)}`)
  return { partyIds, memberIds: [...new Set([playerId, ...all.map((m) => m.player_id)])] }
}

// Posts an import summary to the Discord channel of every crew the player is in (that has one set).
export async function postToPartyDiscords(playerId, title, lines) {
  const { partyIds } = await partiesOf(playerId)
  if (partyIds.length === 0) return 0
  const secrets = await db(`party_secrets?select=discord_webhook_url&party_id=${oneOf(partyIds)}`)
  const hooks = secrets.map((s) => s.discord_webhook_url).filter((u) => /^https:\/\/(\w+\.)?discord(app)?\.com\/api\/webhooks\//.test(u ?? ''))
  const description = lines.map(String).join('\n').slice(0, 3900) || 'No changes since the last import.'
  let sent = 0
  for (const hook of hooks) {
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'The Bloodbound',
        embeds: [{ title: String(title).slice(0, 250), description, color: 0x9b2318 }],
      }),
    }).catch(() => null)
    if (res?.ok) sent++
  }
  return sent
}

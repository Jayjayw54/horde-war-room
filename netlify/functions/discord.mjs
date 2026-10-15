// Netlify Function: posts an import summary to your Discord channel.
// The Discord webhook address is a secret (anyone with it can post in your channel), so it lives in
// Netlify's environment variables (DISCORD_WEBHOOK_URL), never in the website code.
// Only logged-in War Room players can trigger it: we check their login token with Supabase first.

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) return Response.json({ skipped: 'DISCORD_WEBHOOK_URL is not set in Netlify' })

  // Who is asking? Check the login token with Supabase.
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  const userRes = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.VITE_SUPABASE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return Response.json({ error: 'not logged in' }, { status: 401 })

  const { title, lines } = await req.json().catch(() => ({}))
  if (typeof title !== 'string' || !Array.isArray(lines)) return Response.json({ error: 'bad request' }, { status: 400 })

  const description = lines.map(String).join('\n').slice(0, 3900) || 'No changes since the last import.'
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Horde War Room',
      embeds: [{ title: title.slice(0, 250), description, color: 0x9b2318 }],
    }),
  })
  return Response.json({ sent: res.ok }, { status: res.ok ? 200 : 502 })
}

export const config = { path: '/api/discord' }

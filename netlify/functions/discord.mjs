// Netlify Function: posts an import summary to your war party's Discord channel.
// Each party leader pastes their channel's webhook on the War party page. Webhooks are secrets
// (anyone with one can post in that channel), so only the server reads them, never the website code.
// Only logged-in players can trigger it: we check their login token with Supabase first.
import { playerFromToken, postToPartyDiscords } from '../lib/admin.mjs'

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  // Who is asking? Check the login token with Supabase.
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  let playerId
  try {
    playerId = await playerFromToken(token)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
  if (!playerId) return Response.json({ error: 'not logged in' }, { status: 401 })

  const { title, lines } = await req.json().catch(() => ({}))
  if (typeof title !== 'string' || !Array.isArray(lines)) return Response.json({ error: 'bad request' }, { status: 400 })

  const sent = await postToPartyDiscords(playerId, title, lines)
  return Response.json({ sent })
}

export const config = { path: '/api/discord' }

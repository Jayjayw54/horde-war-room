// Netlify Function: the Horde War Room Discord bot. Discord sends each slash command here
// (/whohas, /toon, /tonight, /gold), we look up the answer in the database and reply.
//
// Netlify environment variables it needs:
//   DISCORD_PUBLIC_KEY         from the Discord Developer Portal (General Information > Public Key)
//   SUPABASE_SERVICE_ROLE_KEY  Supabase secret key (Project Settings > API Keys). SECRET: server-side only.
//   VITE_SUPABASE_URL          already set for the website

import { createPublicKey, verify as nodeVerify } from 'node:crypto'

const hexToBytes = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map((b) => parseInt(b, 16)))

// Discord signs every request; we must check the signature or Discord refuses to use the bot.
async function verify(req, body) {
  const signature = req.headers.get('x-signature-ed25519')
  const timestamp = req.headers.get('x-signature-timestamp')
  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!signature || !timestamp || !publicKey) return false
  const message = Buffer.from(timestamp + body)
  try {
    // Node's own crypto: wrap the raw 32-byte key in the standard Ed25519 key format.
    const der = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(publicKey.trim(), 'hex')])
    const key = createPublicKey({ key: der, format: 'der', type: 'spki' })
    return nodeVerify(null, message, key, Buffer.from(signature, 'hex'))
  } catch {
    try {
      const key = await crypto.subtle.importKey('raw', hexToBytes(publicKey.trim()), { name: 'Ed25519' }, false, ['verify'])
      return await crypto.subtle.verify('Ed25519', key, hexToBytes(signature), message)
    } catch {
      return false
    }
  }
}

// Read from the database with the server's secret key (the bot isn't a logged-in player).
async function db(path) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const headers = { apikey: key }
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}` // older-style keys need this too
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!res.ok) throw new Error(`database said ${res.status}`)
  return res.json()
}

const gold = (copper) => {
  const g = Math.floor(copper / 10000)
  const s = Math.floor(copper / 100) % 100
  const c = copper % 100
  return `${g ? `${g.toLocaleString()}g ` : ''}${g || s ? `${s}s ` : ''}${c}c`
}
const option = (interaction, name) => interaction.data.options?.find((o) => o.name === name)?.value ?? ''
const like = (text) => encodeURIComponent(`*${text.replace(/[*,()]/g, '')}*`)

async function whohas(interaction) {
  const search = String(option(interaction, 'item')).trim()
  const rows = await db(`items?select=name,quantity,location,characters(name)&name=ilike.${like(search)}&order=name&limit=200`)
  if (rows.length === 0) return `Nobody has anything matching **${search}**.`
  const byItem = new Map()
  for (const r of rows) {
    const entry = byItem.get(r.name) ?? { total: 0, holders: [] }
    entry.total += r.quantity
    entry.holders.push(`${r.characters?.name ?? '?'} ${r.quantity} (${r.location})`)
    byItem.set(r.name, entry)
  }
  return [...byItem.entries()]
    .slice(0, 10)
    .map(([name, e]) => `**${name}** ×${e.total}: ${e.holders.join(', ')}`)
    .join('\n')
}

async function toon(interaction) {
  const search = String(option(interaction, 'name')).trim()
  const rows = await db(
    `characters?select=name,level,race,class,gold,xp,xp_max,rested_xp,players(display_name),professions(name,skill_level,max_skill)&name=ilike.${like(search)}&limit=3`,
  )
  if (rows.length === 0) return `No toon called **${search}** on the roster.`
  return rows
    .map((c) => {
      const xp = c.level < 60 && c.xp_max ? ` · ${Math.round((c.xp / c.xp_max) * 100)}% to ${c.level + 1}` : ''
      const rested = c.rested_xp && c.xp_max ? ` · ${Math.round((c.rested_xp / c.xp_max) * 100)}% rested` : ''
      const profs = (c.professions ?? []).map((p) => `${p.name} ${p.skill_level}/${p.max_skill}`).join(', ')
      return `**${c.name}** (${c.players?.display_name ?? '?'}): level ${c.level} ${c.race} ${c.class}${xp}${rested}\n💰 ${gold(c.gold ?? 0)}${profs ? `\n⚒️ ${profs}` : ''}`
    })
    .join('\n\n')
}

async function tonight() {
  const rows = await db(`objectives?select=title,assignee&tonight=eq.true&status=neq.done&order=created_at`)
  if (rows.length === 0) return 'No orders for tonight. Free roam!'
  const names = Object.fromEntries((await db('players?select=id,display_name')).map((p) => [p.id, p.display_name]))
  return `**Tonight's orders**\n${rows.map((o) => `• ${o.title} (${o.assignee === 'both' ? 'both' : (names[o.assignee] ?? o.assignee)})`).join('\n')}`
}

async function goldTotals() {
  const [chars, players] = await Promise.all([db('characters?select=gold,player_id'), db('players?select=id,display_name')])
  const lines = players.map((p) => {
    const total = chars.filter((c) => c.player_id === p.id).reduce((s, c) => s + (c.gold ?? 0), 0)
    return `**${p.display_name}**: ${gold(total)}`
  })
  const all = chars.reduce((s, c) => s + (c.gold ?? 0), 0)
  return `${lines.join('\n')}\n**War chest**: ${gold(all)}`
}

const COMMANDS = { whohas, toon, tonight, gold: goldTotals }

export default async (req) => {
  // Open /api/discord-bot in a browser to check the bot's setup (shows only whether keys are set, never the keys).
  if (req.method === 'GET') {
    return Response.json({
      bot: 'Horde War Room',
      publicKeySet: !!process.env.DISCORD_PUBLIC_KEY,
      publicKeyLooksRight: /^[0-9a-f]{64}$/.test((process.env.DISCORD_PUBLIC_KEY ?? '').trim()),
      databaseKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      databaseUrlSet: !!process.env.VITE_SUPABASE_URL,
    })
  }
  const body = await req.text()
  if (!(await verify(req, body))) return new Response('bad signature', { status: 401 })
  const interaction = JSON.parse(body)

  if (interaction.type === 1) return Response.json({ type: 1 }) // Discord checking we're alive

  if (interaction.type === 2) {
    const handler = COMMANDS[interaction.data.name]
    let content
    try {
      content = handler ? await handler(interaction) : 'Unknown command.'
    } catch (e) {
      content = `Couldn't reach the War Room: ${e.message}`
    }
    return Response.json({ type: 4, data: { content: content.slice(0, 1990), allowed_mentions: { parse: [] } } })
  }
  return new Response('unhandled', { status: 400 })
}

export const config = { path: '/api/discord-bot' }

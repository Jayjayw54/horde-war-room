// One-off: tells Discord which slash commands The Bloodbound bot has.
// Run from the project folder (needs DISCORD_APP_ID and DISCORD_BOT_TOKEN in .env.local):
//   node --env-file=.env.local scripts/register-discord-commands.mjs
const appId = process.env.DISCORD_APP_ID
const token = process.env.DISCORD_BOT_TOKEN
if (!appId || !token) {
  console.error('Add DISCORD_APP_ID and DISCORD_BOT_TOKEN to .env.local first.')
  process.exit(1)
}

const STRING = 3
const commands = [
  {
    name: 'whohas',
    description: 'Who has an item in their bags or bank?',
    options: [{ type: STRING, name: 'item', description: 'Item name, or part of it (e.g. copper)', required: true }],
  },
  {
    name: 'toon',
    description: "A toon's level, XP, gold and professions",
    options: [{ type: STRING, name: 'name', description: 'Toon name, or part of it', required: true }],
  },
  { name: 'tonight', description: "Tonight's orders" },
  { name: 'gold', description: 'Gold per player and the war chest' },
]

const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
  method: 'PUT',
  headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(commands),
})
console.log(res.ok ? `Registered ${commands.length} commands: /${commands.map((c) => c.name).join(', /')}` : `Failed: ${res.status} ${await res.text()}`)

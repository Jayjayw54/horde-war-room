# Horde War Room

A shared dashboard for war parties playing World of Warcraft: Forever. Started by Josh and his mate Cel;
now anyone can sign up, start a war party (a duo, a guild...) or join one with an invite code.
It tracks characters, professions, the shared bank and objectives, on the website and in game (/hwr).

## Who you're working with

Josh is new to coding. For every change:
- Explain what you're doing and why, in plain language, before doing it.
- Keep changes small and working. One feature at a time.
- Ask before installing new packages or tools.
- After each working step, suggest a git commit with a clear message.
- When a user-facing feature ships, add an entry at the top of `src/data/changelog.ts` (the in-app "What's new" page).
- Josh is here to learn, but prefers Claude to do the work: build the whole step, then explain in plain language what it does and why.

## Stack

- Vite + React + TypeScript
- Tailwind CSS for styling
- Supabase (free tier) for database and login, added in Milestone 3, not before
- GitHub for source control
- Hosting later on a free static host (Vercel or Netlify)

## Look and feel

Dark "war room" theme: near-black background, Horde red accents, parchment or gold highlights.
It should feel like a WoW command table, not a corporate dashboard. Readable on desktop first, okay on mobile.

## Data model (v1)

- **players**: id, display_name (linked to a Supabase auth user from Milestone 3)
- **characters**: id, player_id, name, race, class, level, notes, gold (copper), xp, xp_max, rested_xp, last_played, bank_seen_at
- **professions**: id, character_id, name, skill_level, max_skill
- **items**: id, character_id, location ("bags" | "bank"), item_id, name, quantity, quality — the shared bank
- **character_history**: one row per toon per import (level, xp, gold) — Progress graphs
- **recipes**: id, character_id, profession, recipe_id, name, item_id, makes, reagents (jsonb) — Planner
- **bis_items**: id, character_id, slot, item_name, item_id, note — BiS wishlist
- **events**: id, created_at, character_id, kind, text — activity feed (written by the importer)
- items also has ilvl, min_level, equip_loc, item_type, sub_type (gear upgrade finder)
- characters also has stats, gear, weapon_skills (jsonb)

Database changes after the first setup are in numbered files in `supabase/` (e.g. `002-gold-xp-bank.sql`); `schema.sql` always has the full current setup.
- **objectives**: id, party_id, title, description, assignee (a player id, or "everyone"), category ("profession" | "farming" | "dungeon" | "gear" | "gold" | "other"), status ("todo" | "doing" | "done"), tonight (boolean, shows in "Tonight's orders"), created_at, updated_at
- **parties**: id, name, invite_code (6 letters/digits, no 0/O/1/I)
- **party_members**: party_id, player_id, role ("leader" | "member"), joined_at. A player can be in several parties.
- **party_secrets**: party_id, discord_webhook_url, discord_guild_id (leader only)
- **sync_keys**: id, player_id, key_hash (sha256 of the key; the key itself is never stored), label, last_used_at
- players are made by `ensure_player()` when someone picks their name after signing up. Character names are unique per player.

Who can do what (row-level security, see `supabase/009-war-parties.sql`):
- You see everything belonging to people who share a war party with you, and nothing else.
- You can only change your own toons (and their professions, items, recipes, history, BiS lists).
- Anyone in a party can add, edit and tick off that party's objectives.
- Leaders can rename the party, remove members, hand over leadership, reset the invite code and set Discord.
- Joining, leaving and the leader actions go through database functions (`create_party`, `join_party`, `leave_party`...).

## Milestones

Status: Milestones 1–4 are done. Live at https://euphonious-fox-f272a5.netlify.app (Netlify, auto-deploys on every push to main). Josh and Cel are both linked to their players. The addon (addon/HordeWarRoom) and the Roster "Import from game" button are built and tested against the Forever beta. The planner, progress, BiS, Discord bot and war table are live.

Milestone 5 (war parties + the War Room in game) is built on the `dev` branch but NOT live yet. `UPDATE-GUIDE.md` has the go-live steps. Not yet tested for real: the launcher (needs Windows), the /hwr window (needs the game), and /api/sync (needs Netlify + Supabase).

1. **Local prototype.** Scaffold the app. Use mock data from a local TypeScript file. Build three views:
   - Roster: character cards showing level, class, and profession progress bars
   - Objectives: list with filters by assignee, category, and status; add, edit, and tick off
   - Tonight's orders: objectives flagged `tonight`, grouped by assignee
   Changes can live in React state for now. Runs with `npm run dev`.
2. **GitHub.** Push to the repo. Add a README explaining how to run it.
3. **Supabase.** Create tables matching the data model, row-level security allowing only the two players, email + password login (switched from magic links: Supabase's free email limit was too low), and replace the mock data with live queries. Keep keys in `.env.local` and never commit them.
4. **Deploy.** Host it so Josh's mate can log in from his own PC.
5. **War parties and the War Room in game.** Sign-up, parties with invite codes, party-only data, per-party Discord; addon v0.7.0 with the /hwr window; sync keys, `/api/sync`, and the optional launcher.

## How data moves between the game and the website

- Game → website: the addon writes `HordeWarRoomDB` to SavedVariables on /reload or logout (toons, plus `actions`: orders ticked off in the /hwr window). It reaches the website by the Roster's "Import from game" upload, or the launcher POSTing it to `/api/sync`.
- Website → game: `src/lib/gameData.ts` builds `WarRoomData.lua` (`HordeWarRoomData = {...}`), which lives in the addon's own folder and is read at login or /reload. The launcher GETs it from `/api/sync`; without the launcher, "Download in-game data" gives the same file.
- A tick-off from the game is only applied if the objective hasn't been changed on the website since (objectives.updated_at). The addon forgets a tick-off once it has data made after it.

## Later (do not build yet, but don't design against it)

- Publishing the addon on CurseForge / Wago for guilds.
- A shared quest log, a dungeon planner, profession cooldowns, a weekly Discord recap, auction house prices.

## Netlify

- Functions in `netlify/functions/`: `patch-notes` (Blizzard beta notes), `item-icon` (Wowhead icons), `discord` (import summaries to each of the player's parties' webhooks), `discord-bot` (slash commands, answered for the party linked to that Discord server; register with `node --env-file=.env.local scripts/register-discord-commands.mjs`), `sync` (`/api/sync`, for the launcher; authenticated with a sync key).
- `netlify/lib/admin.mjs` holds shared server helpers. They use the service role key, which skips row-level security, so every query there must filter by player or party by hand.
- Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_KEY, DISCORD_PUBLIC_KEY, SUPABASE_SERVICE_ROLE_KEY (secret: used by sync, discord and discord-bot). DISCORD_WEBHOOK_URL is no longer used (webhooks are per party now).
- Import logic lives in `src/lib/importer.ts` (writes characters, items, recipes, history and the events feed; `applyActions` handles tick-offs from the game). It only ever reads or writes the uploader's own toons, so it is safe to run with the service role key.
- `npm run build` first runs `scripts/package-downloads.mjs`, which zips the addon and the launcher into `public/downloads/` (not committed). The website links to them on the War party page.

## WoW: Forever facts (found by testing in the beta, Oct 2026)

- Interface version (for the addon .toc): 16001.
- No realms. Characters have a first name and surname. `UnitName("player")` returns (firstName, surname); `GetUnitName("player", true)` returns "First Surname". The full name is the unique key we match on.
- Professions use the modern API: `GetProfessions()` returns slot indexes (some nil), `GetProfessionInfo(slot)` returns name, icon, skill, max. `GetNumSkillLines` does not exist.
- Horde races: Orc, Undead, Tauren, Troll, Skyborne. Level cap 60.
- SavedVariables file: `WTF\Account\<account>\SavedVariables\HordeWarRoom.lua`. Example in `addon/example-SavedVariables.lua`.
- Addon files: `HordeWarRoom.toc`, `WarRoomData.lua` (data from the website; ships empty), `HordeWarRoom.lua` (recording, slash commands), `UI.lua` (the /hwr window). Files share a table through `local _, ns = ...`.
- Write addon Lua for Lua 5.1 (no goto, no //). Stick to plain characters in UI text: WoW's font may not draw symbols like … • ›.
- The addon's UI can be tested outside the game with a pretend WoW API (texlua works as a Lua interpreter).

Addons cannot make network calls. Data only leaves the game when SavedVariables is written on logout or `/reload`.
So keep character and profession data importable from an external snapshot, keyed by character name.

## Project structure

```
src/
  main.tsx              App entry point
  App.tsx               Page switching
  index.css             Tailwind import and design tokens (colours, fonts)
  types.ts              Data shapes, matching the planned Supabase tables
  data/changelog.ts     The in-app "What's new" page
  state/useWarRoom.ts   All state and actions. Loads everything you can see, then narrows it to the party on screen
  lib/labels.ts         Display labels and WoW class colours
  lib/rows.ts           Database rows to app shapes, and paged fetching (shared with the server)
  lib/importer.ts       Saves the addon's file to the database (shared with the server)
  lib/savedVariables.ts Reads the addon's file
  lib/gameData.ts       Writes WarRoomData.lua for the in-game window
  lib/invite.ts         Invite links (?join=CODE)
  components/layout/    Header and navigation
  components/roster/    Character cards and profession bars
  components/objectives/ Objective list items, add form, filters
  pages/                War table, Roster, Progress, Bank, Planner, BiS, Objectives, War party, Welcome, Login
netlify/functions/      Server functions (see Netlify above)
addon/HordeWarRoom/     The WoW addon
launcher/               The optional Windows launcher (PowerShell 5.1, nothing to install)
supabase/               schema.sql (full setup) and numbered updates
```

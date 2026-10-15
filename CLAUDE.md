# Horde War Room

A private shared dashboard for two players (Josh and his mate Cel) playing World of Warcraft: Forever.
It tracks characters, professions, and shared objectives in one place.

## Who you're working with

Josh is new to coding. For every change:
- Explain what you're doing and why, in plain language, before doing it.
- Keep changes small and working. One feature at a time.
- Ask before installing new packages or tools.
- After each working step, suggest a git commit with a clear message.
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
- **items**: id, character_id, location ("bags" | "bank"), item_id, name, quantity — the shared bank

Database changes after the first setup are in numbered files in `supabase/` (e.g. `002-gold-xp-bank.sql`); `schema.sql` always has the full current setup.
- **objectives**: id, title, description, assignee ("josh" | "cel" | "both"), category ("profession" | "farming" | "dungeon" | "gear" | "gold" | "other"), status ("todo" | "doing" | "done"), tonight (boolean, shows in "Tonight's orders"), created_at

Both players can see and edit everything. It is one shared war room, not two separate accounts.

## Milestones

Status: Milestones 1–4 are done. Live at https://euphonious-fox-f272a5.netlify.app (Netlify, auto-deploys on every push to main). Josh and Cel are both linked to their players. The addon (addon/HordeWarRoom) and the Roster "Import from game" button are built and tested against the Forever beta. Next: the companion sync app or the profession planner.

1. **Local prototype.** Scaffold the app. Use mock data from a local TypeScript file. Build three views:
   - Roster: character cards showing level, class, and profession progress bars
   - Objectives: list with filters by assignee, category, and status; add, edit, and tick off
   - Tonight's orders: objectives flagged `tonight`, grouped by assignee
   Changes can live in React state for now. Runs with `npm run dev`.
2. **GitHub.** Push to the repo. Add a README explaining how to run it.
3. **Supabase.** Create tables matching the data model, row-level security allowing only the two players, email + password login (switched from magic links: Supabase's free email limit was too low), and replace the mock data with live queries. Keep keys in `.env.local` and never commit them.
4. **Deploy.** Host it so Josh's mate can log in from his own PC.

## Later (do not build yet, but don't design against it)

- A WoW: Forever addon that snapshots characters, professions, and known recipes into SavedVariables.
- A manual import: upload the SavedVariables file on the dashboard and update characters and professions from it.
- A companion app on each PC that watches the SavedVariables file and syncs it to Supabase automatically.
- A profession planner that calculates materials and decides who gathers and who crafts.

## WoW: Forever facts (found by testing in the beta, Oct 2026)

- Interface version (for the addon .toc): 16001.
- No realms. Characters have a first name and surname. `UnitName("player")` returns (firstName, surname); `GetUnitName("player", true)` returns "First Surname". The full name is the unique key we match on.
- Professions use the modern API: `GetProfessions()` returns slot indexes (some nil), `GetProfessionInfo(slot)` returns name, icon, skill, max. `GetNumSkillLines` does not exist.
- Horde races: Orc, Undead, Tauren, Troll, Skyborne. Level cap 60.
- SavedVariables file: `WTF\Account\<account>\SavedVariables\HordeWarRoom.lua`. Example in `addon/example-SavedVariables.lua`.

Addons cannot make network calls. Data only leaves the game when SavedVariables is written on logout or `/reload`.
So keep character and profession data importable from an external snapshot, keyed by character name.

## Project structure

```
src/
  main.tsx              App entry point
  App.tsx               Page switching
  index.css             Tailwind import and design tokens (colours, fonts)
  types.ts              Data shapes, matching the planned Supabase tables
  data/mockData.ts      Placeholder characters and objectives (Milestone 1 only)
  state/useWarRoom.ts   All state and actions; swap to Supabase here in Milestone 3
  lib/labels.ts         Display labels and WoW class colours
  components/layout/    Header and navigation
  components/roster/    Character cards and profession bars
  components/objectives/ Objective list items, add form, filters
  pages/                Tonight's orders, Roster, Objectives
```

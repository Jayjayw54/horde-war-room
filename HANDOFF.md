# Handoff brief: start of the next chat

Written 20 Oct 2026. Paste or point the new chat at this file, along with `CLAUDE.md`.

## Name

The name is **The Bloodbound**, and it's settled. It's already used across the website, addon v0.9.0,
`/bloodbound`, README and CLAUDE.md. No further rename is planned.

## Where things are (from CLAUDE.md)

- **Live**: https://euphonious-fox-f272a5.netlify.app, auto-deploys on push to `main`.
- **Milestones 1–5 done.** Crews (formerly war parties) went live on 19 Oct 2026, with database update 009 run.
  The renames came after that: Horde War Room → Warcall → The Bloodbound.
- **Words people see**: crew (not war party), Orders (not objectives), Stronghold (home), Chronicle (activity).
- **Internal names deliberately kept**: `useWarRoom`, the parties tables, the `hwr_` sync-key prefix,
  `hwr-` browser storage keys, the repo and the Netlify site name.
- **Addon**: `addon/Bloodbound/`, v0.9.0, saves to `BloodboundDB`. Commands are `/bloodbound` and `/bbound`;
  the old `/warcall`, `/wcall` and `/hwr` still work. The website imports old `HordeWarRoom.lua` and
  `Warcall.lua` files too.
- **Discord**: paused (`DISCORD_ENABLED = false` on the Crew page, `PAUSED` in the bot).
- **Look**: obsidian and iron backgrounds, blood crimson #76282E, antique gold #C39A53, parchment highlights.
  Fonts are Cinzel, Barlow Condensed and Source Sans 3. No emoji as icons.

## Tested for real (20 Oct 2026)

- **Launcher**: setup, sync key and folder detection (`_classic_beta_`) all worked. Syncs on /reload,
  ticks from the game reach the website, and it closes itself with "Victory!" when WoW closes.
- **In-game window** (`/bloodbound`): the Orders, Who has, Needs and Crew tabs all work, and ticks show
  "syncs on /reload" until they're sent.
- `launcher\Play Bloodbound.cmd` now always stays open on errors and says to extract the zip first.
  This change isn't pushed yet.

## Spotted while testing

- **Duplicate orders**: "Get 1 Empty Vial", "Get 7 Bronze Bar" and "Get 4 Weak Flux" each show twice.
  Work out whether they were added twice by hand or something is creating copies.
- The window title reads "The Bloodbound · Horde War Room". The second half is the crew's name, which can be
  renamed on the Crew page.
- **Live site title**: at 10:47 the live site's page title still said "Horde War Room". Check that the
  latest Netlify deploy succeeded.

## Things to tidy

- Stray files at the project root: `HordeWarRoom.lua` and `HordeWarRoom.lua.bak`, plus the old addon zips
  in `addon/` (v0.5.0, v0.6.0). Check what they are, then remove or move them.
- `UPDATE-GUIDE.md` is still the war-parties go-live guide, which is done now. Archive it or replace it.
- `CLAUDE.md` "Look and feel" still says "Horde red accents". It should describe the Bloodbound palette.
- `CLAUDE.md` "Stack" still says Supabase and hosting come "later". Both are long done.
- Supabase **Confirm email** setting: sort it out before strangers sign up (see the old update guide's email note).

## Before opening it to the guild

- Check that the final name is free on CurseForge and Wago, and whether a matching domain is available.
- Write a short "why Windows warns about the launcher" note, since it's an unsigned script and SmartScreen will flag it.
- Money: Blizzard's addon policy has generally required addons to be free. Anything paid would have to be on the
  website side. Check the current policy before planning that.

## Later (from CLAUDE.md, don't build yet)

CurseForge/Wago publishing, shared quest log, dungeon planner, profession cooldowns, weekly Discord recap,
auction house prices.

## How Josh works

New to coding and wants to learn. Prefers Claude to build the whole step, then explain in plain language what
it does and why. Suggest a git commit after each working step, and add a `src/data/changelog.ts` entry
for user-facing changes.

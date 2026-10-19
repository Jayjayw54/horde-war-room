# Warcall

A shared dashboard for war parties in World of Warcraft: Forever: characters, professions, the shared bank and
objectives in one place, on the website and in game (`/warcall`). Formerly Horde War Room. Anyone can sign up, then start a war party or
join one with an invite code.

## Run it

You need Node.js (LTS) installed.

1. Copy `.env.example` to `.env.local` and fill in the Supabase Project URL and publishable key
   (Supabase > Connect, or Project Settings > API Keys). Never commit `.env.local`.
2. Then:

```
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173).

## Where things are

See the "Project structure" section in `CLAUDE.md`. The plan and milestones live there too.

## Live site

https://euphonious-fox-f272a5.netlify.app. Netlify rebuilds it automatically on every push to `main`.
The Supabase keys are set in Netlify under Project configuration > Environment variables.

## Database

`supabase/schema.sql` creates the tables and security rules for a brand-new project. Paste it into
Supabase > SQL Editor and run it (it wipes existing tables first, so only do this on purpose).

People let themselves in: they sign up on the website, pick a name, then start a war party or join one with
its invite code (War party page). Nothing to do in Supabase.

## The addon and the launcher

- `addon/Warcall/`: the WoW addon. `/warcall` opens the Warcall window in game.
- `launcher/`: the optional Windows launcher that syncs while you play (see `launcher/README.txt`).
- `npm run package` zips both into `public/downloads/` (the build does this too); the website links to them.

## Updating the live site

See `UPDATE-GUIDE.md` for taking the war parties update live.

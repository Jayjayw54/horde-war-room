# Horde War Room

A shared dashboard for two Horde players in World of Warcraft: Forever: characters, professions, and objectives in one place.

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

`supabase/schema.sql` creates the tables, security rules and starter data. Paste it into
Supabase > SQL Editor and run it (it wipes existing tables first, so only do this on purpose).

To let a player in: they create an account on the login page, then link them in the SQL Editor:

```sql
update players
set user_id = (select id from auth.users where email = 'their-email@example.com')
where id = 'cel';
```

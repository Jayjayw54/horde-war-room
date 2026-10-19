# Going live: war parties and the War Room in game

Everything below is built and saved on the `dev` branch. None of it is live yet. Allow about 45 minutes,
and pick a time when Cel isn't mid-session: between steps 4 and 6, the old live site can't add new objectives.

## What's in this update

- **War parties.** Anyone can sign up, pick a name, and start a war party or join one with an invite code
  or link. Each party sees only its own toons, bank and orders. You and Cel become the first party,
  called "Horde War Room", with you as leader. Everything you already have is kept.
- **Only your own toons are yours to change.** Everyone in the party can still see them, and anyone can
  tick off objectives.
- **Discord per party.** The leader pastes the channel webhook and the Discord server ID on the War party page.
- **Addon v0.7.0.** `/hwr` opens the War Room window in game with four tabs: Orders (tick them off),
  Who has, Needs and Party. `/hwr status` shows the old check.
- **Sync keys and `/api/sync`.** The website can take the addon's file from the launcher and send back
  the in-game data.
- **The launcher (optional).** Start WoW with it and everything syncs both ways on every /reload or logout.
  It closes itself when WoW closes and installs nothing.
- **No launcher?** After an import, "Download in-game data" gives you the file for the addon by hand.

## Not tested for real yet

I tested these as far as I could from the cloud, but they still need a first real try:

| Piece | Tested so far | Still needs |
| --- | --- | --- |
| Database update (`009-war-parties.sql`) | Run twice on a copy of your setup; security rules checked as you, Cel, a new player and a logged-out visitor | Running on the real Supabase |
| Website | Type check passes | Clicking through it (step 4) |
| `/hwr` window | Every tab run against a pretend WoW | Seeing it in the actual game |
| Launcher | Read through carefully, but Windows PowerShell wasn't available here | First run on your PC |
| `/api/sync` | Each piece tested on its own | A real sync through Netlify |

Expect a small fix or two. Paste any error to Claude and it'll sort it out.

---

## 1. Back up

Open the live site, then **Export backup** (top right). Keep the file somewhere safe.

## 2. Check one Netlify setting

Netlify, then **Project configuration › Environment variables**. Make sure `SUPABASE_SERVICE_ROLE_KEY` is there.
It already should be, because the Discord bot uses it. The new sync function and the Discord summaries now use it too.

## 3. Put the new version on a preview link

In VS Code's terminal, in the project folder, first check it builds on your PC (Claude couldn't run these two here):

```
npm run build
npm run lint
```

`build` should finish with "built in …" and also says "Packed 4 addon files and 3 launcher files". If either
shows red errors, paste them to Claude. Then:

```
git push origin dev
```

Netlify builds a preview of `dev`. On Netlify's **Deploys** page, open the newest `dev` deploy for its link.
It usually looks like `https://dev--euphonious-fox-f272a5.netlify.app`.

## 4. Update the database

Supabase, then **SQL Editor › New query**. Paste all of `supabase/009-war-parties.sql` and click **Run**.
You should see "Success. No rows returned". It's safe to run again if it gets interrupted.

From here until step 6, the old live site can't add new objectives. Viewing still works.

## 5. Test on the preview link

Log in on the preview link and check:

- [ ] You land on the War table. The banner says "Horde War Room" under the title, and your toons are there.
- [ ] **War party** tab: you're Leader, Cel's a member, and there's a 6-letter invite code.
- [ ] **Objectives**: the "Who" list shows Josh, Cel and Both. Add one for Cel and tick it off.
- [ ] **Discord** (War party page, leader only):
  - Paste your channel's webhook link. It's the same one Netlify has as `DISCORD_WEBHOOK_URL`, or make a new one in Discord.
  - Paste your Discord server ID: turn on Developer Mode, then right-click the server icon › Copy Server ID.
  - Save, then do an **Import from game** on the Roster. A message should appear in Discord.
  - Try `/whohas copper` in Discord.
- [ ] **Sync key**: War party › In game › Make a sync key. Copy it.
- [ ] **Addon**: download `HordeWarRoom.zip` from the War party page.
  - Unzip it into your game's `Interface\AddOns` folder, replacing the old one.
  - In game, `/hwr` opens the window. It's empty until the next bullet.
- [ ] **Launcher**: download `WarRoomLauncher.zip`, unzip it (e.g. into Documents), and double-click **Play War Room.cmd**.
  - Paste your sync key.
  - When it asks for the website, **paste the preview link** for now.
  - Confirm your WoW: Forever folder.
  - Start the game. `/hwr` should now show your party.
  - Tick an order, then `/reload`. The launcher should say "Synced", and the order shows ticked on the website.
- [ ] **Invites**: open the invite link in a private browser window and sign up with a different email.
  - Pick a name, and you should land in the party.
  - Check the stranger can see your toons but can't star them.
  - Then remove them from the party (War party page).

If Supabase sends a "confirm your email" message on sign-up, see the Supabase email note at the bottom.

## 6. Go live

```
git checkout main
git merge dev
git push
```

Netlify publishes it to the main link in a minute or two.
Then run **Play War Room.cmd -Setup** once and press Enter at the website question, so the launcher points at the main site.

## 7. Tidy up and tell Cel

- Once Discord messages arrive through the party webhook, you can delete `DISCORD_WEBHOOK_URL` from Netlify. Nothing uses it any more.
- Cel needs the new addon zip (War party page).
- The launcher is optional for Cel. Without it, he imports on the Roster like now, and can click "Download in-game data" for /hwr.

---

## Opening it to the guild

- Send the invite link from the War party page. People sign up, pick a name, and land in the party.
- Or start a separate war party for the guild (War party › Start new). You'll then have two parties and can switch at the top right.
- For the guild's own Discord server:
  - Invite the bot. Discord Developer Portal › your app › Installation › copy the install link.
  - The guild's party leader pastes that server's ID on their War party page.
  - One bot serves every party, and each server only ever sees its own party's data.

### Supabase email note (matters once strangers sign up)

Supabase's free plan only sends a handful of emails an hour. If **Confirm email** is on, new sign-ups get
stuck waiting for a confirmation email. Either:
- turn it off: Supabase › Authentication › Sign In / Providers › Email › Confirm email (menu names may differ slightly), or
- connect your own email sender (Authentication › SMTP Settings).

For a guild, turning it off is the easy option. The trade-off is that anyone can sign up with an email they don't own.
They still can't see anything without an invite code.

## If something goes wrong

- **The website misbehaves after step 6.** Netlify › Deploys, pick the previous deploy, then **Publish deploy**.
  That rolls the site back in seconds. The database keeps the new setup, though, so the old site still can't add objectives.
  Fixing forward is usually quicker: paste the error to Claude.
- **The database step errors.** Nothing is half-done unless the error is near the end. Paste the message to Claude.
  Your backup from step 1 has everything.
- **The launcher window flashes and closes.** Open a Command Prompt in the launcher folder and run
  `"Play War Room.cmd"` to see the message.

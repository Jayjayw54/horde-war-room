THE BLOODBOUND LAUNCHER
=======================

Keeps The Bloodbound website and the in-game /bloodbound window in sync while you play.

SETUP (once)
1. Install The Bloodbound addon (Crew page on the website).
2. On the website, open Crew and click "Make a sync key". Copy it.
3. Unzip this folder anywhere, e.g. your Documents.
4. Double-click "Play Bloodbound.cmd". Paste your key when asked, and confirm your
   WoW: Forever folder.

EVERY TIME YOU PLAY
- Double-click "Play Bloodbound.cmd", then start WoW: Forever the usual way.
- Each /reload or logout syncs. Type /bloodbound in game for the crew window.
- When you close WoW, the launcher does a last sync and closes itself.

WHAT IT DOES AND DOESN'T DO
- Reads one file: WTF\Account\<you>\SavedVariables\Bloodbound.lua
- Writes one file: Interface\AddOns\Bloodbound\BloodboundData.lua
- Talks only to The Bloodbound website.
- Never touches the game itself, installs nothing, and doesn't run when its window is closed.
- Your settings are in %APPDATA%\Bloodbound\launcher.json. The sync key in there is
  encrypted so only your Windows account can read it.

It's a plain text script: right-click BloodboundLauncher.ps1 > Open with > Notepad to read it.

Change settings:  open a Command Prompt in this folder and run  "Play Bloodbound.cmd" -Setup
Sync once only:   "Play Bloodbound.cmd" -Once
Lost your key?    Delete it on the website and make a new one, then run with -Setup.

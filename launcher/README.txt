WARCALL LAUNCHER
================

Keeps the Warcall website and the in-game /warcall window in sync while you play.

SETUP (once)
1. Install the Warcall addon (War party page on the website).
2. On the website, open War party and click "Make a sync key". Copy it.
3. Unzip this folder anywhere, e.g. your Documents.
4. Double-click "Play Warcall.cmd". Paste your key when asked, and confirm your
   WoW: Forever folder.

EVERY TIME YOU PLAY
- Double-click "Play Warcall.cmd", then start WoW: Forever the usual way.
- Each /reload or logout syncs. Type /warcall in game for the Warcall window.
- When you close WoW, the launcher does a last sync and closes itself.

WHAT IT DOES AND DOESN'T DO
- Reads one file: WTF\Account\<you>\SavedVariables\Warcall.lua
- Writes one file: Interface\AddOns\Warcall\WarcallData.lua
- Talks only to the Warcall website.
- Never touches the game itself, installs nothing, and doesn't run when its window is closed.
- Your settings are in %APPDATA%\Warcall\launcher.json. The sync key in there is
  encrypted so only your Windows account can read it.

It's a plain text script: right-click WarcallLauncher.ps1 > Open with > Notepad to read it.

Change settings:  open a Command Prompt in this folder and run  "Play Warcall.cmd" -Setup
Sync once only:   "Play Warcall.cmd" -Once
Lost your key?    Delete it on the website and make a new one, then run with -Setup.

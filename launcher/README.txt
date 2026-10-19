HORDE WAR ROOM LAUNCHER
=======================

Keeps the War Room website and the in-game /hwr window in sync while you play.

SETUP (once)
1. Install the Horde War Room addon (War party page on the website).
2. On the website, open War party and click "Make a sync key". Copy it.
3. Unzip this folder anywhere, e.g. your Documents.
4. Double-click "Play War Room.cmd". Paste your key when asked, and confirm your
   WoW: Forever folder.

EVERY TIME YOU PLAY
- Double-click "Play War Room.cmd", then start WoW: Forever the usual way.
- Each /reload or logout syncs. Type /hwr in game for the War Room window.
- When you close WoW, the launcher does a last sync and closes itself.

WHAT IT DOES AND DOESN'T DO
- Reads one file: WTF\Account\<you>\SavedVariables\HordeWarRoom.lua
- Writes one file: Interface\AddOns\HordeWarRoom\WarRoomData.lua
- Talks only to the War Room website.
- Never touches the game itself, installs nothing, and doesn't run when its window is closed.
- Your settings are in %APPDATA%\HordeWarRoom\launcher.json. The sync key in there is
  encrypted so only your Windows account can read it.

It's a plain text script: right-click WarRoomLauncher.ps1 > Open with > Notepad to read it.

Change settings:  open a Command Prompt in this folder and run  "Play War Room.cmd" -Setup
Sync once only:   "Play War Room.cmd" -Once
Lost your key?    Delete it on the website and make a new one, then run with -Setup.

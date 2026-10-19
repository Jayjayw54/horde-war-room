<#
  Warcall launcher.

  What it does, in order:
    1. Fetches your war party's latest data and puts it where the addon reads it
       (Interface\AddOns\Warcall\WarcallData.lua), so /warcall is fresh when you log in.
    2. Waits while you play. Every time the game saves the addon's file (on /reload or logout),
       it sends that file to the Warcall website and brings the party's newest data back.
    3. When you close WoW, it does one last sync and closes itself.

  What it does NOT do: it never touches the game itself, never runs in the background after you
  close it, never installs anything, and only talks to the Warcall website. It reads one file
  (the addon's SavedVariables) and writes one file (WarcallData.lua in the addon's folder).

  Your settings (website, game folder, and your sync key, encrypted so only your Windows account
  can read it) are saved in %APPDATA%\Warcall\launcher.json.

  Run it with "Play Warcall.cmd". Options:
    -Setup   ask the setup questions again
    -Once    sync once and close (no waiting)
#>
param(
  [switch]$Setup,
  [switch]$Once
)

$ErrorActionPreference = 'Stop'
# Older Windows defaults to an old security protocol the website won't accept.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$DefaultSite = 'https://euphonious-fox-f272a5.netlify.app'
$ConfigDir = Join-Path $env:APPDATA 'Warcall'
$ConfigFile = Join-Path $ConfigDir 'launcher.json'
$Utf8 = New-Object System.Text.UTF8Encoding $false  # UTF-8 without the invisible marker at the start

function Say($text, $color = 'Gray') { Write-Host $text -ForegroundColor $color }
function Stamp { (Get-Date).ToString('HH:mm') }

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

# Looks for WoW: Forever's folder: the one with both WTF and Interface inside.
function Find-GameFolders {
  $roots = @(
    "${env:ProgramFiles(x86)}\World of Warcraft",
    "$env:ProgramFiles\World of Warcraft",
    'C:\World of Warcraft', 'D:\World of Warcraft', 'E:\World of Warcraft',
    'D:\Games\World of Warcraft', 'C:\Games\World of Warcraft'
  ) | Where-Object { $_ -and (Test-Path $_) }
  $found = @()
  foreach ($root in $roots) {
    foreach ($dir in @(Get-Item $root) + @(Get-ChildItem $root -Directory -ErrorAction SilentlyContinue)) {
      if ((Test-Path (Join-Path $dir.FullName 'WTF')) -and (Test-Path (Join-Path $dir.FullName 'Interface'))) {
        $found += $dir.FullName
      }
    }
  }
  return $found | Select-Object -Unique
}

function Pick-Folder {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Pick your WoW: Forever folder (the one with WTF and Interface inside)'
  if ($dialog.ShowDialog() -eq 'OK') { return $dialog.SelectedPath }
  return $null
}

function Ask-GameFolder {
  $candidates = @(Find-GameFolders)
  # Prefer a folder where the addon has already saved something.
  $withAddon = @($candidates | Where-Object { Get-ChildItem (Join-Path $_ 'WTF\Account\*\SavedVariables\Warcall.lua') -ErrorAction SilentlyContinue })
  if ($withAddon.Count -eq 1) { $candidates = $withAddon }

  if ($candidates.Count -eq 1) {
    $answer = Read-Host "Is this your WoW: Forever folder?  $($candidates[0])  (Y/n)"
    if ($answer -notmatch '^[nN]') { return $candidates[0] }
  } elseif ($candidates.Count -gt 1) {
    Say 'Found these WoW folders:'
    for ($i = 0; $i -lt $candidates.Count; $i++) { Say "  $($i + 1). $($candidates[$i])" 'White' }
    $answer = Read-Host 'Which one is WoW: Forever? Type its number (or press Enter to browse)'
    if ($answer -match '^\d+$' -and [int]$answer -ge 1 -and [int]$answer -le $candidates.Count) { return $candidates[[int]$answer - 1] }
  }
  while ($true) {
    Say 'Pick your WoW: Forever folder in the window that just opened (the one with WTF and Interface inside).' 'Yellow'
    $picked = Pick-Folder
    if (-not $picked) { throw 'No folder picked.' }
    if (Test-Path (Join-Path $picked 'WTF')) { return $picked }
    Say "That folder has no WTF folder inside. Try again." 'Red'
  }
}

function Run-Setup {
  Say ''
  Say 'Warcall launcher setup' 'Yellow'
  Say 'You need a sync key: on the Warcall website, open War party, then "Make a sync key".'
  do {
    $key = (Read-Host 'Paste your sync key').Trim()
    if ($key -notmatch '^hwr_[0-9a-f]{64}$') { Say "That doesn't look like a sync key (it starts with hwr_). Try again." 'Red' }
  } until ($key -match '^hwr_[0-9a-f]{64}$')

  $site = Read-Host "Warcall website (press Enter for $DefaultSite)"
  if (-not $site) { $site = $DefaultSite }
  $site = $site.Trim().TrimEnd('/')

  $folder = Ask-GameFolder

  $config = [ordered]@{
    site       = $site
    gameFolder = $folder
    # Encrypted with your Windows login: copying this file to another PC or account won't reveal it.
    key        = (ConvertTo-SecureString $key -AsPlainText -Force | ConvertFrom-SecureString)
  }
  New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
  [IO.File]::WriteAllText($ConfigFile, ($config | ConvertTo-Json), $Utf8)
  Say "Saved. (Run 'Play Warcall.cmd' with -Setup to change these later.)" 'Green'
  return Load-Config
}

function Load-Config {
  if (-not (Test-Path $ConfigFile)) { return $null }
  $c = Get-Content $ConfigFile -Raw | ConvertFrom-Json
  $secure = ConvertTo-SecureString $c.key
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
  return [pscustomobject]@{ site = $c.site; gameFolder = $c.gameFolder; key = $plain }
}

# ---------------------------------------------------------------------------
# Talking to the website
# ---------------------------------------------------------------------------

# Sends a request and returns the answer as text, read as UTF-8 (so accented names come through right).
function Call-Warcall($config, $method, $bodyText) {
  $params = @{
    Uri             = "$($config.site)/api/sync"
    Method          = $method
    Headers         = @{ Authorization = "Bearer $($config.key)" }
    UseBasicParsing = $true
    TimeoutSec      = 60
  }
  if ($bodyText) {
    $params.Body = $Utf8.GetBytes($bodyText)
    $params.ContentType = 'text/plain; charset=utf-8'
  }
  try {
    $response = Invoke-WebRequest @params
    return [pscustomobject]@{
      text   = $Utf8.GetString($response.RawContentStream.ToArray())
      player = [Uri]::UnescapeDataString([string]$response.Headers['X-Warcall-Player'])
    }
  } catch [System.Net.WebException] {
    $text = ''
    if ($_.Exception.Response) {
      $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream(), $Utf8)
      $text = $reader.ReadToEnd()
    }
    $message = $_.Exception.Message
    try { $message = ($text | ConvertFrom-Json).error } catch { }
    throw "Warcall said: $message"
  } catch {
    throw "Couldn't reach Warcall: $($_.Exception.Message)"
  }
}

# Fetches the party's latest in-game data and writes it for the addon. Returns the player's name.
function Refresh-GameData($config) {
  $answer = Call-Warcall $config 'GET' $null
  Write-GameData $config $answer.text
  return $answer.player
}

function Addon-Folder($config) { Join-Path $config.gameFolder 'Interface\AddOns\Warcall' }

function Write-GameData($config, $lua) {
  $folder = Addon-Folder $config
  if (-not (Test-Path $folder)) {
    Say "  The addon isn't installed yet ($folder). Get it from the War party page on the website." 'Yellow'
    return
  }
  # Write to a temporary file first, then swap it in, so the game never sees half a file.
  $target = Join-Path $folder 'WarcallData.lua'
  $temp = "$target.tmp"
  [IO.File]::WriteAllText($temp, $lua, $Utf8)
  Move-Item -Force $temp $target
}

function Saved-Files($config) {
  @(Get-ChildItem (Join-Path $config.gameFolder 'WTF\Account\*\SavedVariables\Warcall.lua') -ErrorAction SilentlyContinue)
}

function Sync-File($config, $file) {
  # The game may still be writing it: wait until it stops changing.
  $size = -1
  for ($i = 0; $i -lt 10 -and $size -ne (Get-Item $file.FullName).Length; $i++) {
    $size = (Get-Item $file.FullName).Length
    Start-Sleep -Milliseconds 500
  }
  $text = [IO.File]::ReadAllText($file.FullName, $Utf8)
  $result = (Call-Warcall $config 'POST' $text).text | ConvertFrom-Json
  Refresh-GameData $config | Out-Null
  $line = "$(Stamp)  Synced $($result.imported) toon(s)."
  if ($result.ordersUpdated -gt 0) { $line += " $($result.ordersUpdated) order(s) ticked off." }
  Say $line 'Green'
  foreach ($s in @($result.summary)) { if ($s) { Say ('        ' + ($s -replace '\*\*', '')) 'Gray' } }
}

# Is WoW: Forever running? (Any program running from inside the game folder.)
function Game-Running($config) {
  $folder = [IO.Path]::GetFullPath($config.gameFolder).TrimEnd('\') + '\'
  foreach ($p in Get-Process -ErrorAction SilentlyContinue) {
    try { if ($p.Path -and $p.Path.StartsWith($folder, [StringComparison]::OrdinalIgnoreCase)) { return $true } } catch { }
  }
  return $false
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

$Host.UI.RawUI.WindowTitle = 'Warcall launcher'
Say 'Warcall launcher' 'Yellow'

$config = $null
if (-not $Setup) {
  try { $config = Load-Config } catch { Say "Couldn't read your saved settings ($($_.Exception.Message)). Let's set up again." 'Yellow' }
}
if (-not $config) { $config = Run-Setup }

try {
  Say "$(Stamp)  Fetching your war party's latest..."
  $player = Refresh-GameData $config
  $hello = if ($player) { "Ready, $player." } else { 'Ready.' }
  Say "$(Stamp)  $hello /warcall in game opens Warcall." 'Green'
} catch {
  Say "$(Stamp)  $($_.Exception.Message)" 'Red'
  if ($_.Exception.Message -match 'sync key') { Say '        Make a new key on the website, then run this with -Setup.' 'Yellow' }
}

# Remember when each saved file last changed, so we only send it when the game writes it again.
$seen = @{}
foreach ($f in Saved-Files $config) { $seen[$f.FullName] = $f.LastWriteTimeUtc }

if ($Once) {
  foreach ($f in Saved-Files $config) {
    try { Sync-File $config $f } catch { Say "$(Stamp)  $($_.Exception.Message)" 'Red' }
  }
  Say 'Done.'
  exit 0
}

if (-not (Game-Running $config)) { Say "$(Stamp)  Start WoW: Forever the usual way. I'll sync whenever you /reload or log out." 'White' }
Say '        Close this window (or press Ctrl+C) to stop.' 'DarkGray'

$wasRunning = $false
$stoppedAt = $null
while ($true) {
  Start-Sleep -Seconds 2

  foreach ($f in Saved-Files $config) {
    $last = $seen[$f.FullName]
    if ($null -eq $last -or $f.LastWriteTimeUtc -gt $last) {
      $seen[$f.FullName] = $f.LastWriteTimeUtc
      try { Sync-File $config $f } catch { Say "$(Stamp)  $($_.Exception.Message)" 'Red' }
    }
  }

  # When the game closes, give it a moment to save, catch that last save, then finish.
  if (Game-Running $config) {
    $wasRunning = $true
    $stoppedAt = $null
  } elseif ($wasRunning) {
    if (-not $stoppedAt) { $stoppedAt = Get-Date }
    elseif (((Get-Date) - $stoppedAt).TotalSeconds -ge 10) {
      Say "$(Stamp)  WoW closed. All synced. Victory!" 'Yellow'
      Start-Sleep -Seconds 3
      exit 0
    }
  }
}

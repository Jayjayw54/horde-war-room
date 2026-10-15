# Horde War Room: one-time PC setup.
# Installs Git, VS Code, Node.js LTS and Claude Code. Run in PowerShell.
# Each install may show a Windows prompt asking for permission.

winget install --id Git.Git -e --source winget
winget install --id Microsoft.VisualStudioCode -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget

# Claude Code (native installer)
irm https://claude.ai/install.ps1 | iex

Write-Host ""
Write-Host "Done. Close and reopen PowerShell so the new tools are found."

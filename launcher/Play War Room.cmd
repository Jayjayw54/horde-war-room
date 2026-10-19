@echo off
rem Starts the Horde War Room launcher. Double-click this before (or while) you play.
rem "-ExecutionPolicy Bypass" lets Windows run this one script without changing any settings.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0WarRoomLauncher.ps1" %*
if errorlevel 1 pause

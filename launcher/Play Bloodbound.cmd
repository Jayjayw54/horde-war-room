@echo off
rem Starts the Bloodbound launcher. Double-click this before (or while) you play.
rem "-ExecutionPolicy Bypass" lets Windows run this one script without changing any settings.
if not exist "%~dp0BloodboundLauncher.ps1" (
  echo Can't find BloodboundLauncher.ps1 next to this file.
  echo Unzip the whole launcher folder first: right-click the zip, Extract All, then run it from there.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0BloodboundLauncher.ps1" %*
if not "%errorlevel%"=="0" pause

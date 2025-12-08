@echo off
echo Starting Auto-Commit Watcher...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0auto-commit-simple.ps1"
pause


@echo off
title Future Ceylon - Local Server
cd /d "%~dp0"
echo ========================================================
echo   FUTURE CEYLON - Pop-Culture & Gossip Platform
echo ========================================================
echo Starting local web server on http://localhost:8000 ...
start "" "http://localhost:8000"
python -m http.server 8000
if %errorlevel% neq 0 (
  echo Python not found. Trying npx serve...
  npx -y serve . -l 8000
)
pause

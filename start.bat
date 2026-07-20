@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title BambooFlow
echo [BambooFlow] checking dependencies...
if not exist node_modules (
  echo [BambooFlow] node_modules missing, running npm install...
  call npm install
  if errorlevel 1 (
    echo [BambooFlow] npm install failed
    pause
    exit /b 1
  )
)
echo [BambooFlow] starting server...
echo Open http://localhost:3000
echo Press Ctrl+C to stop
node server.js
echo.
echo [BambooFlow] server stopped
pause
endlocal

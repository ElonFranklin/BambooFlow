@echo off
chcp 65001 >nul

cd /d "%~dp0"

:: 检查是否已启动
netstat -ano | findstr ":3000" | findstr LISTENING >nul
if %errorlevel% equ 0 (
    exit
)

:: 检查并启动
if not exist "node_modules" (
    call npm install >nul 2>&1
)

start /b node server.js > nul 2>&1

@echo off
chcp 65001 >nul
title BambooFlow - 局域网快传

cd /d "%~dp0"

echo.
echo ========================================
echo    BambooFlow 局域网快传
echo ========================================
echo.

set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  set PID=%%a
  goto :found
)

:found
if defined PID (
  echo 服务已在运行中，PID: %PID%
  start http://localhost:3000
  echo.
  echo 按任意键停止该服务并退出...
  pause >nul
  taskkill /PID %PID% /F >nul 2>&1
  echo 已停止。
  exit /b
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo 未检测到 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo 正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo 安装依赖失败。
    pause
    exit /b 1
  )
)

echo 启动服务...
start "BambooFlowServer" /B node server.js > server.log 2>&1

timeout /t 2 /nobreak >nul
set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  set PID=%%a
  goto :ready
)

:ready
if not defined PID (
  echo 启动失败，请检查 server.log
  pause
  exit /b 1
)

echo 启动成功，PID: %PID%
echo 电脑访问: http://localhost:3000
start http://localhost:3000
echo.
echo 按任意键停止该服务并退出...
pause >nul
taskkill /PID %PID% /F >nul 2>&1
echo 已停止。

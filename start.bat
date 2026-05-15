@echo off
chcp 65001 >nul
title BambooFlow 启动

cd /d "%~dp0"

set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  set PID=%%a
  goto :already
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo 未检测到 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo 安装依赖中...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败。
    pause
    exit /b 1
  )
)

start "BambooFlowServer" /B node server.js > server.log 2>&1
timeout /t 2 /nobreak >nul

set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  set PID=%%a
  goto :ok
)

echo 启动失败，请查看 server.log
pause
exit /b 1

:already
echo 服务已运行，PID: %PID%
start http://localhost:3000
pause
exit /b

:ok
echo 启动成功，PID: %PID%
start http://localhost:3000
pause

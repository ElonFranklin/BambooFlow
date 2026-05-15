@echo off
chcp 65001 >nul
title 停止 BambooFlow

set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  set PID=%%a
  goto :kill
)

echo 未找到 3000 端口对应的运行进程。
pause
exit /b

:kill
echo 正在停止 PID %PID% ...
taskkill /PID %PID% /F >nul 2>&1
if %errorlevel% equ 0 (
  echo 停止成功。
) else (
  echo 停止失败，请检查权限。
)
pause

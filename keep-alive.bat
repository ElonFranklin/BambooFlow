@echo off
chcp 65001 >nul
title BambooFlow 守护进程

cd /d "%~dp0"

echo 启动 BambooFlow 守护进程...
echo 按 Ctrl+C 停止

:restart
echo [%time%] 检查服务状态...
netstat -ano | findstr ":3000 .*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [%time%] 服务未运行，正在启动...
    start "BambooFlow" /MIN cmd /c "cd /d "%~dp0" && node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo [%time%] 服务运行中
)

timeout /t 10 /nobreak >nul
goto restart

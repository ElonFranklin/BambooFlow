@echo off
chcp 65001 >nul
title BambooFlow - 设置开机自启

echo.
echo ========================================
echo    BambooFlow 开机自启设置
echo ========================================
echo.

set "source=%~dp0BambooFlow.bat"
set "dest=%appdata%\Microsoft\Windows\Start Menu\Programs\Startup\BambooFlow.bat"

echo 当前BambooFlow路径:
echo %source%
echo.

:: 检查是否已经在启动项
if exist "%dest%" (
    echo [状态] 已设置开机自启
    echo.
    set /p choice="是否取消开机自启? (Y/N): "
    if /i "%choice%"=="Y" (
        del /f "%dest%" 2>nul
        echo 已取消开机自启!
    ) else (
        echo 操作取消
    )
    pause
    exit /b
)

:: 添加到启动项
echo 正在添加到开机自启...
copy /y "%source%" "%dest%" >nul
if %errorlevel% equ 0 (
    echo.
    echo ✅ 设置成功!
    echo.
    echo 电脑开机后将自动启动 BambooFlow 服务
) else (
    echo.
    echo ❌ 设置失败，请手动复制
    echo.
    echo 将 %source%
    echo 复制到:
    echo %dest%
)

echo.
pause

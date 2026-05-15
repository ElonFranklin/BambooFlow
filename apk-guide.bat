@echo off
chcp 65001 >nul
title BambooFlow - APK打包助手

echo.
echo ========================================
echo    BambooFlow APK 打包助手
echo ========================================
echo.
echo 此脚本将帮助您生成APK安装包
echo.
echo 请访问以下网站进行打包:
echo.
echo   1. https://www.appsgeyser.com/ (推荐)
echo   2. https://www.andromo.com/
echo   3. https://apk.ai-builder.com/
echo.
echo.
echo 如果您想自己打包,请确保:
echo   1. 安装 JDK 17
echo   2. 安装 Android SDK
echo   3. 运行: cd android ^&^& gradlew.bat assembleDebug
echo.
echo.
echo 项目文件位置:
echo   %~dp0BambooFlow-app
echo.
echo.
echo 按任意键打开打包网站...
pause >nul

start https://www.appsgeyser.com/

echo.
echo 祝您使用愉快!
pause

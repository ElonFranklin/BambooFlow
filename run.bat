@echo off
cd /d "%~dp0"
start "BambooFlowServer" /B node server.js > server.log 2>&1

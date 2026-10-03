@echo off
:: Change to the directory where this script is located
cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo Starting local deployment server...
call npm run dev

pause

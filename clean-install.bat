@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Add Laragon bins to PATH
set "PATH=C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\composer;C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;%PATH%"

echo.
echo ========================================
echo  CMMI - Clean Install & Reinstall
echo ========================================
echo.

REM Frontend clean
echo [Frontend] Cleaning node_modules...
cd /d "%~dp0\frontend"

if exist "node_modules" (
    echo Removing node_modules folder...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo [Frontend] Cleaning npm cache...
call npm cache clean --force

echo.
echo [Frontend] Reinstalling dependencies...
call npm install --legacy-peer-deps

if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Clean Install Complete!
echo ========================================
echo.
echo Now run: start-frontend.bat
echo.
pause

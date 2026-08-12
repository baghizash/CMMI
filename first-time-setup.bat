@echo off
setlocal enabledelayedexpansion

REM Add Laragon bins to PATH
set "PATH=C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\composer;C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;%PATH%"

echo.
echo ========================================
echo  CMMI System - First Time Setup
echo ========================================
echo.

REM Backend setup
echo [Backend] Installing composer dependencies...
cd /d "%~dp0\laravel-backend-production"
composer install
if errorlevel 1 (
    echo ERROR: Composer install failed
    pause
    exit /b 1
)

echo [Backend] Running database migrations...
php artisan migrate --force
if errorlevel 1 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)

echo [Backend] Seeding demo data...
php artisan db:seed
if errorlevel 1 (
    echo WARNING: Seed failed (might be OK if data exists)
)

echo [Backend] Setup complete!
echo.

REM Frontend setup
echo [Frontend] Installing npm dependencies...
cd /d "%~dp0\frontend"
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: npm install failed
    echo.
    echo Trying again with npm cache clean...
    call npm cache clean --force
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: npm install still failed
        pause
        exit /b 1
    )
)

echo [Frontend] Setup complete!
echo.

echo ========================================
echo  Setup Selesai!
echo ========================================
echo.
echo Jalankan:
echo  1. start-backend.bat
echo  2. start-frontend.bat
echo.
pause

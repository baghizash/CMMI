@echo off
setlocal enabledelayedexpansion

REM Add Laragon bins to PATH
set "PATH=C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\composer;C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;%PATH%"

echo.
echo ===================================
echo   CMMI Frontend - Development
echo ===================================
echo.

cd /d "%~dp0\frontend"

if not exist "node_modules" (
    echo Installing npm dependencies...
    echo This may take a few minutes...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: npm install failed
        echo Trying cache clean and retry...
        call npm cache clean --force
        call npm install --legacy-peer-deps
        if errorlevel 1 (
            echo FAILED: Could not install dependencies
            echo Check internet connection and try again
            pause
            exit /b 1
        )
    )
    echo.
)

echo.
echo Starting React development server...
echo.
echo Frontend akan terbuka di: http://localhost:3000
echo.
echo Untuk stop: Ctrl+C
echo.

call npm start

pause

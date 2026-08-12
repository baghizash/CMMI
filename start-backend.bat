@echo off
setlocal enabledelayedexpansion

REM Add Laragon bins to PATH
set "PATH=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;%PATH%"

cd /d "%~dp0\laravel-backend-production"

echo Starting CMMI Backend...
php artisan serve --port=8000

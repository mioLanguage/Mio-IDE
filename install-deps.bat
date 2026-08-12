@echo off
title Mio-IDE Dependency Installer
echo ============================================
echo   Mio-IDE Dependency Installer
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first!
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/2] Node.js version:
node -v
echo.

echo [2/2] Installing dependencies, please wait...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Dependency installation failed. Please check your network and retry.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Dependencies installed successfully!
echo   Now run mio-ide-run.bat to start the app
echo ============================================
echo.
pause
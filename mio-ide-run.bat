@echo off
title Mio-IDE
echo ============================================
echo   Starting Mio-IDE...
echo ============================================
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Dependencies not found, installing...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Dependency installation failed. Please check your network and retry.
        pause
        exit /b 1
    )
)

echo Starting dev server...
echo.
call npm run dev
pause
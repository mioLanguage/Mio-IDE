@echo off
chcp 65001 >nul
title Mio-IDE
echo ============================================
echo   正在启动 Mio-IDE...
echo ============================================
echo.

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo [提示] 未检测到依赖，正在自动安装...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
)

echo 正在启动开发服务器...
echo.
call npm run dev
pause
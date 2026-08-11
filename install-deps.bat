@echo off
chcp 65001 >nul
title Mio-IDE 依赖安装
echo ============================================
echo   Mio-IDE 依赖安装工具
echo ============================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js！
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/2] 检测到 Node.js 版本:
node -v
echo.

echo [2/2] 正在安装依赖，请稍候...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [错误] 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
)

echo.
echo ============================================
echo   依赖安装完成！
echo   现在可以运行 mio-ide-run.bat 启动程序
echo ============================================
echo.
pause
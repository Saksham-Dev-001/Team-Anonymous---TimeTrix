@echo off
title TimeTrix Autonomous Timetable Engine
chcp 65001 >nul
cls

echo ========================================================
echo    🚀 TIMETRIX — AUTONOMOUS TIMETABLE ENGINE
echo ========================================================
echo.
echo [*] Local server start kiya ja raha hai...
echo.

:: Check for Python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Python runtime detected!
    echo [*] Local Server URL : http://localhost:3000
    echo [*] Browser automatically open ho raha hai...
    echo.
    echo [i] Server stop karne ke liye terminal me Ctrl + C dabayein.
    echo ========================================================
    echo.
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:3000"
    python -m http.server 3000
    goto :end
)

:: Fallback to Node.js / npx
where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Node.js runtime detected! Starting via npx serve...
    echo [*] Local Server URL : http://localhost:3000
    echo [*] Browser automatically open ho raha hai...
    echo.
    echo [i] Server stop karne ke liye terminal me Ctrl + C dabayein.
    echo ========================================================
    echo.
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:3000"
    npx serve -l 3000 .
    goto :end
)

echo [ERROR] Python ya Node.js runtime nahi mila!
echo Kripya Python ya Node.js install karein server run karne ke liye.
echo.
pause

:end


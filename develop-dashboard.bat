@echo off
REM Method Health Check Dashboard - Development Mode
echo ========================================
echo Starting Development Mode
echo ========================================
echo.
echo This will start TWO terminal windows:
echo   1. Backend (with auto-restart on changes)
echo   2. Frontend (with hot reload)
echo.
echo Press Ctrl+C in each window to stop them.
echo.

REM Check if backend dependencies exist
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd /d "%~dp0backend"
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Backend dependency installation failed!
        pause
        exit /b 1
    )
    echo.
)

REM Check if frontend dependencies exist
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%~dp0frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Frontend dependency installation failed!
        pause
        exit /b 1
    )
    echo.
)

REM Start backend with auto-restart
echo Starting backend server (auto-restart enabled)...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "node --watch server.js"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start frontend dev server
echo Starting frontend dev server (hot reload enabled)...
cd /d "%~dp0frontend"
start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Development servers starting...
echo ========================================
echo.
echo Backend:  Running with auto-restart
echo Frontend: Running with hot reload
echo.
echo The frontend dev server will open your browser automatically.
echo.
timeout /t 3 /nobreak >nul
exit

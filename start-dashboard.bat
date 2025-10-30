@echo off
REM Method Health Check Dashboard Launcher
echo Starting Method Health Check Dashboard...
echo.

REM Check if frontend build exists
if not exist "%~dp0frontend\dist" (
    echo [INFO] No frontend build found. Building now...
    echo This is a one-time process and may take a minute.
    echo.
    cd /d "%~dp0frontend"
    call npm install
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Frontend build failed!
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Frontend build completed!
    echo.
)

REM Change to backend directory
cd /d "%~dp0backend"

REM Check if backend dependencies exist
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Backend dependency installation failed!
        pause
        exit /b 1
    )
    echo.
)

REM Start the Node.js server in visible window
start cmd /k "node server.js"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:3001

echo Dashboard is starting...
echo Server running in background
echo Access at: http://localhost:3001
timeout /t 3 /nobreak >nul
exit

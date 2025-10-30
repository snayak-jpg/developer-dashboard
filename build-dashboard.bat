@echo off
REM Build Method Health Check Dashboard
echo ========================================
echo Building Method Health Check Dashboard
echo ========================================
echo.

REM Build Frontend
echo [1/2] Building Frontend...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo Frontend build completed successfully!
echo.

REM Install Backend Dependencies (if needed)
echo [2/2] Checking Backend Dependencies...
cd /d "%~dp0backend"
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Backend dependency installation failed!
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)
echo.

echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo You can now run: start-dashboard.bat
echo.
pause

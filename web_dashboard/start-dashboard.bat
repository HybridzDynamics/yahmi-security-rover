@echo off
echo ========================================
echo ESP32 Surveillance Car Dashboard
echo ========================================
echo.

echo Starting Mock API Server...
echo This provides mock endpoints when ESP32 is not available
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    echo Please install Node.js with npm
    pause
    exit /b 1
)

REM Install dependencies if package.json exists
if exist package.json (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo WARNING: Failed to install some dependencies
        echo Continuing anyway...
    )
    echo.
)

REM Start the mock server
echo Starting Mock API Server on port 3000...
echo Dashboard will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

node mock-server.js

pause

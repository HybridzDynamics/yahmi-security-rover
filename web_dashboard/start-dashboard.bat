@echo off
echo ========================================
echo   Yahmi Security Rover Dashboard
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the web_dashboard directory
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    if exist "env.example" (
        echo Creating .env file from template...
        copy "env.example" ".env"
        echo.
        echo IMPORTANT: Please edit .env file with your configuration
        echo.
    ) else (
        echo WARNING: No .env file found
        echo Please create one with your configuration
        echo.
    )
)

REM Create necessary directories
if not exist "uploads" mkdir uploads
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

echo Starting Yahmi Security Rover Dashboard...
echo.
echo Dashboard will be available at: http://localhost:3000
echo Login page: http://localhost:3000/login.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node server.js

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server failed to start
    echo Please check the error messages above
    pause
)

echo.
echo Server stopped.
pause
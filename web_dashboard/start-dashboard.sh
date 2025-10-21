#!/bin/bash

echo "========================================"
echo "ESP32 Surveillance Car Dashboard"
echo "========================================"
echo

echo "Starting Mock API Server..."
echo "This provides mock endpoints when ESP32 is not available"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not available!"
    echo "Please install Node.js with npm"
    exit 1
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "WARNING: Failed to install some dependencies"
        echo "Continuing anyway..."
    fi
    echo
fi

# Start the mock server
echo "Starting Mock API Server on port 3000..."
echo "Dashboard will be available at: http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server"
echo

node mock-server.js

#!/bin/bash

# Surveillance Car Dashboard Startup Script
# Professional implementation with error handling and setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to create directory if it doesn't exist
create_directory() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        print_success "Created directory: $1"
    fi
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed"
        print_status "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="14.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_warning "Node.js version $NODE_VERSION detected. Recommended: $REQUIRED_VERSION or higher"
    else
        print_success "Node.js version $NODE_VERSION is compatible"
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed"
        print_status "Please install npm with Node.js"
        exit 1
    fi
    
    # Check npm version
    NPM_VERSION=$(npm --version)
    print_success "npm version $NPM_VERSION detected"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Get the directory where the script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        print_status "Please run this script from the web_dashboard directory"
        exit 1
    fi
    
    # Create necessary directories
    create_directory "uploads"
    create_directory "logs"
    create_directory "backups"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            print_status "Creating .env file from template..."
            cp env.example .env
            print_success ".env file created from template"
            print_warning "Please edit .env file with your configuration"
        else
            print_warning "env.example not found"
            print_status "Please create .env file manually"
        fi
    else
        print_success ".env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        print_status "This may take a few minutes..."
        
        # Install dependencies with progress
        if npm install --progress=true; then
            print_success "Dependencies installed successfully!"
        else
            print_error "Failed to install dependencies"
            print_status "Please check your internet connection and try again"
            exit 1
        fi
    else
        print_success "Dependencies already installed"
    fi
}

# Function to check port availability
check_port() {
    local port=$1
    if port_in_use $port; then
        print_warning "Port $port is already in use"
        print_status "Trying to find an alternative port..."
        
        # Try alternative ports
        for alt_port in 3001 3002 3003 3004 3005; do
            if ! port_in_use $alt_port; then
                print_success "Found available port: $alt_port"
                export PORT=$alt_port
                return
            fi
        done
        
        print_error "No available ports found (3000-3005)"
        print_status "Please stop other services or change the port in .env"
        exit 1
    else
        print_success "Port $port is available"
    fi
}

# Function to start the server
start_server() {
    print_status "Starting Surveillance Car Dashboard..."
    print_status "Dashboard will be available at: http://localhost:${PORT:-3000}"
    print_status "Press Ctrl+C to stop the server"
    echo
    
    # Start the server
    if [ "$1" = "dev" ]; then
        print_status "Starting in development mode..."
        npm run dev
    else
        print_status "Starting in production mode..."
        npm start
    fi
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down server..."
    # Kill any background processes
    jobs -p | xargs -r kill
    print_success "Server stopped"
    exit 0
}

# Function to show help
show_help() {
    echo "Surveillance Car Dashboard Startup Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -d, --dev      Start in development mode"
    echo "  -p, --port     Specify port number"
    echo "  -c, --check    Check system requirements only"
    echo "  -i, --install  Install dependencies only"
    echo
    echo "Examples:"
    echo "  $0              # Start in production mode"
    echo "  $0 --dev        # Start in development mode"
    echo "  $0 --port 3001  # Start on port 3001"
    echo "  $0 --check      # Check system requirements"
    echo "  $0 --install    # Install dependencies"
}

# Main function
main() {
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    # Parse command line arguments
    DEV_MODE=false
    PORT_SPECIFIED=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--dev)
                DEV_MODE=true
                shift
                ;;
            -p|--port)
                export PORT="$2"
                PORT_SPECIFIED=true
                shift 2
                ;;
            -c|--check)
                check_requirements
                print_success "System requirements check completed"
                exit 0
                ;;
            -i|--install)
                check_requirements
                setup_environment
                install_dependencies
                print_success "Dependencies installation completed"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set default port if not specified
    if [ -z "$PORT" ]; then
        export PORT=3000
    fi
    
    # Print banner
    echo "========================================"
    echo "  Surveillance Car Dashboard Startup"
    echo "========================================"
    echo
    
    # Run setup steps
    check_requirements
    setup_environment
    install_dependencies
    check_port $PORT
    
    # Start the server
    start_server $DEV_MODE
}

# Run main function with all arguments
main "$@"

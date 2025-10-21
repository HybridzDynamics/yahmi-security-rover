#!/bin/bash
# Raspberry Pi Surveillance Car Startup Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Surveillance Car System...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Set environment variables
export BACKEND_URL="ws://localhost:3000"
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Create necessary directories
mkdir -p captures
mkdir -p logs
mkdir -p data

# Set permissions
chmod 755 captures
chmod 755 logs
chmod 755 data

# Check if required packages are installed
echo -e "${YELLOW}Checking dependencies...${NC}"

# Check Python packages
python3 -c "import RPi.GPIO, gpiozero, picamera, cv2, flask, numpy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Missing required Python packages. Installing...${NC}"
    pip3 install -r requirements.txt
fi

# Check if camera is available
if ! vcgencmd get_camera | grep -q "detected=1"; then
    echo -e "${YELLOW}Warning: Camera not detected. Some features may not work.${NC}"
fi

# Enable camera interface
if ! grep -q "start_x=1" /boot/config.txt; then
    echo -e "${YELLOW}Enabling camera interface...${NC}"
    echo "start_x=1" >> /boot/config.txt
    echo "gpu_mem=128" >> /boot/config.txt
    echo -e "${YELLOW}Camera interface enabled. Reboot required for changes to take effect.${NC}"
fi

# Set up GPIO permissions
echo -e "${YELLOW}Setting up GPIO permissions...${NC}"
usermod -a -G gpio pi
chmod 666 /dev/gpiomem

# Configure WiFi (if needed)
if [ ! -f /etc/wpa_supplicant/wpa_supplicant.conf ]; then
    echo -e "${YELLOW}WiFi not configured. Please configure WiFi manually or use the web interface.${NC}"
fi

# Start pigpio daemon (required for gpiozero)
echo -e "${YELLOW}Starting pigpio daemon...${NC}"
systemctl start pigpiod
systemctl enable pigpiod

# Set up systemd service
echo -e "${YELLOW}Setting up systemd service...${NC}"
cat > /etc/systemd/system/surveillance-car.service << EOF
[Unit]
Description=Surveillance Car Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 $(pwd)/main.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=$(pwd)
Environment=BACKEND_URL=ws://localhost:3000

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable surveillance-car.service

# Start the service
echo -e "${GREEN}Starting surveillance car service...${NC}"
systemctl start surveillance-car.service

# Check service status
sleep 2
if systemctl is-active --quiet surveillance-car.service; then
    echo -e "${GREEN}Surveillance car service started successfully!${NC}"
    echo -e "${BLUE}Service status:${NC}"
    systemctl status surveillance-car.service --no-pager
else
    echo -e "${RED}Failed to start surveillance car service${NC}"
    echo -e "${BLUE}Service logs:${NC}"
    journalctl -u surveillance-car.service --no-pager -n 20
    exit 1
fi

# Display connection information
echo -e "${GREEN}Surveillance Car System is running!${NC}"
echo -e "${BLUE}Web Dashboard: http://$(hostname -I | awk '{print $1}'):5000${NC}"
echo -e "${BLUE}API Endpoint: http://$(hostname -I | awk '{print $1}'):5000/api/status${NC}"
echo -e "${BLUE}Camera Stream: http://$(hostname -I | awk '{print $1}'):5000/api/camera/stream${NC}"

# Show useful commands
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  Check status: sudo systemctl status surveillance-car"
echo -e "  View logs: sudo journalctl -u surveillance-car -f"
echo -e "  Stop service: sudo systemctl stop surveillance-car"
echo -e "  Restart service: sudo systemctl restart surveillance-car"

echo -e "${GREEN}Setup complete!${NC}"

# Smart Surveillance Car - Setup Guide

## Table of Contents
1. [Hardware Requirements](#hardware-requirements)
2. [Software Requirements](#software-requirements)
3. [ESP32 Firmware Setup](#esp32-firmware-setup)
4. [Web Dashboard Setup](#web-dashboard-setup)
5. [Flutter App Setup](#flutter-app-setup)
6. [MongoDB Setup](#mongodb-setup)
7. [Network Configuration](#network-configuration)
8. [Testing and Verification](#testing-and-verification)
9. [Troubleshooting](#troubleshooting)

## Hardware Requirements

### ESP32 Development Board
- ESP32 development board (ESP32-DevKitC or similar)
- ESP32-CAM module for video streaming
- MicroSD card (optional, for local storage)

### Sensors
- 3x IR sensors (for obstacle detection)
- 1x HC-SR04 ultrasonic sensor (for distance measurement)
- 1x Battery voltage divider circuit

### Actuators
- 2x DC motors (6V-12V)
- 1x L298N motor driver module
- 1x Speaker/buzzer (8Ω)
- 1x Microphone module (optional)

### Power System
- Li-Po battery (7.4V or 11.1V)
- Battery voltage divider (2:1 ratio)
- Power switch

### Optional Components
- SD card module (for local storage)
- GPS module (for location tracking)
- IMU sensor (for orientation)

## Software Requirements

### Development Environment
- Arduino IDE 2.0 or PlatformIO
- ESP32 Arduino Core (latest version)
- Flutter SDK (3.10.0 or later)
- Node.js (16.0 or later)
- MongoDB (5.0 or later)

### Required Libraries
- ArduinoJson
- WebSockets
- ESP32 Camera
- I2S (for audio)
- SD (for storage)

## ESP32 Firmware Setup

### 1. Install Arduino IDE and ESP32 Core
```bash
# Install Arduino IDE from https://www.arduino.cc/en/software
# Install ESP32 Arduino Core through Board Manager
```

### 2. Install Required Libraries
Open Arduino IDE and install these libraries:
- ArduinoJson by Benoit Blanchon
- WebSockets by Markus Sattler
- ESP32 Camera by Espressif Systems

### 3. Configure Hardware Pins
Edit `src/main.h` and update pin definitions:
```cpp
const int IR_PINS[3] = {34, 35, 36};
const int ULTRASONIC_TRIG = 32;
const int ULTRASONIC_ECHO = 33;
const int MOTOR_IN1 = 25;
const int MOTOR_IN2 = 26;
const int MOTOR_IN3 = 27;
const int MOTOR_IN4 = 14;
const int MOTOR_ENA = 12;
const int MOTOR_ENB = 13;
const int SPEAKER_PIN = 2;
const int MIC_PIN = 4;
const int BATTERY_PIN = 39;
const int SD_CS = 5;
```

### 4. Configure WiFi Settings
Edit `surveillance_car.ino`:
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

### 5. Upload Firmware
1. Select ESP32 board in Arduino IDE
2. Set upload speed to 115200
3. Upload the firmware
4. Open Serial Monitor to verify connection

## Web Dashboard Setup

### 1. Upload Web Files
Copy the web dashboard files to ESP32 SPIFFS:
```bash
# Use Arduino IDE SPIFFS Data Upload tool
# Or use PlatformIO SPIFFS upload
```

### 2. Access Dashboard
1. Connect to ESP32's WiFi network
2. Open browser to `http://192.168.4.1` (AP mode)
3. Or connect to your WiFi and use the assigned IP

### 3. Configure Settings
- Set WiFi credentials
- Adjust camera settings
- Configure motor parameters
- Set audio preferences

## Flutter App Setup

### 1. Install Flutter
```bash
# Follow Flutter installation guide for your platform
# https://flutter.dev/docs/get-started/install
```

### 2. Install Dependencies
```bash
cd flutter_app
flutter pub get
```

### 3. Configure App
Edit `lib/services/storage_service.dart`:
```dart
// Update default server settings
static String getServerUrl() {
  return getSetting<String>('server_url', defaultValue: '192.168.1.100') ?? '192.168.1.100';
}
```

### 4. Build and Install
```bash
# For Android
flutter build apk --release
flutter install

# For iOS (requires macOS)
flutter build ios --release
```

## MongoDB Setup

### 1. Install MongoDB
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Windows
# Download from https://www.mongodb.com/try/download/community
```

### 2. Start MongoDB Service
```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS
brew services start mongodb-community

# Windows
# Start MongoDB service from Services
```

### 3. Create Database
```bash
mongo
use surveillance_car
```

### 4. Import Models
```bash
cd mongodb
node -e "require('./models/surveillance_data.js')"
```

## Network Configuration

### 1. WiFi Setup
- Ensure ESP32 and devices are on same network
- Configure static IP if needed
- Set up port forwarding for remote access

### 2. Firewall Configuration
Open required ports:
- 80 (HTTP)
- 81 (WebSocket)
- 443 (HTTPS, optional)

### 3. DNS Configuration
- Set up local DNS entry for easy access
- Configure dynamic DNS for remote access

## Testing and Verification

### 1. Hardware Test
```bash
# Check sensor readings
# Verify motor movement
# Test camera streaming
# Confirm audio output
```

### 2. Software Test
```bash
# Test web dashboard
# Verify Flutter app connection
# Check MongoDB data storage
# Test WebSocket communication
```

### 3. Integration Test
```bash
# Test complete system workflow
# Verify autonomous mode
# Test manual control
# Check data logging
```

## Troubleshooting

### Common Issues

#### ESP32 Won't Connect to WiFi
- Check SSID and password
- Verify WiFi signal strength
- Check for special characters in credentials

#### Camera Not Working
- Verify camera module connections
- Check power supply
- Update camera library

#### Motors Not Responding
- Check motor driver connections
- Verify power supply
- Check motor driver enable pins

#### WebSocket Connection Failed
- Check firewall settings
- Verify port 81 is open
- Check ESP32 IP address

#### Flutter App Can't Connect
- Verify server IP address
- Check network connectivity
- Verify WebSocket port

### Debug Mode
Enable debug mode in ESP32 firmware:
```cpp
#define DEBUG_MODE true
```

### Log Files
Check system logs:
- ESP32: Serial Monitor
- Web: Browser Developer Tools
- Flutter: Debug Console
- MongoDB: Database logs

### Support
For additional support:
- Check GitHub Issues
- Review documentation
- Contact development team

## Performance Optimization

### ESP32 Optimization
- Use PSRAM for camera buffer
- Optimize sensor reading intervals
- Implement efficient data structures

### Web Dashboard Optimization
- Minimize JavaScript bundle size
- Use efficient WebSocket handling
- Implement proper error handling

### Flutter App Optimization
- Use efficient state management
- Implement proper memory management
- Optimize network requests

### MongoDB Optimization
- Create appropriate indexes
- Implement data archiving
- Use connection pooling

## Security Considerations

### Network Security
- Use WPA3 encryption
- Implement VPN for remote access
- Use HTTPS for web interface

### Data Security
- Encrypt sensitive data
- Implement user authentication
- Use secure communication protocols

### Device Security
- Update firmware regularly
- Implement secure boot
- Use encrypted storage

## Maintenance

### Regular Tasks
- Update firmware
- Clean sensor lenses
- Check battery health
- Monitor storage usage

### Backup
- Backup configuration files
- Export MongoDB data
- Save Flutter app data

### Updates
- Check for firmware updates
- Update dependencies
- Monitor security patches

# Smart Surveillance Car System

A comprehensive ESP32-based surveillance car with real-time video streaming, autonomous navigation, and mobile/web control interfaces.

## Project Structure

```
esp32_surveillance_car/
├── esp32_firmware/           # ESP32 Arduino C++ code
│   ├── src/
│   │   ├── main.cpp
│   │   ├── sensors/
│   │   │   ├── ir_sensor.h
│   │   │   ├── ir_sensor.cpp
│   │   │   ├── ultrasonic_sensor.h
│   │   │   ├── ultrasonic_sensor.cpp
│   │   │   ├── battery_monitor.h
│   │   │   └── battery_monitor.cpp
│   │   ├── actuators/
│   │   │   ├── motor_controller.h
│   │   │   ├── motor_controller.cpp
│   │   │   ├── speaker.h
│   │   │   └── speaker.cpp
│   │   ├── camera/
│   │   │   ├── camera_stream.h
│   │   │   └── camera_stream.cpp
│   │   ├── audio/
│   │   │   ├── audio_manager.h
│   │   │   └── audio_manager.cpp
│   │   ├── storage/
│   │   │   ├── storage_manager.h
│   │   │   └── storage_manager.cpp
│   │   ├── communication/
│   │   │   ├── wifi_manager.h
│   │   │   ├── wifi_manager.cpp
│   │   │   ├── websocket_server.h
│   │   │   ├── websocket_server.cpp
│   │   │   ├── rest_api.h
│   │   │   └── rest_api.cpp
│   │   └── modes/
│   │       ├── autonomous_mode.h
│   │       ├── autonomous_mode.cpp
│   │       ├── manual_mode.h
│   │       └── manual_mode.cpp
│   ├── data/                 # Web server files
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   ├── audio_files/          # Pre-recorded audio files
│   │   ├── power_on.wav
│   │   ├── power_off.wav
│   │   ├── alert.wav
│   │   └── siren.wav
│   └── surveillance_car.ino
├── web_dashboard/            # Web dashboard
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
├── flutter_app/              # Flutter Android app
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/
│   │   ├── services/
│   │   ├── screens/
│   │   └── widgets/
│   ├── android/
│   └── pubspec.yaml
├── mongodb/                  # MongoDB integration
│   ├── models/
│   └── scripts/
└── docs/                     # Documentation
    ├── setup.md
    ├── hardware.md
    └── api.md
```

## Features

### Hardware
- ESP32 microcontroller with WiFi/Bluetooth
- ESP32-CAM for video streaming
- IR sensors for obstacle detection
- Ultrasonic sensor for distance measurement
- Microphone and speaker for audio
- Battery monitoring system
- Optional SD card for local storage

### Software
- **Autonomous Mode**: Obstacle avoidance and line following
- **Manual Mode**: Web dashboard and mobile app control
- Real-time video streaming (MJPEG)
- Audio capture and playback
- WebSocket communication for real-time updates
- REST API for configuration and data retrieval
- MongoDB integration for historical data
- Battery monitoring and reporting

## Quick Start

1. **Hardware Setup**: Connect sensors and actuators to ESP32
2. **Firmware Upload**: Upload Arduino code to ESP32
3. **Web Dashboard**: Open browser to ESP32 IP address
4. **Mobile App**: Install and configure Flutter app
5. **MongoDB**: Set up database for historical data

## Documentation

- [Hardware Setup](docs/hardware.md)
- [Software Setup](docs/setup.md)
- [API Documentation](docs/api.md)

## License

MIT License - see LICENSE file for details

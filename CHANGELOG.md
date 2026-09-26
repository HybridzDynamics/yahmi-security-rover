# Changelog

All notable changes to the Yahmi Security Rover project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-26

### Added
- **Core Platform**: Complete Express.js backend with Socket.io real-time streaming and telemetry.
- **Embedded Firmware**:
  - ESP32 dual-core firmware with WiFi AP/Station mode, dual motor control, ultrasonic obstacle detection, and live camera frame streaming.
  - Raspberry Pi firmware with multi-threaded sensor acquisition, OpenCV computer vision pipeline, and audio streaming.
- **Mobile Control**: Flutter cross-platform mobile client for Android and iOS.
- **Database Architecture**: Mongoose schemas for User, SystemStatus, SensorData, AIDetection, ControlCommand, VideoRecording, and SecurityAlert.
- **Professional DevOps**:
  - Multi-stage Docker containerization and Docker Compose stacks (development & production).
  - GitHub Actions CI/CD workflows for automated linting, testing, and container deployment.
  - Automated Jest test framework with coverage reporting.
  - Deployment and automated health-check utility scripts.
  - Complete architecture, security, troubleshooting, and API documentation suite.

### Security
- Password hashing using bcrypt with salt rounds.
- JWT-based authentication with refresh token lifecycle.
- Helmet HTTP security headers and IP rate limiting on API endpoints.

---

## [Unreleased]
### Planned
- Over-The-Air (OTA) firmware updates via signed binaries.
- Edge TPU acceleration for onboard AI object classification.
- ROS2 (Robot Operating System) bridge integration.

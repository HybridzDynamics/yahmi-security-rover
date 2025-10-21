# Smart Surveillance Car - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket API](#websocket-api)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

## Overview

The Smart Surveillance Car system provides both REST API and WebSocket interfaces for control and monitoring. The API allows external applications to interact with the surveillance car system.

### Base URLs
- **REST API**: `http://[ESP32_IP]/api/`
- **WebSocket**: `ws://[ESP32_IP]:81`
- **Video Stream**: `http://[ESP32_IP]/stream`
- **Audio Stream**: `http://[ESP32_IP]/audio`

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **Video**: `multipart/x-mixed-replace; boundary=frame`
- **Audio**: `audio/wav`

## Authentication

Currently, the system does not implement authentication. All endpoints are publicly accessible. For production use, implement proper authentication.

### Future Authentication
```http
Authorization: Bearer <token>
```

## REST API Endpoints

### System Status

#### GET /api/status
Get current system status.

**Response:**
```json
{
  "system": "Surveillance Car",
  "version": "1.0.0",
  "uptime": 1234567,
  "freeHeap": 234567,
  "wifi": "MyWiFi",
  "ip": "192.168.1.100",
  "rssi": -45,
  "connectedClients": 2,
  "timestamp": 1640995200000
}
```

#### GET /api/system
Get detailed system information.

**Response:**
```json
{
  "uptime": 1234567,
  "freeHeap": 234567,
  "cpuFreq": 240,
  "flashSize": 4194304,
  "chipModel": "ESP32-D0WDQ6",
  "chipRevision": 1
}
```

### Control Commands

#### POST /api/control
Send control commands to the system.

**Request Body:**
```json
{
  "command": "motor",
  "action": "forward",
  "value": 150
}
```

**Response:**
```json
{
  "success": true,
  "message": "Command executed successfully",
  "timestamp": 1640995200000
}
```

#### GET /api/control
Get current control status.

**Response:**
```json
{
  "mode": "manual",
  "motors": "stopped",
  "camera": "active",
  "audio": "active"
}
```

### Configuration

#### GET /api/config
Get current configuration.

**Response:**
```json
{
  "wifi": {
    "ssid": "MyWiFi",
    "ip": "192.168.1.100"
  },
  "camera": {
    "quality": 12,
    "brightness": 0,
    "contrast": 0,
    "saturation": 0
  },
  "motors": {
    "maxSpeed": 255,
    "minSpeed": 50
  },
  "sensors": {
    "irThreshold": 500,
    "ultrasonicThreshold": 20
  },
  "battery": {
    "warningLevel": 20,
    "criticalLevel": 10
  }
}
```

#### POST /api/config
Update configuration.

**Request Body:**
```json
{
  "camera": {
    "quality": 10,
    "brightness": 1
  },
  "motors": {
    "maxSpeed": 200
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully"
}
```

### Sensor Data

#### GET /api/data
Get current sensor data.

**Response:**
```json
{
  "sensors": {
    "ir": [0, 0, 0],
    "ultrasonic": 25.5,
    "battery": {
      "voltage": 7.8,
      "percentage": 85
    }
  },
  "motors": {
    "leftSpeed": 0,
    "rightSpeed": 0
  },
  "timestamp": 1640995200000
}
```

#### GET /api/data/sensors
Get detailed sensor data.

**Response:**
```json
{
  "irSensors": {
    "left": 0,
    "center": 0,
    "right": 0
  },
  "ultrasonicDistance": 25.5,
  "batteryVoltage": 7.8,
  "batteryPercentage": 85,
  "leftMotorSpeed": 0,
  "rightMotorSpeed": 0,
  "motorDirection": "stop",
  "obstacleDetected": false
}
```

#### GET /api/data/battery
Get battery information.

**Response:**
```json
{
  "voltage": 7.8,
  "percentage": 85,
  "isLow": false,
  "isCritical": false
}
```

### Media

#### GET /api/video
Get video stream information.

**Response:**
```json
{
  "streaming": true,
  "format": "MJPEG",
  "resolution": "640x480",
  "quality": 12,
  "url": "/stream"
}
```

#### GET /api/audio
Get audio stream information.

**Response:**
```json
{
  "streaming": true,
  "format": "WAV",
  "sampleRate": 16000,
  "channels": 1,
  "url": "/audio"
}
```

### Storage

#### GET /api/storage
Get storage information.

**Response:**
```json
{
  "type": "SD Card",
  "totalSpace": 15728640,
  "usedSpace": 5242880,
  "freeSpace": 10485760,
  "usagePercentage": 33.3
}
```

#### GET /api/logs
Get system logs.

**Response:**
```json
{
  "logs": [
    {
      "timestamp": 1640995200000,
      "level": "INFO",
      "message": "System started",
      "component": "main"
    }
  ],
  "count": 1,
  "lastUpdate": 1640995200000
}
```

## WebSocket API

### Connection
Connect to WebSocket server:
```javascript
const ws = new WebSocket('ws://192.168.1.100:81');
```

### Message Types

#### Status Updates
```json
{
  "type": "status",
  "mode": "manual",
  "battery": 85,
  "obstacle": false,
  "running": true,
  "timestamp": 1640995200000
}
```

#### Sensor Data
```json
{
  "type": "sensor_data",
  "irSensors": [0, 0, 0],
  "ultrasonicDistance": 25.5,
  "batteryVoltage": 7.8,
  "batteryPercentage": 85,
  "leftMotorSpeed": 0,
  "rightMotorSpeed": 0,
  "motorDirection": "stop",
  "obstacleDetected": false,
  "timestamp": 1640995200000
}
```

#### Control Commands
```json
{
  "type": "control",
  "command": "motor",
  "action": "forward",
  "value": 150,
  "timestamp": 1640995200000
}
```

#### Configuration Updates
```json
{
  "type": "config",
  "key": "camera.quality",
  "value": 10,
  "timestamp": 1640995200000
}
```

#### Alerts
```json
{
  "type": "alert",
  "level": "warning",
  "message": "Low battery detected",
  "timestamp": 1640995200000
}
```

### Sending Commands

#### Motor Control
```javascript
ws.send(JSON.stringify({
  type: 'control',
  command: 'motor',
  action: 'forward',
  value: 150
}));
```

#### Camera Control
```javascript
ws.send(JSON.stringify({
  type: 'control',
  command: 'camera',
  action: 'capture',
  value: 0
}));
```

#### Audio Control
```javascript
ws.send(JSON.stringify({
  type: 'control',
  command: 'audio',
  action: 'play',
  value: 2
}));
```

#### System Control
```javascript
ws.send(JSON.stringify({
  type: 'control',
  command: 'system',
  action: 'restart',
  value: 0
}));
```

## Data Models

### SystemStatus
```json
{
  "isConnected": true,
  "mode": "manual",
  "batteryLevel": 85,
  "batteryVoltage": 7.8,
  "obstacleDetected": false,
  "isRunning": true,
  "uptime": 1234567,
  "freeHeap": 234567,
  "cpuFreq": 240,
  "wifiSSID": "MyWiFi",
  "ipAddress": "192.168.1.100",
  "wifiSignal": -45,
  "storageUsage": 33.3,
  "timestamp": 1640995200000
}
```

### SensorData
```json
{
  "irSensors": [0, 0, 0],
  "ultrasonicDistance": 25.5,
  "batteryVoltage": 7.8,
  "batteryPercentage": 85,
  "leftMotorSpeed": 0,
  "rightMotorSpeed": 0,
  "motorDirection": "stop",
  "obstacleDetected": false,
  "timestamp": 1640995200000
}
```

### ControlCommand
```json
{
  "command": "motor",
  "action": "forward",
  "value": 150,
  "source": "web",
  "clientId": "client123",
  "success": true,
  "errorMessage": null,
  "executionTime": 5,
  "timestamp": 1640995200000
}
```

## Error Handling

### HTTP Status Codes
- **200 OK**: Request successful
- **400 Bad Request**: Invalid request
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Error Response Format
```json
{
  "error": true,
  "message": "Error description",
  "code": 400,
  "timestamp": 1640995200000
}
```

### Common Error Codes
- **E001**: Invalid command
- **E002**: Invalid parameter
- **E003**: System busy
- **E004**: Hardware error
- **E005**: Communication error

## Rate Limiting

### Current Limits
- **REST API**: 100 requests per minute
- **WebSocket**: 1000 messages per minute
- **Video Stream**: 1 connection per client

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995260
```

## Examples

### JavaScript WebSocket Client
```javascript
const ws = new WebSocket('ws://192.168.1.100:81');

ws.onopen = function() {
  console.log('Connected to surveillance car');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onclose = function() {
  console.log('Disconnected from surveillance car');
};

// Send motor command
function moveForward(speed) {
  ws.send(JSON.stringify({
    type: 'control',
    command: 'motor',
    action: 'forward',
    value: speed
  }));
}
```

### Python REST Client
```python
import requests
import json

base_url = 'http://192.168.1.100/api'

# Get system status
response = requests.get(f'{base_url}/status')
status = response.json()
print(f'Battery: {status["battery"]}%')

# Send motor command
command = {
    'command': 'motor',
    'action': 'forward',
    'value': 150
}
response = requests.post(f'{base_url}/control', json=command)
result = response.json()
print(f'Command result: {result["message"]}')
```

### cURL Examples
```bash
# Get system status
curl -X GET http://192.168.1.100/api/status

# Send motor command
curl -X POST http://192.168.1.100/api/control \
  -H "Content-Type: application/json" \
  -d '{"command":"motor","action":"forward","value":150}'

# Get sensor data
curl -X GET http://192.168.1.100/api/data/sensors
```

### Flutter WebSocket Client
```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class SurveillanceCarClient {
  WebSocketChannel? _channel;
  
  void connect(String serverUrl) {
    _channel = WebSocketChannel.connect(Uri.parse('ws://$serverUrl:81'));
    
    _channel!.stream.listen((data) {
      final message = jsonDecode(data);
      _handleMessage(message);
    });
  }
  
  void sendCommand(String command, {String? action, dynamic value}) {
    _channel?.sink.add(jsonEncode({
      'type': 'control',
      'command': command,
      'action': action,
      'value': value,
    }));
  }
  
  void _handleMessage(Map<String, dynamic> message) {
    // Handle incoming messages
  }
}
```

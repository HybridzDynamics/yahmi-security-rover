# REST API & WebSocket Examples

Comprehensive code examples for interacting with the Yahmi Security Rover Web API and real-time WebSocket interface.

---

## 🔑 1. Authentication

### Login and Acquire JWT
#### cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourPassword123"}'
```

#### Node.js / JavaScript:
```javascript
const axios = require('axios');

async function login() {
  const res = await axios.post('http://localhost:3000/api/auth/login', {
    username: 'admin',
    password: 'yourPassword123'
  });
  console.log('JWT Token:', res.data.token);
  return res.data.token;
}
```

#### Python:
```python
import requests

response = requests.post(
    "http://localhost:3000/api/auth/login",
    json={"username": "admin", "password": "yourPassword123"}
)
token = response.json()["token"]
print(f"Acquired token: {token}")
```

---

## 🚗 2. Rover Control & Navigation

### Send Drive Command
#### cURL:
```bash
curl -X POST http://localhost:3000/api/rover/control \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "FORWARD",
    "speed": 85,
    "duration": 2000
  }'
```

#### Python:
```python
headers = {"Authorization": f"Bearer {token}"}
payload = {"command": "FORWARD", "speed": 85, "duration": 2000}

resp = requests.post("http://localhost:3000/api/rover/control", json=payload, headers=headers)
print(resp.json())
```

---

## 📊 3. Sensor Telemetry & Health Checks

### Check System Health
```bash
curl http://localhost:3000/health
```
Response:
```json
{
  "status": "UP",
  "service": "yahmi-security-rover",
  "timestamp": "2026-09-26T15:20:00.000Z",
  "uptime": 3600.42,
  "database": "connected",
  "version": "1.0.0"
}
```

### Fetch Real-Time Sensor Telemetry
```bash
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" http://localhost:3000/api/sensors/data
```

---

## ⚡ 4. Real-Time WebSockets

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to Rover telemetry stream');
  
  // Subscribe to sensor feed
  socket.emit('subscribe', { channel: 'telemetry' });
});

socket.on('sensor_update', (data) => {
  console.log(`Battery: ${data.battery}%, Distance: ${data.distance}cm`);
});
```

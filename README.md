# 🚗 Professional Surveillance Car System

A comprehensive IoT surveillance system with AI-powered detection, real-time monitoring, and professional web dashboard. Built with ESP32/Raspberry Pi, MongoDB, Gemini AI, and Firebase integration.

## 🌟 Features

### 🤖 AI-Powered Detection
- **Gemini AI Integration**: Advanced object detection with daily limit management
- **Real-time Analysis**: Live video stream analysis with bounding boxes
- **Smart Alerts**: Configurable alert levels (low, medium, high, critical)
- **Detection Modes**: Animal detection, human detection, or both
- **Confidence Scoring**: AI confidence levels with customizable thresholds

### 📱 Professional Web Dashboard
- **Real-time Monitoring**: Live video stream with professional UI
- **Device Management**: Support for ESP32 and Raspberry Pi
- **WiFi Configuration**: Easy network setup and management
- **Control Interface**: Motor control, camera settings, audio controls
- **System Status**: Battery monitoring, sensor data, system health
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🔧 Hardware Support
- **ESP32**: Arduino-compatible microcontroller with camera support
- **Raspberry Pi**: Full Linux computer with Python firmware
- **Sensors**: IR sensors, ultrasonic distance, battery monitoring
- **Motors**: Dual motor control with speed and direction
- **Camera**: Live video streaming with quality controls
- **Audio**: Microphone recording and speaker control

### 📊 Data Management
- **MongoDB Atlas**: Cloud database for all system data
- **Firebase Firestore**: Real-time data synchronization
- **Data Analytics**: Usage statistics and system health metrics
- **Export Functionality**: Data export and backup capabilities
- **Cleanup Automation**: Automatic old data cleanup

### 🔒 Security & Monitoring
- **Authentication**: JWT-based authentication system
- **Rate Limiting**: API rate limiting and security headers
- **Real-time Alerts**: Email, SMS, and push notifications
- **System Logs**: Comprehensive logging and monitoring
- **Health Checks**: Automated system health monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- npm 6.0.0 or higher
- MongoDB Atlas account
- Gemini AI API key
- Firebase project (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/surveillance-car.git
   cd surveillance-car
   ```

2. **Install dependencies**
   ```bash
   cd web_dashboard
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the dashboard**
   
   **Windows:**
   ```cmd
   start-dashboard.bat
   ```
   
   **Linux/Mac:**
   ```bash
   ./start-dashboard.sh
   ```

5. **Access the dashboard**
   Open your browser and navigate to `http://localhost:3000`

## 📋 Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_DAILY_LIMIT=1000

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### MongoDB Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

### Gemini AI Setup

1. Get your API key from Google AI Studio
2. Update the `GEMINI_API_KEY` in your `.env` file
3. Set your daily limit (default: 1000 requests)

### Firebase Setup (Optional)

1. Create a Firebase project
2. Enable Firestore
3. Generate a service account key
4. Update Firebase configuration in your `.env` file

## 🔧 Hardware Setup

### ESP32 Setup

1. **Install Arduino IDE**
2. **Install ESP32 board package**
3. **Upload the firmware** (`esp32_firmware/surveillance_car_complete.ino`)
4. **Connect hardware**:
   - Motors to pins 18, 23, 24, 25, 12, 16
   - IR sensors to pins 5, 6, 13
   - Ultrasonic sensor to pins 27, 17
   - Camera module (ESP32-CAM)

### Raspberry Pi Setup

1. **Install Python dependencies**:
   ```bash
   cd raspberry_pi_firmware
   pip install -r requirements.txt
   ```

2. **Run the firmware**:
   ```bash
   python main.py
   ```

3. **Hardware connections**:
   - GPIO pins for motors and sensors
   - Camera module (Pi Camera)
   - Microphone and speaker

## 📱 Mobile App (Flutter)

The system includes a Flutter mobile app for remote monitoring:

1. **Install Flutter SDK**
2. **Navigate to flutter_app directory**
3. **Install dependencies**:
   ```bash
   flutter pub get
   ```
4. **Run the app**:
   ```bash
   flutter run
   ```

## 🌐 API Endpoints

### System Status
- `GET /api/health` - Health check
- `GET /api/status` - System status
- `GET /api/sensors` - Sensor data
- `GET /api/config` - Configuration

### Control Commands
- `POST /api/control` - Send control commands
- `POST /api/device/select` - Select device type
- `POST /api/wifi/connect` - WiFi configuration

### AI Detection
- `POST /api/detect` - AI image analysis
- `GET /api/detections` - Detection history
- `POST /api/camera/capture` - Capture image

### Data Management
- `GET /api/events` - System events
- `GET /api/stats` - Usage statistics
- `POST /api/export` - Export data

## 🔌 WebSocket Events

### Client to Server
- `sensor_data` - Send sensor data
- `system_status` - Send system status
- `ai_detection` - Send AI detection results
- `control_command` - Send control commands

### Server to Client
- `sensor_update` - Sensor data updates
- `status_update` - System status updates
- `ai_detection_update` - AI detection updates
- `device_command` - Device control commands

## 📊 Data Models

### System Status
```javascript
{
  timestamp: Date,
  mode: String, // manual, autonomous, patrol, surveillance
  batteryLevel: Number, // 0-100
  batteryVoltage: Number,
  obstacleDetected: Boolean,
  isRunning: Boolean,
  uptime: Number,
  freeHeap: Number,
  cpuFreq: Number,
  wifiSSID: String,
  ipAddress: String,
  wifiSignal: Number,
  storageUsage: Number,
  connectedClients: Number,
  deviceType: String // esp32, raspberry_pi
}
```

### Sensor Data
```javascript
{
  timestamp: Date,
  irSensors: {
    left: Number,
    center: Number,
    right: Number
  },
  ultrasonicDistance: Number,
  batteryVoltage: Number,
  batteryPercentage: Number,
  leftMotorSpeed: Number,
  rightMotorSpeed: Number,
  motorDirection: String,
  obstacleDetected: Boolean
}
```

### AI Detection
```javascript
{
  timestamp: Date,
  detectedObjects: [String],
  confidence: Number, // 0-1
  alertLevel: String, // low, medium, high, critical
  description: String,
  boundingBoxes: [{
    object: String,
    confidence: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number
  }],
  imageData: String, // Base64
  processed: Boolean
}
```

## 🛠️ Development

### Project Structure
```
surveillance-car/
├── web_dashboard/          # Web dashboard
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── server.js          # Backend server
│   └── package.json       # Dependencies
├── esp32_firmware/        # ESP32 Arduino code
│   └── surveillance_car_complete.ino
├── raspberry_pi_firmware/ # Raspberry Pi Python code
│   ├── main.py
│   └── requirements.txt
├── flutter_app/           # Flutter mobile app
│   └── lib/
├── mongodb/               # Database models
│   └── models/
└── README.md
```

### Adding New Features

1. **Backend**: Add new routes in `server.js`
2. **Frontend**: Add new components in `js/` directory
3. **Database**: Update models in `mongodb/models/`
4. **Hardware**: Update firmware in respective directories

### Testing

1. **Unit Tests**: Run `npm test`
2. **Integration Tests**: Test API endpoints
3. **Hardware Tests**: Test with actual hardware
4. **Performance Tests**: Load testing with multiple clients

## 🔒 Security

### Authentication
- JWT tokens for API authentication
- Session management for web interface
- Role-based access control

### Data Protection
- HTTPS encryption for all communications
- Secure password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention

### Network Security
- CORS configuration
- Rate limiting
- Security headers (Helmet.js)
- IP whitelisting

## 📈 Monitoring & Analytics

### System Health
- Real-time system status monitoring
- Battery level tracking
- Network connectivity monitoring
- Performance metrics

### Usage Analytics
- API usage statistics
- Detection frequency analysis
- User activity tracking
- Error rate monitoring

### Alerts & Notifications
- Email notifications for critical events
- SMS alerts for emergency situations
- Push notifications for mobile app
- Telegram bot integration

## 🚀 Deployment

### Production Deployment

1. **Server Setup**:
   ```bash
   # Install Node.js and npm
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Application Deployment**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd surveillance-car/web_dashboard
   
   # Install dependencies
   npm install --production
   
   # Start with PM2
   pm2 start server.js --name surveillance-car
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t surveillance-car .
   docker run -p 3000:3000 surveillance-car
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Hardware Setup](docs/hardware.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

### Community
- [GitHub Issues](https://github.com/your-username/surveillance-car/issues)
- [Discord Server](https://discord.gg/your-server)
- [Email Support](mailto:support@surveillance-car.com)

### Professional Support
For enterprise support and custom development, contact:
- Email: enterprise@surveillance-car.com
- Phone: +1 (555) 123-4567

## 🙏 Acknowledgments

- **Google AI**: Gemini AI integration
- **MongoDB**: Database hosting
- **Firebase**: Real-time synchronization
- **ESP32 Community**: Hardware support
- **Raspberry Pi Foundation**: Hardware platform
- **Flutter Team**: Mobile app framework

## 📊 System Requirements

### Minimum Requirements
- **Server**: 2 CPU cores, 4GB RAM, 20GB storage
- **Network**: Stable internet connection
- **Hardware**: ESP32 or Raspberry Pi 4
- **Camera**: 720p or higher resolution
- **Storage**: 10GB for data and logs

### Recommended Requirements
- **Server**: 4 CPU cores, 8GB RAM, 50GB SSD
- **Network**: High-speed internet (100+ Mbps)
- **Hardware**: Raspberry Pi 4 with 8GB RAM
- **Camera**: 1080p with night vision
- **Storage**: 100GB SSD for optimal performance

---

**Built with ❤️ by the Surveillance Car Team**

*Professional IoT surveillance system with AI-powered detection and real-time monitoring.*
# Yahmi Security Rover - Complete Dashboard

A comprehensive security rover management system with advanced features including device testing, mapping, Firebase authentication, and real-time monitoring.

## 🚀 Features

### Core Features
- **Real-time Dashboard**: Live monitoring of rover status, sensors, and performance
- **Device Control**: Manual and autonomous control of the security rover
- **Video Streaming**: Live camera feed with recording capabilities
- **AI Detection**: Advanced object detection and threat analysis
- **Mapping System**: Interactive area mapping with waypoint management
- **Device Testing**: Comprehensive device simulation and connection testing

### Authentication & Security
- **Firebase Authentication**: Secure user login and registration
- **Role-based Access**: Different permission levels for users
- **Session Management**: Automatic login state handling
- **Password Security**: Secure password handling and validation

### Advanced Features
- **MongoDB Integration**: Complete data persistence and analytics
- **WebSocket Communication**: Real-time data streaming
- **Chart Visualization**: Performance metrics and trend analysis
- **Device Simulation**: Test rover functionality without hardware
- **Route Planning**: Create and manage patrol routes
- **Alert System**: Comprehensive notification system

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB Atlas account (or local MongoDB)
- Firebase project for authentication
- ESP32 or Raspberry Pi hardware (optional for simulation)

## 🛠️ Installation

### 1. Clone and Setup
```bash
cd web_dashboard
npm install
```

### 2. Environment Configuration
Copy `env.example` to `.env` and configure:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yahmi-rover

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop

# Device Configuration
ESP32_IP=192.168.1.100
RASPBERRY_PI_IP=192.168.1.101

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Update the Firebase configuration in `index.html` and `login.html`
4. Set up Firestore database (optional)

### 4. MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

## 🚀 Running the Application

### Windows
```bash
start-dashboard.bat
```

### Linux/Mac
```bash
./start-dashboard.sh
```

### Manual Start
```bash
node server.js
```

## 📱 Usage

### 1. Access the Dashboard
- Open browser to `http://localhost:3000`
- Login page: `http://localhost:3000/login.html`

### 2. Authentication
- **Login**: Use existing credentials
- **Register**: Create new account
- **Reset Password**: Password recovery (simulation)

### 3. Dashboard Features

#### Main Dashboard
- **System Status**: Real-time rover status
- **Sensor Data**: IR sensors, distance, battery
- **Performance Charts**: CPU, memory, and system metrics
- **Recent Activity**: System events and logs

#### Control Panel
- **Movement Control**: Manual rover control
- **Camera Feed**: Live video streaming
- **Audio Controls**: Alert sounds and notifications
- **Mode Selection**: Manual/Autonomous operation

#### Analytics & Reports
- **Device Testing**: Test connections and simulate devices
- **Mapping System**: Create and manage patrol routes
- **Performance Analytics**: Detailed system metrics
- **Detection Trends**: AI detection analysis

#### Settings
- **Device Configuration**: ESP32/Raspberry Pi settings
- **User Management**: Account settings and permissions
- **System Configuration**: Advanced system settings

## 🔧 Device Integration

### ESP32 Firmware
The ESP32 firmware provides:
- REST API endpoints for control
- Real-time sensor data
- Camera streaming
- Audio generation
- Motor control

### Raspberry Pi Firmware
The Raspberry Pi firmware includes:
- Flask web server
- Camera streaming
- Audio processing
- System monitoring
- GPIO control

## 🗺️ Mapping System

### Features
- **Interactive Map**: Click to add waypoints
- **Route Planning**: Create patrol routes
- **Area Mapping**: SLAM-based area exploration
- **Waypoint Management**: Add, edit, delete waypoints

### Usage
1. Click "Start Mapping" to begin area exploration
2. Add waypoints by clicking on the map
3. Create routes by connecting waypoints
4. Save and load map data

## 🧪 Device Testing

### Simulation Features
- **Device Status**: Real-time connection status
- **Connection Testing**: Test ESP32 and Raspberry Pi connections
- **Test Results**: Detailed test logs and results
- **Simulation Mode**: Test without physical hardware

### Testing Process
1. Click "Start Simulation" to begin testing
2. Use "Test Connection" to verify device connectivity
3. Monitor test results in real-time
4. Stop simulation when complete

## 📊 Analytics & Monitoring

### Performance Metrics
- **CPU Usage**: Real-time processor utilization
- **Memory Usage**: RAM consumption tracking
- **Network Status**: Connection quality monitoring
- **Battery Level**: Power management

### Detection Analytics
- **Object Detection**: AI-powered threat identification
- **Motion Detection**: Movement analysis
- **Alert Trends**: Security incident patterns
- **Performance Reports**: System efficiency metrics

## 🔐 Security Features

### Authentication
- **Firebase Integration**: Secure user authentication
- **Session Management**: Automatic login state handling
- **Password Security**: Encrypted password storage
- **Role-based Access**: Permission-based feature access

### Data Protection
- **MongoDB Security**: Encrypted data storage
- **API Security**: Rate limiting and validation
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Data sanitization

## 🚨 Troubleshooting

### Common Issues

#### Connection Problems
- Check device IP addresses in `.env`
- Verify network connectivity
- Ensure devices are powered on

#### Authentication Issues
- Verify Firebase configuration
- Check Firebase project settings
- Ensure authentication is enabled

#### Database Issues
- Verify MongoDB connection string
- Check network connectivity to MongoDB Atlas
- Ensure database permissions are correct

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## 📈 Performance Optimization

### Server Optimization
- **Compression**: Gzip compression enabled
- **Caching**: Static file caching
- **Rate Limiting**: API request limiting
- **Connection Pooling**: Database connection optimization

### Client Optimization
- **Lazy Loading**: On-demand resource loading
- **Image Optimization**: Compressed images and videos
- **Code Splitting**: Modular JavaScript loading
- **Caching**: Browser caching strategies

## 🔄 Updates and Maintenance

### Regular Maintenance
- **Database Cleanup**: Remove old logs and data
- **Security Updates**: Keep dependencies updated
- **Performance Monitoring**: Monitor system metrics
- **Backup Management**: Regular data backups

### Version Updates
```bash
npm update
npm audit fix
```

## 📞 Support

For technical support and questions:
- **Documentation**: Check this README and inline comments
- **Issues**: Report bugs and feature requests
- **Community**: Join the Yahmi Security Rover community

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎯 Roadmap

### Upcoming Features
- **Mobile App**: React Native mobile application
- **Advanced AI**: Enhanced object detection
- **Cloud Integration**: AWS/Azure deployment options
- **Multi-device Support**: Multiple rover management
- **Advanced Analytics**: Machine learning insights

---

**Yahmi Security Rover** - Advanced security monitoring and control system

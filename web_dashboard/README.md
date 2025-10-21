# ESP32 Surveillance Car Dashboard

A comprehensive web dashboard for controlling and monitoring an ESP32-based surveillance car with AI detection, patrol mode, and real-time monitoring.

## 🚀 Quick Start

### Option 1: Using Mock Server (Recommended for Testing)

1. **Windows Users:**
   ```bash
   # Double-click start-dashboard.bat
   # OR run in command prompt:
   start-dashboard.bat
   ```

2. **Linux/Mac Users:**
   ```bash
   chmod +x start-dashboard.sh
   ./start-dashboard.sh
   ```

3. **Manual Start:**
   ```bash
   npm install
   node mock-server.js
   ```

4. **Open Dashboard:**
   - Navigate to `http://localhost:3000` in your browser
   - The dashboard will load with mock data and simulated ESP32 responses

### Option 2: Direct File Access

1. **Simple HTTP Server:**
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   
   # Node.js
   npx http-server -p 8080
   ```

2. **Open Dashboard:**
   - Navigate to `http://localhost:8080` in your browser

## 🎯 Features

### ✅ **Completed Features**

- **🎨 Enhanced GUI** - Modern, responsive design with professional styling
- **📊 Real-time Dashboard** - Live monitoring of car status, sensors, and video feed
- **🤖 AI Detection** - Gemini AI integration for human/animal detection
- **🗺️ Interactive Map** - Real-time mapping with patrol routes and waypoints
- **🚗 Patrol Mode** - Automated surveillance with customizable routes
- **📧 Notifications** - Email and Telegram alerts for detections
- **📱 Mobile Responsive** - Works on all devices
- **🔄 WebSocket Communication** - Real-time data exchange with ESP32
- **📈 System Monitoring** - API status, logs, and health checks
- **🎮 Simulation Mode** - Test all features without physical hardware
- **⚡ Emergency Controls** - Emergency stop and system restart
- **💾 Data Storage** - Firebase integration for data persistence

### 🔧 **Technical Features**

- **Firebase Integration** - Cloud database for data storage
- **SMTP Notifications** - Email alerts for important events
- **Telegram Bot** - Instant messaging alerts
- **API Monitoring** - Real-time API health checks
- **System Logs** - Comprehensive logging system
- **Mock Server** - Development and testing without hardware
- **Error Handling** - Robust error handling and fallbacks
- **Offline Support** - Works without internet connection

## 📁 Project Structure

```
web_dashboard/
├── index.html              # Main dashboard page
├── settings.html           # Settings configuration
├── logs.html              # System logs viewer
├── map.html               # Interactive map
├── detections.html        # Detection history
├── css/
│   ├── style.css         # Main stylesheet
│   └── map.css           # Map-specific styles
├── js/
│   ├── dashboard.js      # Main dashboard logic
│   ├── api-monitor.js    # API monitoring
│   ├── system-logs.js    # Log management
│   ├── gemini-ai.js      # AI integration
│   ├── firebase-integration.js # Database
│   ├── smtp-notifications.js   # Email alerts
│   ├── telegram-bot.js   # Telegram integration
│   ├── simulation.js     # Simulation system
│   ├── interactive-map.js # Map functionality
│   ├── settings.js       # Settings management
│   └── detections.js     # Detection management
├── aws-deployment/        # AWS deployment files
├── mock-server.js        # Mock API server
├── package.json          # Dependencies
├── start-dashboard.bat   # Windows startup script
├── start-dashboard.sh    # Linux/Mac startup script
└── README.md            # This file
```

## 🎮 Dashboard Controls

### **Main Controls**
- **Movement** - Arrow keys or on-screen buttons
- **Speed Control** - Adjustable speed slider
- **Camera Settings** - Quality, brightness, contrast
- **Mode Selection** - Manual, Patrol, Surveillance

### **Patrol Mode**
- **Route Types** - Circular, Zigzag, Random, Custom
- **Duration** - Set patrol time (1-120 minutes)
- **Speed** - Adjustable patrol speed
- **Waypoints** - Save and load custom routes

### **Emergency Controls**
- **Emergency Stop** - Immediately stop all movement
- **System Restart** - Restart ESP32 remotely
- **Settings Reset** - Reset to default configuration

### **AI Detection**
- **Detection Types** - Human, Animal, Vehicle, Object
- **Confidence Levels** - Adjustable sensitivity
- **Alert Actions** - Sound alerts, notifications, recording

## 🔧 Configuration

### **ESP32 Settings**
```javascript
// Default ESP32 connection settings
const esp32IP = '192.168.1.100';
const esp32Port = '81';
```

### **Firebase Configuration**
```javascript
// Firebase config (set in settings)
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### **SMTP Settings**
```javascript
// Email notification settings
const smtpConfig = {
    host: "smtp.gmail.com",
    port: 587,
    user: "your-email@gmail.com",
    pass: "your-app-password"
};
```

### **Telegram Bot**
```javascript
// Telegram bot configuration
const telegramConfig = {
    botToken: "your-bot-token",
    chatId: "your-chat-id"
};
```

## 🚨 Troubleshooting

### **Common Issues**

1. **WebSocket Connection Failed**
   - Check ESP32 IP address in settings
   - Verify ESP32 is running and accessible
   - Check firewall settings

2. **Firebase Errors**
   - Verify Firebase configuration
   - Check internet connection
   - Ensure Firebase project is set up correctly

3. **AI Detection Not Working**
   - Check Gemini API key
   - Verify internet connection
   - Check browser console for errors

4. **Video Stream Not Loading**
   - Check ESP32 camera module
   - Verify video stream URL
   - Check network connectivity

### **Debug Mode**

Enable debug mode by opening browser console (F12) and checking for error messages.

## 📱 Mobile Usage

The dashboard is fully responsive and works on:
- **Smartphones** - Touch controls for movement
- **Tablets** - Optimized layout for larger screens
- **Desktop** - Full feature set with keyboard shortcuts

## 🔒 Security Features

- **HTTPS Support** - Secure connections
- **Input Validation** - All inputs are validated
- **Error Handling** - Graceful error handling
- **Access Control** - Configurable access restrictions

## 🚀 Deployment

### **Local Development**
```bash
# Start mock server
node mock-server.js

# Or use Python
python -m http.server 8080
```

### **Production Deployment**
See `aws-deployment/` folder for AWS deployment instructions.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check ESP32 serial output
4. Verify network connectivity

## 🎯 Next Steps

1. **Connect Real ESP32** - Replace mock server with actual ESP32
2. **Configure Firebase** - Set up your Firebase project
3. **Set up Notifications** - Configure email and Telegram
4. **Customize Settings** - Adjust to your specific needs
5. **Test Features** - Use simulation mode to test all features

## 📄 License

MIT License - See LICENSE file for details.

---

**🎉 Your ESP32 Surveillance Car Dashboard is ready to use!**

Start with the mock server to test all features, then connect your real ESP32 for live operation.

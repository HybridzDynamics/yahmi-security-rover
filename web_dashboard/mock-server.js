// Mock API Server for ESP32 Surveillance Dashboard
// This provides mock endpoints when the real ESP32 is not available

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockData = {
    detections: [
        {
            id: '1',
            type: 'human',
            confidence: 0.95,
            timestamp: new Date().toISOString(),
            location: { lat: 40.7128, lng: -74.0060 },
            imageUrl: 'https://via.placeholder.com/300x200?text=Human+Detection'
        },
        {
            id: '2',
            type: 'animal',
            confidence: 0.87,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            location: { lat: 40.7130, lng: -74.0058 },
            imageUrl: 'https://via.placeholder.com/300x200?text=Animal+Detection'
        }
    ],
    logs: [
        {
            id: '1',
            level: 'info',
            message: 'System started successfully',
            timestamp: new Date().toISOString(),
            source: 'system'
        },
        {
            id: '2',
            level: 'warning',
            message: 'Low battery detected',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            source: 'battery'
        }
    ],
    sensorData: {
        temperature: 25.5,
        humidity: 60.2,
        battery: 85,
        signal: 92,
        timestamp: new Date().toISOString()
    },
    systemStatus: {
        online: true,
        mode: 'patrol',
        speed: 5,
        position: { x: 100, y: 200 },
        timestamp: new Date().toISOString()
    }
};

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        ...mockData.systemStatus
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        healthy: true,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/detections', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const type = req.query.type;
    
    let detections = mockData.detections;
    
    if (type) {
        detections = detections.filter(d => d.type === type);
    }
    
    res.json(detections.slice(0, limit));
});

app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const level = req.query.level;
    
    let logs = mockData.logs;
    
    if (level) {
        logs = logs.filter(l => l.level === level);
    }
    
    res.json(logs.slice(0, limit));
});

app.get('/api/sensor-data', (req, res) => {
    res.json(mockData.sensorData);
});

app.get('/api/system-status', (req, res) => {
    res.json(mockData.systemStatus);
});

app.get('/api/firebase/config', (req, res) => {
    res.json({
        apiKey: "mock-api-key",
        authDomain: "mock-project.firebaseapp.com",
        projectId: "mock-project-id",
        storageBucket: "mock-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "mock-app-id"
    });
});

app.get('/api/gemini/key', (req, res) => {
    res.json({
        apiKey: "mock-gemini-key"
    });
});

app.get('/api/telegram/config', (req, res) => {
    res.json({
        botToken: "mock-bot-token",
        chatId: "mock-chat-id"
    });
});

app.get('/api/smtp/config', (req, res) => {
    res.json({
        host: "smtp.gmail.com",
        port: 587,
        user: "mock@example.com",
        secure: false
    });
});

app.get('/api/settings', (req, res) => {
    res.json({
        esp32_ip: "192.168.1.100",
        esp32_port: "81",
        auto_reconnect: true,
        reconnect_interval: 3000,
        notification_enabled: true,
        email_notifications: true,
        telegram_notifications: true
    });
});

// Control endpoints
app.post('/api/control/move', (req, res) => {
    const { direction, speed } = req.body;
    console.log(`Moving ${direction} at speed ${speed}`);
    res.json({ success: true, message: `Moving ${direction}` });
});

app.post('/api/control/stop', (req, res) => {
    console.log('Stopping vehicle');
    res.json({ success: true, message: 'Vehicle stopped' });
});

app.post('/api/control/restart', (req, res) => {
    console.log('Restarting ESP32');
    res.json({ success: true, message: 'ESP32 restart initiated' });
});

app.post('/api/control/patrol', (req, res) => {
    const { enabled, route } = req.body;
    console.log(`Patrol mode ${enabled ? 'enabled' : 'disabled'}`);
    res.json({ success: true, message: `Patrol mode ${enabled ? 'enabled' : 'disabled'}` });
});

// WebSocket simulation
app.get('/ws', (req, res) => {
    res.json({ message: 'WebSocket endpoint - use ws://localhost:3000/ws' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
    console.log(`📊 Available endpoints:`);
    console.log(`   GET  /api/status`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/detections`);
    console.log(`   GET  /api/logs`);
    console.log(`   GET  /api/sensor-data`);
    console.log(`   GET  /api/system-status`);
    console.log(`   GET  /api/firebase/config`);
    console.log(`   GET  /api/gemini/key`);
    console.log(`   GET  /api/telegram/config`);
    console.log(`   GET  /api/smtp/config`);
    console.log(`   GET  /api/settings`);
    console.log(`   POST /api/control/move`);
    console.log(`   POST /api/control/stop`);
    console.log(`   POST /api/control/restart`);
    console.log(`   POST /api/control/patrol`);
});

module.exports = app;

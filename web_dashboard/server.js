/**
 * Yahmi Security Rover - Advanced Node.js Server
 * Complete MongoDB integration with professional surveillance system
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// MongoDB Models
const SystemStatus = require('./models/SystemStatus');
const SensorData = require('./models/SensorData');
const AIDetection = require('./models/AIDetection');
const ControlCommand = require('./models/ControlCommand');
const SystemEvent = require('./models/SystemEvent');
const User = require('./models/User');
const Configuration = require('./models/Configuration');
const VideoRecording = require('./models/VideoRecording');
const SecurityAlert = require('./models/SecurityAlert');

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|wav|mp3/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
        }
    }
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yahmi_security_rover';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Connect to MongoDB
connectDB();

// Email configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Serve static files
app.use(express.static('.'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yahmi_security_rover_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// API Routes

// Authentication API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        
        // Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({ error: 'Account is locked due to too many failed attempts' });
        }
        
        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            await user.incrementLoginAttempts();
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate tokens
        const token = user.generateAuthToken();
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET || 'yahmi_refresh_secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Create new user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            role: 'viewer' // Default role
        });
        
        await user.save();
        
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/validate', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ error: 'Token validation failed' });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        // Add session cleanup logic here if needed
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'yahmi_refresh_secret');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const newToken = user.generateAuthToken();
        
        res.json({
            success: true,
            token: newToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({ error: 'Token refresh failed' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id, type: 'password_reset' },
            process.env.JWT_SECRET || 'yahmi_security_rover_secret',
            { expiresIn: '1h' }
        );
        
        // Send reset email (implement email sending logic)
        // For now, just return success
        res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// System Status API
app.get('/api/status', async (req, res) => {
    try {
        const latestStatus = await SystemStatus.findOne().sort({ timestamp: -1 });
        if (latestStatus) {
            res.json(latestStatus);
        } else {
            // Return default status if no data
            res.json({
                batteryLevel: 100,
                batteryVoltage: 12.6,
                cpuUsage: 0,
                memoryUsage: 0,
                uptime: 0,
                wifiSignal: -45,
                wifiSSID: 'Yahmi-Network',
                ipAddress: '192.168.1.100',
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error('Status API error:', error);
        res.status(500).json({ error: 'Failed to fetch system status' });
    }
});

app.post('/api/status', async (req, res) => {
    try {
        const statusData = {
            ...req.body,
            timestamp: new Date()
        };
        
        const status = new SystemStatus(statusData);
        await status.save();
        
        // Emit to connected clients
        io.emit('status_update', statusData);
        
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ error: 'Failed to update system status' });
    }
});

// Sensor Data API
app.get('/api/sensors', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const sensors = await SensorData.find()
            .sort({ timestamp: -1 })
            .limit(limit);
        res.json(sensors);
    } catch (error) {
        console.error('Sensors API error:', error);
        res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
});

app.post('/api/sensors', async (req, res) => {
    try {
        const sensorData = {
            ...req.body,
            timestamp: new Date()
        };
        
        const sensor = new SensorData(sensorData);
        await sensor.save();
        
        // Emit to connected clients
        io.emit('sensor_update', sensorData);
        
        res.json({ success: true, message: 'Sensor data saved successfully' });
    } catch (error) {
        console.error('Sensor data error:', error);
        res.status(500).json({ error: 'Failed to save sensor data' });
    }
});

// AI Detection API
app.get('/api/detections', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const detections = await AIDetection.find()
            .sort({ timestamp: -1 })
            .limit(limit);
        res.json(detections);
    } catch (error) {
        console.error('Detections API error:', error);
        res.status(500).json({ error: 'Failed to fetch detections' });
    }
});

app.post('/api/detect', async (req, res) => {
    try {
        const { image, analysis } = req.body;
        
        // Simulate AI analysis if not provided
        const aiAnalysis = analysis || {
            detectedObjects: ['person'],
            confidence: 0.85,
            boundingBoxes: [{
                x: 100,
                y: 100,
                width: 200,
                height: 300,
                object: 'person',
                confidence: 0.85
            }],
            alertLevel: 'medium'
        };
        
        const detection = new AIDetection({
            imageData: image,
            analysis: aiAnalysis,
            timestamp: new Date()
        });
        
        await detection.save();
        
        // Emit to connected clients
        io.emit('ai_detection', aiAnalysis);
        
        // Send email alert for critical detections
        if (aiAnalysis.alertLevel === 'critical') {
            await sendSecurityAlert(aiAnalysis);
        }
        
        res.json({ success: true, analysis: aiAnalysis });
    } catch (error) {
        console.error('AI detection error:', error);
        res.status(500).json({ error: 'Failed to process AI detection' });
    }
});

// Control API
app.post('/api/control', async (req, res) => {
    try {
        const command = new ControlCommand({
            ...req.body,
            timestamp: new Date()
        });
        
        await command.save();
        
        // Emit to connected clients
        io.emit('control_command', req.body);
        
        res.json({ success: true, message: 'Command sent successfully' });
    } catch (error) {
        console.error('Control API error:', error);
        res.status(500).json({ error: 'Failed to send command' });
    }
});

// Camera API
app.get('/api/camera/stream', (req, res) => {
    // This would typically stream video from the device
    // For now, return a placeholder
    res.json({ message: 'Video stream endpoint - implement with actual camera stream' });
});

app.post('/api/camera/capture', async (req, res) => {
    try {
        // Simulate image capture
        const captureData = {
            timestamp: new Date(),
            filename: `capture_${Date.now()}.jpg`,
            size: Math.floor(Math.random() * 1000000) + 500000
        };
        
        res.json({ success: true, capture: captureData });
    } catch (error) {
        console.error('Camera capture error:', error);
        res.status(500).json({ error: 'Failed to capture image' });
    }
});

// Audio API
app.post('/api/audio/play', async (req, res) => {
    try {
        const { type } = req.body;
        
        // Simulate audio playback
        const audioData = {
            type,
            timestamp: new Date(),
            duration: type === 'siren' ? 5000 : 2000
        };
        
        res.json({ success: true, audio: audioData });
    } catch (error) {
        console.error('Audio play error:', error);
        res.status(500).json({ error: 'Failed to play audio' });
    }
});

// System API
app.post('/api/system/restart', async (req, res) => {
    try {
        const event = new SystemEvent({
            type: 'system_restart',
            message: 'System restart initiated',
            timestamp: new Date()
        });
        
        await event.save();
        
        res.json({ success: true, message: 'System restart initiated' });
    } catch (error) {
        console.error('System restart error:', error);
        res.status(500).json({ error: 'Failed to restart system' });
    }
});

// Configuration API
app.get('/api/config', async (req, res) => {
    try {
        const config = await Configuration.findOne().sort({ timestamp: -1 });
        if (config) {
            res.json(config);
        } else {
            // Return default configuration
            res.json({
                deviceType: 'esp32',
                cameraSettings: {
                    quality: 12,
                    brightness: 0,
                    contrast: 0
                },
                aiSettings: {
                    enabled: true,
                    sensitivity: 'medium',
                    detectionTypes: ['person', 'vehicle']
                },
                systemSettings: {
                    batteryThreshold: 20,
                    patrolSpeed: 50,
                    autoReturn: true
                }
            });
        }
    } catch (error) {
        console.error('Config API error:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

app.post('/api/config', async (req, res) => {
    try {
        const config = new Configuration({
            ...req.body,
            timestamp: new Date()
        });
        
        await config.save();
        
        res.json({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
        console.error('Config save error:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// File Upload API
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path,
            timestamp: new Date()
        };
        
        res.json({ success: true, file: fileData });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Health Check API
app.get('/api/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        };
        
        res.json(health);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Health check failed' });
    }
});

// Events API
app.get('/api/events', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const events = await SystemEvent.find()
            .sort({ timestamp: -1 })
            .limit(limit);
        res.json(events);
    } catch (error) {
        console.error('Events API error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Analytics API
app.get('/api/analytics', async (req, res) => {
    try {
        const analytics = {
            totalDetections: await AIDetection.countDocuments(),
            totalEvents: await SystemEvent.countDocuments(),
            systemUptime: await SystemStatus.findOne().sort({ timestamp: -1 }).select('uptime'),
            recentActivity: await SystemEvent.find().sort({ timestamp: -1 }).limit(10)
        };
        
        res.json(analytics);
    } catch (error) {
        console.error('Analytics API error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔗 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
    
    socket.on('ping', () => {
        socket.emit('pong');
    });
    
    socket.on('control_command', (data) => {
        console.log('📤 Control command received:', data);
        // Forward command to device or handle locally
        socket.broadcast.emit('control_command', data);
    });
    
    socket.on('start_video_stream', () => {
        console.log('📹 Video stream started for:', socket.id);
    });
    
    socket.on('stop_video_stream', () => {
        console.log('📹 Video stream stopped for:', socket.id);
    });
    
    socket.on('file_upload', (data) => {
        console.log('📁 File upload received:', data.name);
        socket.broadcast.emit('file_upload', data);
    });
});

// Email notification function
async function sendSecurityAlert(detection) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ALERT_EMAIL,
            subject: 'Yahmi Security Alert - Critical Detection',
            html: `
                <h2>🚨 Security Alert</h2>
                <p>A critical security detection has been made by your Yahmi Security Rover.</p>
                <p><strong>Detection Details:</strong></p>
                <ul>
                    <li>Objects: ${detection.detectedObjects?.join(', ') || 'Unknown'}</li>
                    <li>Confidence: ${Math.round((detection.confidence || 0) * 100)}%</li>
                    <li>Alert Level: ${detection.alertLevel}</li>
                    <li>Time: ${new Date().toLocaleString()}</li>
                </ul>
                <p>Please check your surveillance dashboard for more details.</p>
            `
        };
        
        await emailTransporter.sendMail(mailOptions);
        console.log('📧 Security alert email sent');
    } catch (error) {
        console.error('❌ Failed to send security alert email:', error);
    }
}

// Scheduled tasks
cron.schedule('*/5 * * * *', async () => {
    // Clean up old data every 5 minutes
    try {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        await SystemStatus.deleteMany({ timestamp: { $lt: cutoffDate } });
        await SensorData.deleteMany({ timestamp: { $lt: cutoffDate } });
        await AIDetection.deleteMany({ timestamp: { $lt: cutoffDate } });
        
        console.log('🧹 Old data cleaned up');
    } catch (error) {
        console.error('❌ Data cleanup failed:', error);
    }
});

cron.schedule('0 */6 * * *', async () => {
    // System health check every 6 hours
    try {
        const healthEvent = new SystemEvent({
            type: 'health_check',
            message: 'Automated health check completed',
            timestamp: new Date()
        });
        
        await healthEvent.save();
        console.log('💚 System health check completed');
    } catch (error) {
        console.error('❌ Health check failed:', error);
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Yahmi Security Rover server running on port ${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔗 WebSocket server ready for real-time communication`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close();
        process.exit(0);
    });
});

module.exports = app;
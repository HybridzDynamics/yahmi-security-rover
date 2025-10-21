const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..'), {
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to ESP32 Surveillance Dashboard',
        timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received WebSocket message:', data);
            
            // Broadcast to all connected clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        ...data,
                        timestamp: new Date().toISOString()
                    }));
                }
            });
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    // Handle connection close
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`🚀 ESP32 Surveillance Dashboard Server running on http://${HOST}:${PORT}`);
    console.log(`📊 WebSocket server running on ws://${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = { app, server, wss };

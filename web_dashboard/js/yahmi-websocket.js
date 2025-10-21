/**
 * Yahmi Security Rover - WebSocket Communication Manager
 * Real-time bidirectional communication for surveillance system
 */

class YahmiWebSocket {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.heartbeatInterval = 30000;
        this.heartbeatTimer = null;
        
        this.eventHandlers = {
            connect: [],
            disconnect: [],
            error: [],
            sensor_update: [],
            status_update: [],
            ai_detection: [],
            ai_detection_update: [],
            video_frame: [],
            audio_data: [],
            system_alert: [],
            command_response: []
        };
        
        this.init();
    }

    init() {
        console.log('🔌 Initializing Yahmi WebSocket...');
        this.connect();
    }

    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            console.log('🔗 Connecting to:', wsUrl);
            
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectInterval,
                reconnectionDelayMax: 30000
            });
            
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            this.handleConnectionError(error);
        }
    }

    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to Yahmi server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.triggerEvent('connect', { timestamp: new Date() });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Disconnected from Yahmi server:', reason);
            this.isConnected = false;
            this.stopHeartbeat();
            this.triggerEvent('disconnect', { reason, timestamp: new Date() });
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.handleConnectionError(error);
        });

        // Data events
        this.socket.on('sensor_update', (data) => {
            console.log('📊 Sensor update received:', data);
            this.triggerEvent('sensor_update', data);
        });

        this.socket.on('status_update', (data) => {
            console.log('📈 Status update received:', data);
            this.triggerEvent('status_update', data);
        });

        this.socket.on('ai_detection', (data) => {
            console.log('🤖 AI detection received:', data);
            this.triggerEvent('ai_detection', data);
        });

        this.socket.on('ai_detection_update', (data) => {
            console.log('🔄 AI detection update received:', data);
            this.triggerEvent('ai_detection_update', data);
        });

        this.socket.on('video_frame', (data) => {
            this.triggerEvent('video_frame', data);
        });

        this.socket.on('audio_data', (data) => {
            this.triggerEvent('audio_data', data);
        });

        this.socket.on('system_alert', (data) => {
            console.log('🚨 System alert received:', data);
            this.triggerEvent('system_alert', data);
        });

        this.socket.on('command_response', (data) => {
            console.log('📨 Command response received:', data);
            this.triggerEvent('command_response', data);
        });

        // Heartbeat response
        this.socket.on('pong', () => {
            console.log('💓 Heartbeat received');
        });
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.socket.emit('ping');
            }
        }, this.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    handleConnectionError(error) {
        this.isConnected = false;
        this.stopHeartbeat();
        this.triggerEvent('error', { error, timestamp: new Date() });
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.error('❌ Max reconnection attempts reached');
        }
    }

    // Event handling
    on(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        } else {
            console.warn(`Unknown event: ${event}`);
        }
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            const index = this.eventHandlers[event].indexOf(handler);
            if (index > -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        }
    }

    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Command sending
    sendCommand(type, data) {
        if (!this.isConnected) {
            console.warn('⚠️ Not connected, command queued');
            this.queueCommand(type, data);
            return false;
        }

        try {
            const command = {
                type,
                data,
                timestamp: new Date().toISOString(),
                id: this.generateCommandId()
            };

            this.socket.emit('control_command', command);
            console.log('📤 Command sent:', command);
            return true;
        } catch (error) {
            console.error('❌ Failed to send command:', error);
            return false;
        }
    }

    sendMotorCommand(action, value = null) {
        return this.sendCommand('motor', { action, value });
    }

    sendCameraCommand(action, settings = {}) {
        return this.sendCommand('camera', { action, settings });
    }

    sendAudioCommand(action, type = 'alert') {
        return this.sendCommand('audio', { action, type });
    }

    sendAICommand(action, settings = {}) {
        return this.sendCommand('ai', { action, settings });
    }

    sendSystemCommand(action, data = {}) {
        return this.sendCommand('system', { action, data });
    }

    // Command queuing for offline scenarios
    commandQueue = [];

    queueCommand(type, data) {
        this.commandQueue.push({ type, data, timestamp: new Date() });
        console.log('📝 Command queued:', { type, data });
    }

    processCommandQueue() {
        if (this.isConnected && this.commandQueue.length > 0) {
            console.log(`📤 Processing ${this.commandQueue.length} queued commands`);
            
            while (this.commandQueue.length > 0) {
                const command = this.commandQueue.shift();
                this.sendCommand(command.type, command.data);
            }
        }
    }

    // Utility methods
    generateCommandId() {
        return 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            queuedCommands: this.commandQueue.length,
            socketId: this.socket?.id || null
        };
    }

    // Data streaming
    startVideoStream() {
        if (this.isConnected) {
            this.socket.emit('start_video_stream');
        }
    }

    stopVideoStream() {
        if (this.isConnected) {
            this.socket.emit('stop_video_stream');
        }
    }

    startAudioStream() {
        if (this.isConnected) {
            this.socket.emit('start_audio_stream');
        }
    }

    stopAudioStream() {
        if (this.isConnected) {
            this.socket.emit('stop_audio_stream');
        }
    }

    // File transfer
    sendFile(file, metadata = {}) {
        if (!this.isConnected) {
            console.warn('⚠️ Not connected, cannot send file');
            return false;
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    metadata,
                    timestamp: new Date().toISOString()
                };

                this.socket.emit('file_upload', data);
                console.log('📁 File sent:', file.name);
            };

            reader.readAsDataURL(file);
            return true;
        } catch (error) {
            console.error('❌ Failed to send file:', error);
            return false;
        }
    }

    // Configuration
    updateConfiguration(config) {
        if (this.isConnected) {
            this.socket.emit('update_config', config);
        }
    }

    requestConfiguration() {
        if (this.isConnected) {
            this.socket.emit('request_config');
        }
    }

    // System monitoring
    requestSystemStatus() {
        if (this.isConnected) {
            this.socket.emit('request_status');
        }
    }

    requestSensorData() {
        if (this.isConnected) {
            this.socket.emit('request_sensors');
        }
    }

    requestLogs(level = 'all', limit = 100) {
        if (this.isConnected) {
            this.socket.emit('request_logs', { level, limit });
        }
    }

    // Emergency controls
    emergencyStop() {
        if (this.isConnected) {
            this.socket.emit('emergency_stop');
        }
    }

    emergencyReturn() {
        if (this.isConnected) {
            this.socket.emit('emergency_return');
        }
    }

    // Cleanup
    disconnect() {
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }

    destroy() {
        this.disconnect();
        this.eventHandlers = {};
        this.commandQueue = [];
    }
}

// Initialize WebSocket when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.yahmiWebSocket = new YahmiWebSocket();
    
    // Process queued commands when connected
    window.yahmiWebSocket.on('connect', () => {
        window.yahmiWebSocket.processCommandQueue();
    });
});

/**
 * Yahmi Security Rover - Device Communication Manager
 * Handles communication with ESP32 and Raspberry Pi devices
 */

class YahmiDevice {
    constructor() {
        this.deviceType = localStorage.getItem('yahmiDeviceType') || 'esp32';
        this.deviceIP = localStorage.getItem('yahmiDeviceIP') || '192.168.1.100';
        this.devicePort = localStorage.getItem('yahmiDevicePort') || '80';
        this.baseUrl = `http://${this.deviceIP}:${this.devicePort}`;
        this.isConnected = false;
        this.lastPing = null;
        this.pingInterval = 5000;
        this.pingTimer = null;
        
        this.init();
    }

    init() {
        console.log('🔧 Initializing Yahmi Device Communication...');
        this.startPing();
    }

    // Device configuration
    setDevice(type, ip, port = 80) {
        this.deviceType = type;
        this.deviceIP = ip;
        this.devicePort = port;
        this.baseUrl = `http://${ip}:${port}`;
        
        // Save to localStorage
        localStorage.setItem('yahmiDeviceType', type);
        localStorage.setItem('yahmiDeviceIP', ip);
        localStorage.setItem('yahmiDevicePort', port);
        
        console.log(`🔧 Device configured: ${type} at ${ip}:${port}`);
    }

    getDeviceInfo() {
        return {
            type: this.deviceType,
            ip: this.deviceIP,
            port: this.devicePort,
            baseUrl: this.baseUrl,
            connected: this.isConnected,
            lastPing: this.lastPing
        };
    }

    // Connection management
    async ping() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`, {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                this.isConnected = true;
                this.lastPing = new Date();
                return true;
            } else {
                this.isConnected = false;
                return false;
            }
        } catch (error) {
            this.isConnected = false;
            console.warn('Device ping failed:', error);
            return false;
        }
    }

    startPing() {
        this.pingTimer = setInterval(async () => {
            await this.ping();
        }, this.pingInterval);
    }

    stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    // HTTP communication
    async deviceFetch(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error(`Device fetch failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // System status
    async getSystemStatus() {
        try {
            return await this.deviceFetch('/api/status');
        } catch (error) {
            console.error('Failed to get system status:', error);
            throw error;
        }
    }

    async getSystemData() {
        try {
            return await this.deviceFetch('/api/data');
        } catch (error) {
            console.error('Failed to get system data:', error);
            throw error;
        }
    }

    // Sensor data
    async getSensorData(limit = 1) {
        try {
            return await this.deviceFetch(`/api/sensors?limit=${limit}`);
        } catch (error) {
            console.error('Failed to get sensor data:', error);
            throw error;
        }
    }

    async getLatestSensorData() {
        try {
            const data = await this.getSensorData(1);
            return data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Failed to get latest sensor data:', error);
            throw error;
        }
    }

    // Motor control
    async sendMotorCommand(action, value = null) {
        try {
            const command = {
                command: 'motor',
                action: action,
                value: value
            };
            
            return await this.deviceFetch('/api/control', {
                method: 'POST',
                body: JSON.stringify(command)
            });
        } catch (error) {
            console.error('Motor command failed:', error);
            throw error;
        }
    }

    async moveForward(speed = 50) {
        return await this.sendMotorCommand('forward', speed);
    }

    async moveBackward(speed = 50) {
        return await this.sendMotorCommand('backward', speed);
    }

    async turnLeft(speed = 50) {
        return await this.sendMotorCommand('left', speed);
    }

    async turnRight(speed = 50) {
        return await this.sendMotorCommand('right', speed);
    }

    async stop() {
        return await this.sendMotorCommand('stop');
    }

    async setSpeed(speed) {
        return await this.sendMotorCommand('speed', speed);
    }

    // Camera control
    async captureImage() {
        try {
            return await this.deviceFetch('/api/camera/capture', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Image capture failed:', error);
            throw error;
        }
    }

    async startRecording() {
        try {
            return await this.deviceFetch('/api/camera/start_recording', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Recording start failed:', error);
            throw error;
        }
    }

    async stopRecording() {
        try {
            return await this.deviceFetch('/api/camera/stop_recording', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Recording stop failed:', error);
            throw error;
        }
    }

    async updateCameraSettings(settings) {
        try {
            return await this.deviceFetch('/api/camera/settings', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('Camera settings update failed:', error);
            throw error;
        }
    }

    // Audio control
    async playAudio(type) {
        try {
            return await this.deviceFetch('/api/audio/play', {
                method: 'POST',
                body: JSON.stringify({ type })
            });
        } catch (error) {
            console.error('Audio play failed:', error);
            throw error;
        }
    }

    async playAlert() {
        return await this.playAudio('alert');
    }

    async playSiren() {
        return await this.playAudio('siren');
    }

    async playLowPitch() {
        return await this.playAudio('low_pitch');
    }

    // AI control
    async toggleAI(enabled) {
        try {
            return await this.deviceFetch('/api/ai/toggle', {
                method: 'POST',
                body: JSON.stringify({ enabled })
            });
        } catch (error) {
            console.error('AI toggle failed:', error);
            throw error;
        }
    }

    async updateAISettings(settings) {
        try {
            return await this.deviceFetch('/api/ai/settings', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('AI settings update failed:', error);
            throw error;
        }
    }

    async analyzeImage(imageData) {
        try {
            return await this.deviceFetch('/api/ai/analyze', {
                method: 'POST',
                body: JSON.stringify({ image: imageData })
            });
        } catch (error) {
            console.error('Image analysis failed:', error);
            throw error;
        }
    }

    // System control
    async restartSystem() {
        try {
            return await this.deviceFetch('/api/system/restart', {
                method: 'POST'
            });
        } catch (error) {
            console.error('System restart failed:', error);
            throw error;
        }
    }

    async shutdownSystem() {
        try {
            return await this.deviceFetch('/api/system/shutdown', {
                method: 'POST'
            });
        } catch (error) {
            console.error('System shutdown failed:', error);
            throw error;
        }
    }

    async getSystemLogs(level = 'all', limit = 100) {
        try {
            return await this.deviceFetch(`/api/logs?level=${level}&limit=${limit}`);
        } catch (error) {
            console.error('Failed to get system logs:', error);
            throw error;
        }
    }

    // Configuration
    async getConfiguration() {
        try {
            return await this.deviceFetch('/api/config');
        } catch (error) {
            console.error('Failed to get configuration:', error);
            throw error;
        }
    }

    async updateConfiguration(config) {
        try {
            return await this.deviceFetch('/api/config', {
                method: 'POST',
                body: JSON.stringify(config)
            });
        } catch (error) {
            console.error('Configuration update failed:', error);
            throw error;
        }
    }

    // Mode control
    async setMode(mode) {
        try {
            return await this.deviceFetch('/api/mode', {
                method: 'POST',
                body: JSON.stringify({ mode })
            });
        } catch (error) {
            console.error('Mode change failed:', error);
            throw error;
        }
    }

    async setManualMode() {
        return await this.setMode('manual');
    }

    async setAutonomousMode() {
        return await this.setMode('autonomous');
    }

    async setPatrolMode() {
        return await this.setMode('patrol');
    }

    async setSurveillanceMode() {
        return await this.setMode('surveillance');
    }

    // Emergency controls
    async emergencyStop() {
        try {
            return await this.deviceFetch('/api/emergency/stop', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Emergency stop failed:', error);
            throw error;
        }
    }

    async emergencyReturn() {
        try {
            return await this.deviceFetch('/api/emergency/return', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Emergency return failed:', error);
            throw error;
        }
    }

    // Data streaming
    getVideoStreamUrl() {
        return `${this.baseUrl}/api/camera/stream`;
    }

    getAudioStreamUrl() {
        return `${this.baseUrl}/api/audio/stream`;
    }

    // File operations
    async uploadFile(file, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify(metadata));
            
            return await this.deviceFetch('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            });
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    async downloadFile(filename) {
        try {
            const response = await fetch(`${this.baseUrl}/api/files/${filename}`);
            if (response.ok) {
                return await response.blob();
            } else {
                throw new Error(`Download failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('File download failed:', error);
            throw error;
        }
    }

    async getFileList() {
        try {
            return await this.deviceFetch('/api/files');
        } catch (error) {
            console.error('Failed to get file list:', error);
            throw error;
        }
    }

    // Health monitoring
    async getHealthStatus() {
        try {
            return await this.deviceFetch('/api/health');
        } catch (error) {
            console.error('Failed to get health status:', error);
            throw error;
        }
    }

    async getPerformanceMetrics() {
        try {
            return await this.deviceFetch('/api/performance');
        } catch (error) {
            console.error('Failed to get performance metrics:', error);
            throw error;
        }
    }

    // Utility methods
    async testConnection() {
        try {
            const start = Date.now();
            await this.ping();
            const latency = Date.now() - start;
            return { success: true, latency };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getDeviceCapabilities() {
        try {
            return await this.deviceFetch('/api/capabilities');
        } catch (error) {
            console.error('Failed to get device capabilities:', error);
            throw error;
        }
    }

    // Cleanup
    destroy() {
        this.stopPing();
    }
}

// Initialize device communication when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.yahmiDevice = new YahmiDevice();
});

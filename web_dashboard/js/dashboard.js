// Main Dashboard JavaScript

class DashboardManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.currentMode = 'manual';
        this.isRecording = false;
        this.autoReconnect = true;
        this.reconnectInterval = 5000;
        this.heartbeatInterval = 30000;
        
        // AI Detection
        this.aiEnabled = false;
        this.detectionMode = 'animal';
        this.detectionThreshold = 0.5;
        
        // System data
        this.systemData = {
            battery: 0,
            cpuFreq: 0,
            freeHeap: 0,
            uptime: 0,
            storageUsage: 0,
            wifiSSID: 'Unknown',
            wifiSignal: 0
        };
        
        this.sensorData = {
            ir: [0, 0, 0],
            distance: 0,
            batteryVoltage: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.startHeartbeat();
        this.hideLoadingOverlay();
        this.loadSettings();
    }

    setupEventListeners() {
        // Mode selection
        document.getElementById('manualMode')?.addEventListener('click', () => this.setMode('manual'));
        document.getElementById('autonomousMode')?.addEventListener('click', () => this.setMode('autonomous'));
        document.getElementById('patrolMode')?.addEventListener('click', () => this.setMode('patrol'));
        document.getElementById('surveillanceMode')?.addEventListener('click', () => this.setMode('surveillance'));

        // Motor controls
        document.getElementById('forwardBtn')?.addEventListener('click', () => this.sendMotorCommand('forward'));
        document.getElementById('backwardBtn')?.addEventListener('click', () => this.sendMotorCommand('backward'));
        document.getElementById('leftBtn')?.addEventListener('click', () => this.sendMotorCommand('left'));
        document.getElementById('rightBtn')?.addEventListener('click', () => this.sendMotorCommand('right'));
        document.getElementById('stopBtn')?.addEventListener('click', () => this.sendMotorCommand('stop'));

        // Speed control
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                document.getElementById('speedValue').textContent = e.target.value;
                this.sendMotorCommand('speed', parseInt(e.target.value));
            });
        }

        // Camera controls
        document.getElementById('captureBtn')?.addEventListener('click', () => this.captureImage());
        document.getElementById('recordBtn')?.addEventListener('click', () => this.toggleRecording());
        document.getElementById('aiToggleBtn')?.addEventListener('click', () => this.toggleAIDetection());

        // Camera settings
        const qualitySlider = document.getElementById('qualitySlider');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                document.getElementById('qualityValue').textContent = e.target.value;
                this.sendCameraCommand('quality', parseInt(e.target.value));
            });
        }

        const brightnessSlider = document.getElementById('brightnessSlider');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                document.getElementById('brightnessValue').textContent = e.target.value;
                this.sendCameraCommand('brightness', parseInt(e.target.value));
            });
        }

        const contrastSlider = document.getElementById('contrastSlider');
        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                document.getElementById('contrastValue').textContent = e.target.value;
                this.sendCameraCommand('contrast', parseInt(e.target.value));
            });
        }

        // Audio controls
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                document.getElementById('volumeValue').textContent = e.target.value;
                this.sendAudioCommand('volume', parseInt(e.target.value));
            });
        }

        document.getElementById('playAlertBtn')?.addEventListener('click', () => this.sendAudioCommand('play', 2));
        document.getElementById('playSirenBtn')?.addEventListener('click', () => this.sendAudioCommand('play', 3));

        // System controls
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restartSystem());
        document.getElementById('apiStatusBtn')?.addEventListener('click', () => this.showApiStatus());

        // AI controls
        document.getElementById('aiEnabled')?.addEventListener('change', (e) => this.toggleAI(e.target.checked));
        document.querySelectorAll('input[name="detectionMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.setDetectionMode(e.target.value));
        });

        // Detection alert actions
        document.getElementById('playLowPitchBtn')?.addEventListener('click', () => this.playLowPitch());
        document.getElementById('playSirenBtn')?.addEventListener('click', () => this.playSiren());
        document.getElementById('continueSurveillanceBtn')?.addEventListener('click', () => this.continueSurveillance());

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));

        // Touch controls for mobile
        this.setupTouchControls();
        
        // Initialize new features
        this.initializePatrolMode();
        this.initializeEmergencyControls();
        this.initializeStatusIndicators();
    }

    connectWebSocket() {
        // Try to get ESP32 IP from settings or use default
        const esp32IP = localStorage.getItem('esp32_ip') || '192.168.1.100';
        const esp32Port = localStorage.getItem('esp32_port') || '81';
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${esp32IP}:${esp32Port}`;
        
        console.log('Attempting WebSocket connection to:', wsUrl);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                this.hideLoadingOverlay();
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                this.showLoadingOverlay('Connection lost. Reconnecting...');
                
                if (this.autoReconnect) {
                    setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showAlert('Connection Error', 'Failed to connect to surveillance car. Please check the connection.');
                
                // If WebSocket fails, try HTTP polling as fallback
                this.startHTTPPolling();
            };

        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.showAlert('Connection Error', 'Failed to connect to surveillance car. Please check the connection.');
            
            // Start HTTP polling as fallback
            this.startHTTPPolling();
        }
    }
    
    startHTTPPolling() {
        console.log('Starting HTTP polling as fallback...');
        this.isPolling = true;
        this.pollingInterval = setInterval(() => {
            this.pollESP32Data();
        }, 2000); // Poll every 2 seconds
    }
    
    stopHTTPPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.isPolling = false;
        }
    }
    
    async pollESP32Data() {
        try {
            const esp32IP = localStorage.getItem('esp32_ip') || '192.168.1.100';
            const response = await fetch(`http://${esp32IP}/api/status`);
            
            if (response.ok) {
                const data = await response.json();
                this.handleWebSocketMessage(JSON.stringify(data));
            }
        } catch (error) {
            console.warn('HTTP polling failed:', error);
        }
    }

    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'status':
                    this.updateSystemStatus(message);
                    break;
                case 'sensor_data':
                    this.updateSensorData(message);
                    break;
                case 'ai_detection':
                    this.handleAIDetection(message);
                    break;
                case 'alert':
                    this.showAlert('System Alert', message.message);
                    break;
                case 'welcome':
                    console.log('Connected to surveillance car');
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    handleAIDetection(data) {
        const { detection, confidence, boundingBox } = data;
        
        // Show detection overlay
        this.showDetectionOverlay(boundingBox, detection, confidence);
        
        // Add to detection history
        this.addDetectionToHistory(detection, confidence);
        
        // Show alert modal
        this.showDetectionAlert(detection, confidence);
    }

    showDetectionOverlay(boundingBox, detection, confidence) {
        const overlay = document.getElementById('aiDetectionOverlay');
        const box = document.getElementById('detectionBox');
        const label = document.getElementById('detectionLabel');
        
        if (boundingBox && box && label) {
            box.style.left = boundingBox.x + 'px';
            box.style.top = boundingBox.y + 'px';
            box.style.width = boundingBox.width + 'px';
            box.style.height = boundingBox.height + 'px';
            box.style.display = 'block';
            
            label.textContent = `${detection} (${Math.round(confidence * 100)}%)`;
            label.style.left = boundingBox.x + 'px';
            label.style.top = (boundingBox.y - 25) + 'px';
            label.style.display = 'block';
        }
        
        // Hide after 3 seconds
        setTimeout(() => {
            if (box) box.style.display = 'none';
            if (label) label.style.display = 'none';
        }, 3000);
    }

    addDetectionToHistory(detection, confidence) {
        const detectionList = document.getElementById('detectionList');
        if (!detectionList) return;
        
        const detectionItem = document.createElement('div');
        detectionItem.className = `detection-item ${detection}`;
        
        const timestamp = new Date().toLocaleTimeString();
        detectionItem.innerHTML = `
            <div class="detection-info">
                <strong>${detection.toUpperCase()}</strong>
                <span class="confidence">${Math.round(confidence * 100)}%</span>
            </div>
            <div class="detection-time">${timestamp}</div>
        `;
        
        detectionList.insertBefore(detectionItem, detectionList.firstChild);
        
        // Keep only last 10 detections
        while (detectionList.children.length > 10) {
            detectionList.removeChild(detectionList.lastChild);
        }
    }

    showDetectionAlert(detection, confidence) {
        const modal = document.getElementById('detectionAlertModal');
        const title = document.getElementById('detectionAlertTitle');
        const message = document.getElementById('detectionAlertMessage');
        
        if (modal && title && message) {
            title.textContent = `${detection.toUpperCase()} Detected!`;
            message.textContent = `A ${detection} has been detected with ${Math.round(confidence * 100)}% confidence.`;
            modal.style.display = 'block';
        }
    }

    // AI Detection Methods
    toggleAI(enabled) {
        this.aiEnabled = enabled;
        this.updateAIStatus();
        
        if (enabled) {
            this.startAIDetection();
        } else {
            this.stopAIDetection();
        }
    }

    setDetectionMode(mode) {
        this.detectionMode = mode;
        console.log('Detection mode set to:', mode);
    }

    async startAIDetection() {
        this.sendWebSocketMessage({
            type: 'ai_control',
            action: 'start',
            mode: this.detectionMode,
            threshold: this.detectionThreshold
        });
    }

    stopAIDetection() {
        this.sendWebSocketMessage({
            type: 'ai_control',
            action: 'stop'
        });
    }

    updateAIStatus() {
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            if (this.aiEnabled) {
                aiStatus.className = 'status-indicator ai-active';
                aiStatus.querySelector('span').textContent = 'AI: On';
            } else {
                aiStatus.className = 'status-indicator ai-inactive';
                aiStatus.querySelector('span').textContent = 'AI: Off';
            }
        }
    }

    // Detection Alert Actions
    playLowPitch() {
        this.sendAudioCommand('play', 2); // Low pitch sound
        this.closeModal(document.getElementById('detectionAlertModal'));
    }

    playSiren() {
        this.sendAudioCommand('play', 3); // Siren sound
        this.closeModal(document.getElementById('detectionAlertModal'));
    }

    continueSurveillance() {
        this.closeModal(document.getElementById('detectionAlertModal'));
    }

    // Utility Methods
    closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    showAlert(title, message) {
        const modal = document.getElementById('alertModal');
        const titleElement = document.getElementById('alertTitle');
        const messageElement = document.getElementById('alertMessage');
        
        if (modal && titleElement && messageElement) {
            titleElement.textContent = title;
            messageElement.textContent = message;
            modal.style.display = 'block';
        }
    }

    hideAlert() {
        const modal = document.getElementById('alertModal');
        if (modal) modal.style.display = 'none';
    }

    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay?.querySelector('p');
        if (overlay) {
            if (text) text.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // Rest of the existing methods...
    sendWebSocketMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const modeBtn = document.getElementById(mode + 'Mode');
        if (modeBtn) modeBtn.classList.add('active');
        
        // Send command
        this.sendWebSocketMessage({
            type: 'control',
            command: 'mode',
            value: mode
        });
        
        console.log('Mode changed to:', mode);
    }

    sendMotorCommand(action, value = null) {
        if (this.currentMode !== 'manual') {
            this.showAlert('Mode Error', 'Please switch to manual mode to control motors.');
            return;
        }

        const command = {
            type: 'control',
            command: 'motor',
            action: action
        };

        if (value !== null) {
            command.value = value;
        }

        this.sendWebSocketMessage(command);
        console.log('Motor command:', action, value);
    }

    sendCameraCommand(action, value) {
        this.sendWebSocketMessage({
            type: 'control',
            command: 'camera',
            action: action,
            value: value
        });
        console.log('Camera command:', action, value);
    }

    sendAudioCommand(action, value) {
        this.sendWebSocketMessage({
            type: 'control',
            command: 'audio',
            action: action,
            value: value
        });
        console.log('Audio command:', action, value);
    }

    captureImage() {
        this.sendCameraCommand('capture', 0);
        this.showAlert('Image Capture', 'Image captured successfully!');
    }

    toggleRecording() {
        this.isRecording = !this.isRecording;
        const recordBtn = document.getElementById('recordBtn');
        
        if (recordBtn) {
            if (this.isRecording) {
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                recordBtn.classList.add('recording');
                this.sendCameraCommand('start', 0);
            } else {
                recordBtn.innerHTML = '<i class="fas fa-video"></i> Record';
                recordBtn.classList.remove('recording');
                this.sendCameraCommand('stop', 0);
            }
        }
    }

    toggleAIDetection() {
        const aiEnabled = document.getElementById('aiEnabled');
        if (aiEnabled) {
            this.toggleAI(aiEnabled.checked);
        }
    }

    async restartSystem() {
        if (confirm('Are you sure you want to restart the surveillance car system?')) {
            this.sendWebSocketMessage({
                type: 'control',
                command: 'system',
                action: 'restart',
                value: 0
            });
            this.showAlert('System Restart', 'System is restarting. Please wait...');
        }
    }

    async showApiStatus() {
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                const data = await response.json();
                this.showAlert('API Status', `System: ${data.system}\nVersion: ${data.version}\nUptime: ${Math.floor(data.uptime / 1000)}s\nFree Heap: ${data.freeHeap} bytes`);
            } else {
                throw new Error('Failed to fetch API status');
            }
        } catch (error) {
            this.showAlert('API Error', 'Failed to fetch API status: ' + error.message);
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            const icon = statusElement.querySelector('i');
            const text = statusElement.querySelector('span');

            if (connected) {
                statusElement.className = 'status-indicator connected';
                if (icon) icon.className = 'fas fa-wifi';
                if (text) text.textContent = 'Connected';
            } else {
                statusElement.className = 'status-indicator disconnected';
                if (icon) icon.className = 'fas fa-wifi';
                if (text) text.textContent = 'Disconnected';
            }
        }
    }

    updateSystemStatus(data) {
        // Update battery status
        if (data.battery !== undefined) {
            this.updateBatteryStatus(data.battery);
        }

        // Update system info
        if (data.uptime !== undefined) {
            const uptimeElement = document.getElementById('uptime');
            if (uptimeElement) uptimeElement.textContent = Math.floor(data.uptime / 1000);
        }

        if (data.freeHeap !== undefined) {
            const freeHeapElement = document.getElementById('freeHeap');
            if (freeHeapElement) freeHeapElement.textContent = data.freeHeap.toLocaleString();
        }

        if (data.cpuFreq !== undefined) {
            const cpuFreqElement = document.getElementById('cpuFreq');
            if (cpuFreqElement) cpuFreqElement.textContent = data.cpuFreq;
        }

        if (data.wifiSSID !== undefined) {
            const wifiSSIDElement = document.getElementById('wifiSSID');
            if (wifiSSIDElement) wifiSSIDElement.textContent = data.wifiSSID;
        }

        if (data.wifiSignal !== undefined) {
            const wifiSignalElement = document.getElementById('wifiSignal');
            if (wifiSignalElement) wifiSignalElement.textContent = data.wifiSignal;
        }

        // Update mode
        if (data.mode !== undefined) {
            this.currentMode = data.mode;
            this.setMode(this.currentMode);
        }
    }

    updateSensorData(data) {
        // Update IR sensors
        if (data.ir !== undefined) {
            const irLeftElement = document.getElementById('irLeft');
            const irCenterElement = document.getElementById('irCenter');
            const irRightElement = document.getElementById('irRight');
            
            if (irLeftElement) irLeftElement.textContent = data.ir[0] || 0;
            if (irCenterElement) irCenterElement.textContent = data.ir[1] || 0;
            if (irRightElement) irRightElement.textContent = data.ir[2] || 0;
        }

        // Update ultrasonic sensor
        if (data.distance !== undefined) {
            const distanceElement = document.getElementById('distance');
            if (distanceElement) distanceElement.textContent = data.distance.toFixed(1);
        }

        // Update battery voltage
        if (data.batteryVoltage !== undefined) {
            const batteryVoltageElement = document.getElementById('batteryVoltage');
            if (batteryVoltageElement) batteryVoltageElement.textContent = data.batteryVoltage.toFixed(1);
        }
    }

    updateBatteryStatus(percentage) {
        const batteryElement = document.getElementById('batteryStatus');
        if (batteryElement) {
            const icon = batteryElement.querySelector('i');
            const text = batteryElement.querySelector('span');

            if (text) text.textContent = percentage + '%';

            if (percentage > 50) {
                batteryElement.className = 'status-indicator connected';
                if (icon) icon.className = 'fas fa-battery-full';
            } else if (percentage > 20) {
                batteryElement.className = 'status-indicator low-battery';
                if (icon) icon.className = 'fas fa-battery-half';
            } else {
                batteryElement.className = 'status-indicator disconnected';
                if (icon) icon.className = 'fas fa-battery-empty';
            }
        }
    }

    startHeartbeat() {
        setInterval(() => {
            if (this.isConnected) {
                this.sendWebSocketMessage({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, this.heartbeatInterval);
    }

    handleKeyPress(event) {
        if (this.currentMode !== 'manual') return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                event.preventDefault();
                this.sendMotorCommand('forward');
                break;
            case 'ArrowDown':
            case 'KeyS':
                event.preventDefault();
                this.sendMotorCommand('backward');
                break;
            case 'ArrowLeft':
            case 'KeyA':
                event.preventDefault();
                this.sendMotorCommand('left');
                break;
            case 'ArrowRight':
            case 'KeyD':
                event.preventDefault();
                this.sendMotorCommand('right');
                break;
            case 'Space':
                event.preventDefault();
                this.sendMotorCommand('stop');
                break;
        }
    }

    handleKeyRelease(event) {
        if (this.currentMode !== 'manual') return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'ArrowDown':
            case 'KeyS':
            case 'ArrowLeft':
            case 'KeyA':
            case 'ArrowRight':
            case 'KeyD':
                event.preventDefault();
                this.sendMotorCommand('stop');
                break;
        }
    }

    setupTouchControls() {
        const controlBtns = document.querySelectorAll('.control-btn');
        
        controlBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.click();
            });
        });
    }

    loadSettings() {
        // Load settings from localStorage
        const aiSettings = JSON.parse(localStorage.getItem('aiSettings') || '{}');
        this.detectionMode = aiSettings.detectionMode || 'animal';
        this.detectionThreshold = aiSettings.detectionThreshold || 0.5;
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
    
    // Initialize all integrated systems
    setTimeout(() => {
        // Initialize API Monitor
        if (window.apiMonitor) {
            console.log('API Monitor initialized');
        }
        
        // Initialize System Logs
        if (window.systemLogs) {
            console.log('System Logs initialized');
        }
        
        // Initialize Gemini AI
        if (window.geminiAI) {
            console.log('Gemini AI initialized');
        }
        
        // Initialize Firebase Integration
        if (window.firebaseIntegration) {
            console.log('Firebase Integration initialized');
        }
        
        // Initialize SMTP Notifications
        if (window.smtpNotifications) {
            console.log('SMTP Notifications initialized');
        }
        
        // Initialize Telegram Bot
        if (window.telegramBot) {
            console.log('Telegram Bot initialized');
        }
        
        // Initialize Simulation System
        if (window.simulationSystem) {
            console.log('Simulation System initialized');
        }
        
        console.log('All systems initialized successfully');
    }, 1000);
    
    // Initialize Patrol Mode
    initializePatrolMode() {
        const patrolEnabled = document.getElementById('patrolEnabled');
        const startPatrolBtn = document.getElementById('startPatrolBtn');
        const stopPatrolBtn = document.getElementById('stopPatrolBtn');
        const saveRouteBtn = document.getElementById('saveRouteBtn');
        const patrolSpeed = document.getElementById('patrolSpeed');
        const patrolSpeedValue = document.getElementById('patrolSpeedValue');
        
        if (patrolSpeed && patrolSpeedValue) {
            patrolSpeed.addEventListener('input', () => {
                patrolSpeedValue.textContent = patrolSpeed.value;
            });
        }
        
        if (startPatrolBtn) {
            startPatrolBtn.addEventListener('click', () => {
                this.startPatrol();
            });
        }
        
        if (stopPatrolBtn) {
            stopPatrolBtn.addEventListener('click', () => {
                this.stopPatrol();
            });
        }
        
        if (saveRouteBtn) {
            saveRouteBtn.addEventListener('click', () => {
                this.savePatrolRoute();
            });
        }
    }
    
    // Initialize Emergency Controls
    initializeEmergencyControls() {
        const emergencyStopBtn = document.getElementById('emergencyStopBtn');
        const restartSystemBtn = document.getElementById('restartSystemBtn');
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        
        if (emergencyStopBtn) {
            emergencyStopBtn.addEventListener('click', () => {
                this.emergencyStop();
            });
        }
        
        if (restartSystemBtn) {
            restartSystemBtn.addEventListener('click', () => {
                this.restartSystem();
            });
        }
        
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }
    
    // Initialize Status Indicators
    initializeStatusIndicators() {
        this.updateFirebaseStatus();
        this.updateAIStatus();
        this.updateBatteryStatus();
    }
    
    // Patrol Mode Methods
    startPatrol() {
        const patrolSpeed = document.getElementById('patrolSpeed')?.value || 100;
        const patrolDuration = document.getElementById('patrolDuration')?.value || 30;
        const patrolRoute = document.getElementById('patrolRoute')?.value || 'circular';
        
        console.log('Starting patrol mode:', { patrolSpeed, patrolDuration, patrolRoute });
        
        // Send patrol command to ESP32
        this.sendCommand('patrol', {
            enabled: true,
            speed: parseInt(patrolSpeed),
            duration: parseInt(patrolDuration),
            route: patrolRoute
        });
        
        this.showAlert('Patrol Mode', 'Patrol mode started successfully');
        this.updatePatrolStatus('Active', patrolRoute);
    }
    
    stopPatrol() {
        console.log('Stopping patrol mode');
        
        this.sendCommand('patrol', { enabled: false });
        this.showAlert('Patrol Mode', 'Patrol mode stopped');
        this.updatePatrolStatus('Stopped', 'None');
    }
    
    savePatrolRoute() {
        console.log('Saving patrol route');
        this.showAlert('Route Saved', 'Patrol route saved successfully');
    }
    
    updatePatrolStatus(status, route) {
        const currentRoute = document.getElementById('currentRoute');
        if (currentRoute) {
            currentRoute.textContent = route;
        }
    }
    
    // Emergency Control Methods
    emergencyStop() {
        console.log('EMERGENCY STOP ACTIVATED');
        
        // Stop all movement immediately
        this.sendCommand('emergency_stop', {});
        
        // Show emergency alert
        this.showAlert('EMERGENCY STOP', 'All systems have been stopped immediately!', 'danger');
        
        // Update UI
        this.updateConnectionStatus(false);
    }
    
    restartSystem() {
        if (confirm('Are you sure you want to restart the system? This will disconnect the car temporarily.')) {
            console.log('Restarting system');
            
            this.sendCommand('restart', {});
            this.showAlert('System Restart', 'System restart initiated. Please wait for reconnection.');
            
            // Show loading overlay
            this.showLoadingOverlay('Restarting system...');
            
            // Attempt to reconnect after delay
            setTimeout(() => {
                this.connectWebSocket();
            }, 10000);
        }
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            console.log('Resetting settings');
            
            // Clear localStorage
            localStorage.clear();
            
            // Reload page
            window.location.reload();
        }
    }
    
    // Status Update Methods
    updateFirebaseStatus() {
        const firebaseStatus = document.getElementById('firebaseStatus');
        if (firebaseStatus) {
            if (window.firebaseIntegration && window.firebaseIntegration.isConnected()) {
                firebaseStatus.className = 'status-indicator connected';
                firebaseStatus.querySelector('span').textContent = 'Firebase Connected';
            } else {
                firebaseStatus.className = 'status-indicator disconnected';
                firebaseStatus.querySelector('span').textContent = 'Firebase Offline';
            }
        }
    }
    
    updateAIStatus() {
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            if (window.geminiAI && window.geminiAI.isInitialized) {
                aiStatus.className = 'status-indicator connected';
                aiStatus.querySelector('span').textContent = 'AI Online';
            } else {
                aiStatus.className = 'status-indicator disconnected';
                aiStatus.querySelector('span').textContent = 'AI Offline';
            }
        }
    }
    
    updateBatteryStatus() {
        const batteryStatus = document.getElementById('batteryStatus');
        if (batteryStatus) {
            const batteryLevel = this.sensorData.battery || 0;
            const batteryIcon = batteryStatus.querySelector('i');
            const batteryText = batteryStatus.querySelector('span');
            
            if (batteryLevel > 75) {
                batteryIcon.className = 'fas fa-battery-full';
                batteryStatus.className = 'status-indicator connected';
            } else if (batteryLevel > 25) {
                batteryIcon.className = 'fas fa-battery-half';
                batteryStatus.className = 'status-indicator warning';
            } else {
                batteryIcon.className = 'fas fa-battery-empty';
                batteryStatus.className = 'status-indicator disconnected';
            }
            
            batteryText.textContent = `${batteryLevel}%`;
        }
    }
    
    // Enhanced Alert System
    showAlert(title, message, type = 'info') {
        const alertModal = document.getElementById('alertModal');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        
        if (alertModal && alertTitle && alertMessage) {
            alertTitle.textContent = title;
            alertMessage.textContent = message;
            
            // Update modal styling based on type
            const modalContent = alertModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.className = `modal-content ${type}`;
            }
            
            alertModal.style.display = 'block';
        } else {
            // Fallback to browser alert
            alert(`${title}: ${message}`);
        }
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden, pausing updates');
    } else {
        console.log('Page visible, resuming updates');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 768;
    const videoContainer = document.querySelector('.video-container');
    
    if (videoContainer) {
        if (isMobile) {
            videoContainer.style.height = '250px';
        } else {
            videoContainer.style.height = '400px';
        }
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

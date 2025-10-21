// Professional Surveillance Car Dashboard
// Complete implementation with all features

class SurveillanceDashboard {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentMode = 'manual';
        this.aiEnabled = false;
        this.isRecording = false;
        this.deviceType = localStorage.getItem('selectedDevice') || 'esp32';
        this.deviceIP = localStorage.getItem('deviceIP') || '192.168.1.100';
        this.geminiAPIKey = 'AIzaSyAy_99DoGZkw9cYOOgjahv4-YJeud0I90E';
        this.dailyUsageCount = 0;
        this.dailyLimit = 1000;
        
        this.init();
    }

    async init() {
        console.log('Initializing Surveillance Dashboard...');
        
        try {
            await this.initializeFirebase();
            await this.connectWebSocket();
            this.setupEventListeners();
            this.initializeVideoStream();
            this.startDataPolling();
            this.loadDeviceSelection();
            this.updateUI();
            
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showAlert('Initialization Error', 'Failed to initialize dashboard: ' + error.message);
        }
    }

    async initializeFirebase() {
        try {
            // Firebase configuration
            const firebaseConfig = {
                apiKey: "your-api-key",
                authDomain: "surveillance-car-project.firebaseapp.com",
                projectId: "surveillance-car-project",
                storageBucket: "surveillance-car-project.appspot.com",
                messagingSenderId: "123456789",
                appId: "your-app-id"
            };

            if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore();
                console.log('Firebase initialized');
            }
        } catch (error) {
            console.warn('Firebase initialization failed:', error);
        }
    }

    async connectWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            this.socket = io(wsUrl);
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
            });
            
            this.socket.on('sensor_update', (data) => {
                this.updateSensorData(data);
            });
            
            this.socket.on('status_update', (data) => {
                this.updateSystemStatus(data);
            });
            
            this.socket.on('ai_detection', (data) => {
                this.handleAIDetection(data);
            });
            
            this.socket.on('ai_detection_update', (data) => {
                this.updateAIDetection(data);
            });
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.updateConnectionStatus('disconnected');
        }
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
        document.getElementById('aiToggleBtn')?.addEventListener('click', () => this.toggleAI());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

        // Audio controls
        document.getElementById('micToggleBtn')?.addEventListener('click', () => this.toggleMicrophone());
        document.getElementById('playAlertBtn')?.addEventListener('click', () => this.playAlert());
        document.getElementById('playSirenBtn')?.addEventListener('click', () => this.playSiren());

        // System controls
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restartSystem());
        document.getElementById('emergencyStopBtn')?.addEventListener('click', () => this.emergencyStop());
        document.getElementById('testSystemBtn')?.addEventListener('click', () => this.testSystem());

        // AI controls
        document.getElementById('aiEnabled')?.addEventListener('change', (e) => {
            this.toggleAI(e.target.checked);
        });

        // Camera settings
        const qualitySlider = document.getElementById('qualitySlider');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                document.getElementById('qualityValue').textContent = e.target.value;
                this.updateCameraSettings({ quality: parseInt(e.target.value) });
            });
        }

        const brightnessSlider = document.getElementById('brightnessSlider');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                document.getElementById('brightnessValue').textContent = e.target.value;
                this.updateCameraSettings({ brightness: parseInt(e.target.value) });
            });
        }

        const contrastSlider = document.getElementById('contrastSlider');
        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                document.getElementById('contrastValue').textContent = e.target.value;
                this.updateCameraSettings({ contrast: parseInt(e.target.value) });
            });
        }

        // Audio settings
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                document.getElementById('volumeValue').textContent = e.target.value;
                this.updateAudioSettings({ volume: parseInt(e.target.value) });
            });
        }

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        document.getElementById('alertOk')?.addEventListener('click', () => {
            document.getElementById('alertModal').style.display = 'none';
        });

        // Detection alert actions
        document.getElementById('playLowPitchBtn')?.addEventListener('click', () => this.playLowPitch());
        document.getElementById('continueSurveillanceBtn')?.addEventListener('click', () => this.continueSurveillance());

        // Device selection
        document.getElementById('connectDeviceBtn')?.addEventListener('click', () => this.connectToDevice());
        document.getElementById('configureWiFiBtn')?.addEventListener('click', () => this.configureWiFi());
        
        // Device option clicks
        document.getElementById('esp32Device')?.addEventListener('click', () => this.selectDevice('esp32'));
        document.getElementById('raspberryPiDevice')?.addEventListener('click', () => this.selectDevice('raspberry_pi'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.sendMotorCommand('forward');
                break;
            case 's':
            case 'arrowdown':
                this.sendMotorCommand('backward');
                break;
            case 'a':
            case 'arrowleft':
                this.sendMotorCommand('left');
                break;
            case 'd':
            case 'arrowright':
                this.sendMotorCommand('right');
                break;
            case ' ':
                e.preventDefault();
                this.sendMotorCommand('stop');
                break;
            case 'c':
                this.captureImage();
                break;
            case 'r':
                this.toggleRecording();
                break;
            case 'e':
                this.emergencyStop();
                break;
        }
    }

    initializeVideoStream() {
        const videoElement = document.getElementById('videoStream');
        const videoImg = document.getElementById('videoStreamImg');
        const loadingElement = document.getElementById('videoLoading');
        
        if (videoElement) {
            videoElement.addEventListener('loadstart', () => {
                if (loadingElement) loadingElement.style.display = 'block';
            });
            
            videoElement.addEventListener('canplay', () => {
                if (loadingElement) loadingElement.style.display = 'none';
                videoElement.style.display = 'block';
                if (videoImg) videoImg.style.display = 'none';
            });
            
            videoElement.addEventListener('error', (e) => {
                console.warn('Video stream failed, falling back to image stream');
                if (loadingElement) loadingElement.style.display = 'none';
                videoElement.style.display = 'none';
                if (videoImg) {
                    videoImg.style.display = 'block';
                    videoImg.src = '/api/camera/stream?' + Date.now();
                }
            });
            
            // Try to load video stream
            videoElement.src = '/api/camera/stream';
        }
    }

    async startDataPolling() {
        setInterval(async () => {
            if (this.isConnected) {
                await this.fetchSystemStatus();
                await this.fetchSensorData();
            }
        }, 1000);
    }

    async fetchSystemStatus() {
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                const data = await response.json();
                this.updateSystemStatus(data);
            }
        } catch (error) {
            console.warn('Failed to fetch system status:', error);
        }
    }

    async fetchSensorData() {
        try {
            const response = await fetch('/api/sensors?limit=1');
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    this.updateSensorData(data[0]);
                }
            }
        } catch (error) {
            console.warn('Failed to fetch sensor data:', error);
        }
    }

    updateSystemStatus(data) {
        if (data.batteryLevel !== undefined) {
            document.getElementById('batteryStatus').querySelector('span').textContent = data.batteryLevel + '%';
            this.updateBatteryStatus(data.batteryLevel);
        }
        
        if (data.cpuFreq !== undefined) {
            document.getElementById('cpuFreq').textContent = data.cpuFreq;
        }
        
        if (data.freeHeap !== undefined) {
            document.getElementById('freeHeap').textContent = data.freeHeap.toLocaleString();
        }
        
        if (data.uptime !== undefined) {
            document.getElementById('uptime').textContent = Math.floor(data.uptime / 1000);
        }
        
        if (data.storageUsage !== undefined) {
            document.getElementById('storageUsage').textContent = data.storageUsage;
        }
        
        if (data.wifiSSID) {
            document.getElementById('wifiSSID').textContent = data.wifiSSID;
        }
        
        if (data.wifiSignal !== undefined) {
            document.getElementById('wifiSignal').textContent = data.wifiSignal;
        }
    }

    updateSensorData(data) {
        if (data.irSensors) {
            const irSensors = Array.isArray(data.irSensors) ? data.irSensors : [data.irSensors.left, data.irSensors.center, data.irSensors.right];
            
            document.getElementById('irLeft').textContent = irSensors[0] || 0;
            document.getElementById('irCenter').textContent = irSensors[1] || 0;
            document.getElementById('irRight').textContent = irSensors[2] || 0;
            
            // Update sensor bars
            this.updateSensorBar('irLeftBar', irSensors[0] || 0);
            this.updateSensorBar('irCenterBar', irSensors[1] || 0);
            this.updateSensorBar('irRightBar', irSensors[2] || 0);
        }
        
        if (data.ultrasonicDistance !== undefined) {
            document.getElementById('distance').textContent = data.ultrasonicDistance.toFixed(1);
            this.updateSensorBar('distanceBar', Math.min(data.ultrasonicDistance / 200 * 100, 100));
        }
        
        if (data.batteryVoltage !== undefined) {
            document.getElementById('batteryVoltage').textContent = data.batteryVoltage.toFixed(1);
            this.updateSensorBar('batteryBar', (data.batteryVoltage / 12.6) * 100);
        }
    }

    updateSensorBar(barId, percentage) {
        const bar = document.getElementById(barId);
        if (bar) {
            bar.style.width = Math.min(Math.max(percentage, 0), 100) + '%';
        }
    }

    updateBatteryStatus(percentage) {
        const batteryElement = document.getElementById('batteryStatus');
        if (batteryElement) {
            const icon = batteryElement.querySelector('i');
            
            if (percentage > 75) {
                icon.className = 'fas fa-battery-full';
                batteryElement.className = 'status-indicator connected';
            } else if (percentage > 50) {
                icon.className = 'fas fa-battery-three-quarters';
                batteryElement.className = 'status-indicator connected';
            } else if (percentage > 25) {
                icon.className = 'fas fa-battery-half';
                batteryElement.className = 'status-indicator warning';
            } else {
                icon.className = 'fas fa-battery-quarter';
                batteryElement.className = 'status-indicator disconnected';
            }
        }
    }

    updateConnectionStatus(status) {
        const connectionElement = document.getElementById('connectionStatus');
        if (connectionElement) {
            connectionElement.className = `status-indicator ${status}`;
            connectionElement.querySelector('span').textContent = status === 'connected' ? 'Connected' : 'Disconnected';
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(mode + 'Mode')?.classList.add('active');
        
        // Send mode change to device
        this.sendCommand('mode', { mode });
        
        console.log('Mode changed to:', mode);
    }

    async sendMotorCommand(action, value = null) {
        const command = {
            command: 'motor',
            action: action,
            value: value
        };
        
        await this.sendCommand('control', command);
    }

    async sendCommand(type, data) {
        try {
            if (this.socket && this.socket.connected) {
                this.socket.emit('control_command', { type, ...data });
            } else {
                // Fallback to HTTP
                const response = await fetch('/api/control', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type, ...data })
                });
                
                if (!response.ok) {
                    throw new Error('Command failed');
                }
            }
        } catch (error) {
            console.error('Command failed:', error);
            this.showNotification('Command failed: ' + error.message, 'error');
        }
    }

    async captureImage() {
        try {
            // Try to capture from video stream first
            const videoStream = document.getElementById('videoStream');
            let imageBase64 = null;
            
            if (videoStream && videoStream.videoWidth > 0) {
                // Create canvas to capture frame
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = videoStream.videoWidth || 640;
                canvas.height = videoStream.videoHeight || 480;
                
                ctx.drawImage(videoStream, 0, 0, canvas.width, canvas.height);
                
                // Convert to base64
                imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            } else {
                // Fallback: request capture from device
                const response = await fetch('/api/camera/capture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.showNotification('Image captured from device', 'success');
                    return;
                } else {
                    throw new Error('Device capture failed');
                }
            }
            
            if (imageBase64) {
                // Send to backend for AI analysis
                const response = await fetch('/api/detect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ image: imageBase64 })
                });

                if (response.ok) {
                    const result = await response.json();
                    this.showNotification('Image captured and analyzed', 'success');
                    
                    if (result.analysis) {
                        this.handleAIDetection(result.analysis);
                    }
                } else {
                    throw new Error('AI analysis failed');
                }
            }

        } catch (error) {
            console.error('Image capture failed:', error);
            this.showNotification('Image capture failed: ' + error.message, 'error');
        }
    }

    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            this.isRecording = true;
            this.updateRecordButton(true);
            this.sendCommand('camera', { action: 'start_recording' });
            this.showNotification('Recording started', 'info');
        } catch (error) {
            console.error('Recording start failed:', error);
            this.showNotification('Recording failed to start', 'error');
        }
    }

    async stopRecording() {
        try {
            this.isRecording = false;
            this.updateRecordButton(false);
            this.sendCommand('camera', { action: 'stop_recording' });
            this.showNotification('Recording stopped', 'info');
        } catch (error) {
            console.error('Recording stop failed:', error);
            this.showNotification('Recording stop failed', 'error');
        }
    }

    updateRecordButton(isRecording) {
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            if (isRecording) {
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                recordBtn.classList.add('recording');
            } else {
                recordBtn.innerHTML = '<i class="fas fa-video"></i> Record';
                recordBtn.classList.remove('recording');
            }
        }
    }

    async toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        
        const aiToggle = document.getElementById('aiEnabled');
        if (aiToggle) {
            aiToggle.checked = this.aiEnabled;
        }
        
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            aiStatus.className = `status-indicator ${this.aiEnabled ? 'ai-active' : 'ai-inactive'}`;
            aiStatus.querySelector('span').textContent = this.aiEnabled ? 'AI Active' : 'AI Offline';
        }
        
        this.sendCommand('ai', { enabled: this.aiEnabled });
        this.showNotification(`AI Detection ${this.aiEnabled ? 'enabled' : 'disabled'}`, 'info');
    }

    async toggleMicrophone() {
        // Implementation for microphone toggle
        this.showNotification('Microphone control not implemented', 'info');
    }

    async playAlert() {
        this.sendCommand('audio', { action: 'play_alert' });
        this.showNotification('Alert sound played', 'info');
    }

    async playSiren() {
        this.sendCommand('audio', { action: 'play_siren' });
        this.showNotification('Siren sound played', 'warning');
    }

    async playLowPitch() {
        this.sendCommand('audio', { action: 'play_low_pitch' });
        this.showNotification('Low pitch sound played', 'info');
    }

    async restartSystem() {
        if (confirm('Are you sure you want to restart the system?')) {
            this.sendCommand('system', { action: 'restart' });
            this.showNotification('System restart initiated', 'warning');
        }
    }

    async emergencyStop() {
        this.sendCommand('system', { action: 'emergency_stop' });
        this.showNotification('EMERGENCY STOP ACTIVATED', 'error');
        this.showAlert('Emergency Stop', 'Emergency stop activated! All systems halted.');
    }

    async testSystem() {
        this.showNotification('Running system tests...', 'info');
        
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const health = await response.json();
                this.showNotification('System test completed successfully', 'success');
                console.log('System health:', health);
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            this.showNotification('System test failed', 'error');
        }
    }

    async updateCameraSettings(settings) {
        this.sendCommand('camera', { action: 'update_settings', settings });
    }

    async updateAudioSettings(settings) {
        this.sendCommand('audio', { action: 'update_settings', settings });
    }

    toggleFullscreen() {
        const videoContainer = document.querySelector('.video-container');
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                console.error('Fullscreen failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    handleAIDetection(analysis) {
        console.log('AI Detection:', analysis);
        
        // Show detection overlay
        this.showDetectionOverlay(analysis);
        
        // Add to detection history
        this.addDetectionToHistory(analysis);
        
        // Show alert modal
        this.showDetectionAlert(analysis);
        
        // Play appropriate sound
        if (analysis.alertLevel === 'critical' || analysis.alertLevel === 'high') {
            this.playSiren();
        } else {
            this.playAlert();
        }
    }

    showDetectionOverlay(analysis) {
        const overlay = document.getElementById('aiDetectionOverlay');
        const box = document.getElementById('detectionBox');
        const label = document.getElementById('detectionLabel');
        
        if (overlay && box && label && analysis.boundingBoxes) {
            analysis.boundingBoxes.forEach(bbox => {
                box.style.left = bbox.x + 'px';
                box.style.top = bbox.y + 'px';
                box.style.width = bbox.width + 'px';
                box.style.height = bbox.height + 'px';
                box.style.display = 'block';
                
                label.textContent = `${bbox.object} (${Math.round(bbox.confidence * 100)}%)`;
                label.style.left = bbox.x + 'px';
                label.style.top = (bbox.y - 25) + 'px';
                label.style.display = 'block';
            });
            
            // Hide after 5 seconds
            setTimeout(() => {
                box.style.display = 'none';
                label.style.display = 'none';
            }, 5000);
        }
    }

    addDetectionToHistory(analysis) {
        const detectionList = document.getElementById('detectionList');
        if (!detectionList) return;

        const detectionItem = document.createElement('div');
        detectionItem.className = `detection-item ${analysis.alertLevel}`;
        
        const time = new Date().toLocaleTimeString();
        const objects = analysis.detectedObjects?.join(', ') || 'Unknown';
        const confidence = Math.round((analysis.confidence || 0) * 100);
        
        detectionItem.innerHTML = `
            <div class="detection-info">
                <div class="detection-objects">${objects}</div>
                <div class="detection-time">${time}</div>
            </div>
            <div class="confidence">${confidence}%</div>
        `;
        
        detectionList.insertBefore(detectionItem, detectionList.firstChild);
        
        // Keep only last 10 detections
        while (detectionList.children.length > 10) {
            detectionList.removeChild(detectionList.lastChild);
        }
    }

    showDetectionAlert(analysis) {
        const modal = document.getElementById('detectionAlertModal');
        const title = document.getElementById('detectionAlertTitle');
        const message = document.getElementById('detectionAlertMessage');
        
        if (modal && title && message) {
            title.textContent = 'AI Detection Alert';
            message.textContent = `Detected: ${analysis.detectedObjects?.join(', ') || 'Unknown object'}`;
            modal.style.display = 'block';
        }
    }

    continueSurveillance() {
        document.getElementById('detectionAlertModal').style.display = 'none';
        this.showNotification('Surveillance continued', 'info');
    }

    updateAIDetection(data) {
        // Update AI detection status
        console.log('AI Detection Update:', data);
    }

    loadDeviceSelection() {
        const selectedDevice = localStorage.getItem('selectedDevice');
        if (selectedDevice) {
            this.selectDevice(selectedDevice);
        }
    }

    selectDevice(deviceType) {
        this.deviceType = deviceType;
        localStorage.setItem('selectedDevice', deviceType);
        
        // Update UI
        document.querySelectorAll('.device-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        if (deviceType === 'esp32') {
            document.getElementById('esp32Device')?.classList.add('selected');
        } else if (deviceType === 'raspberry_pi') {
            document.getElementById('raspberryPiDevice')?.classList.add('selected');
        }
        
        this.updateDeviceStatus(deviceType, 'selected');
        console.log('Device selected:', deviceType);
    }

    async connectToDevice() {
        if (!this.deviceType) {
            this.showAlert('Device Selection', 'Please select a device type first');
            return;
        }
        
        try {
            this.updateDeviceStatus(this.deviceType, 'connecting');
            
            // Send device selection to backend
            const response = await fetch('/api/device/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceType: this.deviceType
                })
            });
            
            if (response.ok) {
                this.updateDeviceStatus(this.deviceType, 'connected');
                this.showNotification(`Connected to ${this.deviceType === 'esp32' ? 'ESP32' : 'Raspberry Pi'}`, 'success');
            } else {
                throw new Error('Failed to connect to device');
            }
            
        } catch (error) {
            this.updateDeviceStatus(this.deviceType, 'disconnected');
            this.showAlert('Connection Error', 'Failed to connect to device: ' + error.message);
        }
    }

    configureWiFi() {
        window.location.href = 'wifi-config.html';
    }

    updateDeviceStatus(deviceType, status) {
        const statusElement = document.getElementById(deviceType + 'Status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `device-status ${status}`;
        }
    }

    updateUI() {
        // Update UI elements based on current state
        this.updateConnectionStatus(this.isConnected ? 'connected' : 'disconnected');
        
        // Update AI status
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            aiStatus.className = `status-indicator ${this.aiEnabled ? 'ai-active' : 'ai-inactive'}`;
            aiStatus.querySelector('span').textContent = this.aiEnabled ? 'AI Active' : 'AI Offline';
        }
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

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 400px;
        `;
        
        // Set background color based on type
        const colors = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds for errors, 3 seconds for others
        const duration = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    handleError(error, context = 'Operation') {
        console.error(`${context} failed:`, error);
        const message = error.message || error.toString();
        this.showNotification(`${context} failed: ${message}`, 'error');
    }

    async withErrorHandling(operation, context = 'Operation') {
        try {
            return await operation();
        } catch (error) {
            this.handleError(error, context);
            throw error;
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SurveillanceDashboard();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
`;
document.head.appendChild(style);

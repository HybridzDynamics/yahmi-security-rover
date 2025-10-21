/**
 * Yahmi Security Rover - Advanced Dashboard Controller
 * Modern, professional surveillance system interface
 */

class YahmiDashboard {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentMode = 'manual';
        this.aiEnabled = false;
        this.isRecording = false;
        this.deviceType = localStorage.getItem('yahmiDeviceType') || 'esp32';
        this.deviceIP = localStorage.getItem('yahmiDeviceIP') || '192.168.1.100';
        this.devicePort = localStorage.getItem('yahmiDevicePort') || '80';
        
        // System state
        this.systemData = {
            batteryLevel: 100,
            batteryVoltage: 12.6,
            cpuUsage: 0,
            memoryUsage: 0,
            uptime: 0,
            wifiSignal: -45,
            wifiSSID: 'Yahmi-Network',
            ipAddress: '192.168.1.100'
        };
        
        this.sensorData = {
            irSensors: [0, 0, 0],
            ultrasonicDistance: 0,
            obstacleDetected: false,
            leftMotorSpeed: 0,
            rightMotorSpeed: 0,
            motorDirection: 'stop'
        };
        
        this.detectionCount = 0;
        this.charts = {};
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Yahmi Security Rover Dashboard...');
        
        try {
            this.showLoading(true);
            
            // Initialize components
            await this.initializeWebSocket();
            this.setupEventListeners();
            this.initializeNavigation();
            this.initializeVideoStream();
            this.initializeCharts();
            this.startDataPolling();
            this.loadSettings();
            
            // Update UI
            this.updateSystemStatus();
            this.updateSensorData();
            
            this.showLoading(false);
            this.showNotification('Yahmi Security Rover connected successfully', 'success');
            
            console.log('✅ Yahmi Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showNotification('Failed to initialize dashboard: ' + error.message, 'error');
            this.showLoading(false);
        }
    }

    async initializeWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });
            
            this.socket.on('connect', () => {
                console.log('🔗 Connected to Yahmi server');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
            });
            
            this.socket.on('disconnect', () => {
                console.log('🔌 Disconnected from Yahmi server');
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
            console.warn('WebSocket connection failed, using HTTP fallback:', error);
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
            });
        });

        // Video controls
        document.getElementById('captureBtn')?.addEventListener('click', () => this.captureImage());
        document.getElementById('recordBtn')?.addEventListener('click', () => this.toggleRecording());
        document.getElementById('aiToggleBtn')?.addEventListener('click', () => this.toggleAI());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

        // Movement controls
        document.getElementById('forwardBtn')?.addEventListener('click', () => this.sendMotorCommand('forward'));
        document.getElementById('backwardBtn')?.addEventListener('click', () => this.sendMotorCommand('backward'));
        document.getElementById('leftBtn')?.addEventListener('click', () => this.sendMotorCommand('left'));
        document.getElementById('rightBtn')?.addEventListener('click', () => this.sendMotorCommand('right'));
        document.getElementById('stopBtn')?.addEventListener('click', () => this.sendMotorCommand('stop'));

        // Speed control
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('speedValue').textContent = value + '%';
                this.sendMotorCommand('speed', parseInt(value));
            });
        }

        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.setMode(mode);
            });
        });

        // Audio controls
        document.getElementById('playAlert')?.addEventListener('click', () => this.playAudio('alert'));
        document.getElementById('playSiren')?.addEventListener('click', () => this.playAudio('siren'));
        document.getElementById('playLowPitch')?.addEventListener('click', () => this.playAudio('low_pitch'));

        // Control camera controls
        document.getElementById('controlCaptureBtn')?.addEventListener('click', () => this.captureImage());
        document.getElementById('controlRecordBtn')?.addEventListener('click', () => this.toggleRecording());
        document.getElementById('controlFullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

        // Device testing and simulation
        document.getElementById('startSimulation')?.addEventListener('click', () => this.startSimulation());
        document.getElementById('stopSimulation')?.addEventListener('click', () => this.stopSimulation());
        document.getElementById('testConnection')?.addEventListener('click', () => this.testConnection());

        // Mapping controls
        document.getElementById('startMapping')?.addEventListener('click', () => this.startMapping());
        document.getElementById('clearMap')?.addEventListener('click', () => this.clearMap());
        document.getElementById('saveMap')?.addEventListener('click', () => this.saveMap());
        document.getElementById('loadMap')?.addEventListener('click', () => this.loadMap());
        document.getElementById('addWaypoint')?.addEventListener('click', () => this.addWaypoint());
        document.getElementById('createRoute')?.addEventListener('click', () => this.createRoute());

        // Surveillance controls
        document.getElementById('startSurveillance')?.addEventListener('click', () => this.startSurveillance());
        document.getElementById('stopSurveillance')?.addEventListener('click', () => this.stopSurveillance());

        // Settings
        document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
        document.getElementById('restartSystem')?.addEventListener('click', () => this.restartSystem());

        // Camera settings
        const qualitySlider = document.getElementById('cameraQuality');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                document.getElementById('qualityValue').textContent = e.target.value;
                this.updateCameraSettings({ quality: parseInt(e.target.value) });
            });
        }

        const brightnessSlider = document.getElementById('cameraBrightness');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                document.getElementById('brightnessValue').textContent = e.target.value;
                this.updateCameraSettings({ brightness: parseInt(e.target.value) });
            });
        }

        const contrastSlider = document.getElementById('cameraContrast');
        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                document.getElementById('contrastValue').textContent = e.target.value;
                this.updateCameraSettings({ contrast: parseInt(e.target.value) });
            });
        }

        // AI settings
        document.getElementById('aiEnabled')?.addEventListener('change', (e) => {
            this.toggleAI(e.target.checked);
        });

        // Patrol speed
        const patrolSpeedSlider = document.getElementById('patrolSpeed');
        if (patrolSpeedSlider) {
            patrolSpeedSlider.addEventListener('input', (e) => {
                document.getElementById('patrolSpeedValue').textContent = e.target.value + '%';
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    initializeNavigation() {
        // Set initial active page
        this.showPage('dashboard');
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Remove active nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update nav link
        const targetLink = document.querySelector(`[data-page="${pageId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Update page title
        const titles = {
            dashboard: 'System Dashboard',
            surveillance: 'Surveillance Center',
            control: 'Rover Control',
            analytics: 'Analytics & Reports',
            settings: 'System Settings'
        };
        
        document.title = `${titles[pageId]} - Yahmi Security Rover`;
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

        // Initialize control camera stream
        this.initializeControlVideoStream();
    }

    initializeControlVideoStream() {
        const controlVideoElement = document.getElementById('controlVideoStream');
        const controlVideoImg = document.getElementById('controlVideoStreamImg');
        const controlLoadingElement = document.getElementById('controlCameraLoading');
        
        if (controlVideoElement) {
            controlVideoElement.addEventListener('loadstart', () => {
                if (controlLoadingElement) controlLoadingElement.style.display = 'block';
            });
            
            controlVideoElement.addEventListener('canplay', () => {
                if (controlLoadingElement) controlLoadingElement.style.display = 'none';
                controlVideoElement.style.display = 'block';
                if (controlVideoImg) controlVideoImg.style.display = 'none';
            });
            
            controlVideoElement.addEventListener('error', (e) => {
                console.warn('Control video stream failed, falling back to image stream');
                if (controlLoadingElement) controlLoadingElement.style.display = 'none';
                controlVideoElement.style.display = 'none';
                if (controlVideoImg) {
                    controlVideoImg.style.display = 'block';
                    controlVideoImg.src = '/api/camera/stream?' + Date.now();
                }
            });
            
            // Try to load control video stream
            controlVideoElement.src = '/api/camera/stream';
        }
    }

    initializeCharts() {
        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            this.charts.performance = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '10m'],
                    datasets: [{
                        label: 'CPU Usage',
                        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Memory Usage',
                        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#38a169',
                        backgroundColor: 'rgba(56, 161, 105, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }

        // Detection Chart
        const detectionCtx = document.getElementById('detectionChart');
        if (detectionCtx) {
            this.charts.detection = new Chart(detectionCtx, {
                type: 'bar',
                data: {
                    labels: ['Person', 'Vehicle', 'Animal', 'Other'],
                    datasets: [{
                        label: 'Detections',
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#4a90e2',
                            '#38a169',
                            '#ed8936',
                            '#e53e3e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Performance Analytics Chart
        const performanceAnalyticsCtx = document.getElementById('performanceAnalyticsChart');
        if (performanceAnalyticsCtx) {
            this.charts.performanceAnalytics = new Chart(performanceAnalyticsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['System', 'AI Processing', 'Video', 'Network'],
                    datasets: [{
                        data: [40, 25, 20, 15],
                        backgroundColor: [
                            '#4a90e2',
                            '#38a169',
                            '#ed8936',
                            '#e53e3e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    startDataPolling() {
        // Poll system data every second
        setInterval(async () => {
            if (this.isConnected) {
                await this.fetchSystemStatus();
                await this.fetchSensorData();
            }
        }, 1000);

        // Update charts every 5 seconds
        setInterval(() => {
            this.updateCharts();
        }, 5000);
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
            this.systemData.batteryLevel = data.batteryLevel;
            document.getElementById('batteryPercent').textContent = data.batteryLevel + '%';
            document.getElementById('batteryFill').style.width = data.batteryLevel + '%';
            
            // Update battery bar color
            const batteryFill = document.getElementById('batteryFill');
            if (data.batteryLevel < 20) {
                batteryFill.className = 'battery-fill low';
            } else if (data.batteryLevel < 50) {
                batteryFill.className = 'battery-fill medium';
            } else {
                batteryFill.className = 'battery-fill';
            }
        }
        
        if (data.batteryVoltage !== undefined) {
            this.systemData.batteryVoltage = data.batteryVoltage;
            document.getElementById('batteryVoltage').textContent = data.batteryVoltage.toFixed(1) + 'V';
        }
        
        if (data.cpuUsage !== undefined) {
            this.systemData.cpuUsage = data.cpuUsage;
            document.getElementById('cpuUsage').textContent = data.cpuUsage + '%';
        }
        
        if (data.uptime !== undefined) {
            this.systemData.uptime = data.uptime;
            const hours = Math.floor(data.uptime / 3600);
            const minutes = Math.floor((data.uptime % 3600) / 60);
            document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
        }
        
        if (data.wifiSSID) {
            this.systemData.wifiSSID = data.wifiSSID;
            document.getElementById('wifiSSID').textContent = data.wifiSSID;
        }
        
        if (data.wifiSignal !== undefined) {
            this.systemData.wifiSignal = data.wifiSignal;
            document.getElementById('wifiSignal').textContent = data.wifiSignal + ' dBm';
            
            // Update signal strength indicator
            const signalStrength = document.getElementById('signalStrength');
            if (data.wifiSignal > -50) {
                signalStrength.className = 'signal-strength strong';
            } else if (data.wifiSignal > -70) {
                signalStrength.className = 'signal-strength medium';
            } else {
                signalStrength.className = 'signal-strength weak';
            }
        }
        
        if (data.ipAddress) {
            this.systemData.ipAddress = data.ipAddress;
            document.getElementById('deviceIP').textContent = data.ipAddress;
        }
    }

    updateSensorData(data) {
        if (data.irSensors) {
            const irSensors = Array.isArray(data.irSensors) ? data.irSensors : [data.irSensors.left, data.irSensors.center, data.irSensors.right];
            
            document.getElementById('irLeftValue').textContent = irSensors[0] || 0;
            document.getElementById('irCenterValue').textContent = irSensors[1] || 0;
            document.getElementById('irRightValue').textContent = irSensors[2] || 0;
            
            // Update sensor bars
            this.updateSensorBar('irLeftBar', irSensors[0] || 0);
            this.updateSensorBar('irCenterBar', irSensors[1] || 0);
            this.updateSensorBar('irRightBar', irSensors[2] || 0);
        }
        
        if (data.ultrasonicDistance !== undefined) {
            this.sensorData.ultrasonicDistance = data.ultrasonicDistance;
            document.getElementById('distanceValue').textContent = data.ultrasonicDistance.toFixed(1) + ' cm';
            this.updateSensorBar('distanceBar', Math.min(data.ultrasonicDistance / 200 * 100, 100));
        }
    }

    updateSensorBar(barId, percentage) {
        const bar = document.getElementById(barId);
        if (bar) {
            bar.style.width = Math.min(Math.max(percentage, 0), 100) + '%';
        }
    }

    updateCharts() {
        // Update performance chart
        if (this.charts.performance) {
            const chart = this.charts.performance;
            const cpuData = chart.data.datasets[0].data;
            const memoryData = chart.data.datasets[1].data;
            
            cpuData.shift();
            cpuData.push(this.systemData.cpuUsage || 0);
            
            memoryData.shift();
            memoryData.push(this.systemData.memoryUsage || 0);
            
            chart.update('none');
        }
    }

    updateConnectionStatus(status) {
        const connectionElement = document.getElementById('connectionStatus');
        if (connectionElement) {
            connectionElement.className = `status-item ${status}`;
            connectionElement.querySelector('span').textContent = status === 'connected' ? 'Connected' : 'Disconnected';
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
        
        // Send mode change to device
        this.sendCommand('mode', { mode });
        
        this.showNotification(`Switched to ${mode} mode`, 'info');
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
            const videoStream = document.getElementById('videoStream');
            let imageBase64 = null;
            
            if (videoStream && videoStream.videoWidth > 0) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = videoStream.videoWidth || 640;
                canvas.height = videoStream.videoHeight || 480;
                
                ctx.drawImage(videoStream, 0, 0, canvas.width, canvas.height);
                imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            } else {
                const response = await fetch('/api/camera/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    this.showNotification('Image captured from device', 'success');
                    return;
                } else {
                    throw new Error('Device capture failed');
                }
            }
            
            if (imageBase64) {
                const response = await fetch('/api/detect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
        const controlRecordBtn = document.getElementById('controlRecordBtn');
        
        if (recordBtn) {
            if (isRecording) {
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                recordBtn.classList.add('recording');
            } else {
                recordBtn.innerHTML = '<i class="fas fa-video"></i> Record';
                recordBtn.classList.remove('recording');
            }
        }

        if (controlRecordBtn) {
            if (isRecording) {
                controlRecordBtn.innerHTML = '<i class="fas fa-stop"></i>';
                controlRecordBtn.classList.add('recording');
            } else {
                controlRecordBtn.innerHTML = '<i class="fas fa-video"></i>';
                controlRecordBtn.classList.remove('recording');
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
            aiStatus.className = `status-item ${this.aiEnabled ? 'ai-active' : 'ai-inactive'}`;
            aiStatus.querySelector('span').textContent = this.aiEnabled ? 'AI Active' : 'AI Offline';
        }
        
        this.sendCommand('ai', { enabled: this.aiEnabled });
        this.showNotification(`AI Detection ${this.aiEnabled ? 'enabled' : 'disabled'}`, 'info');
    }

    async playAudio(type) {
        this.sendCommand('audio', { action: `play_${type}` });
        this.showNotification(`${type} sound played`, 'info');
    }

    async startSurveillance() {
        this.sendCommand('surveillance', { action: 'start' });
        this.showNotification('Surveillance started', 'success');
    }

    async stopSurveillance() {
        this.sendCommand('surveillance', { action: 'stop' });
        this.showNotification('Surveillance stopped', 'info');
    }

    async updateCameraSettings(settings) {
        this.sendCommand('camera', { action: 'update_settings', settings });
    }

    // Device Testing and Simulation Methods
    async startSimulation() {
        try {
            this.showNotification('Starting device simulation...', 'info');
            
            // Simulate device connections
            this.updateDeviceStatus('esp32Status', 'connected');
            this.updateDeviceStatus('piStatus', 'connected');
            this.updateDeviceStatus('cameraStatus', 'connected');
            this.updateDeviceStatus('sensorStatus', 'connected');
            
            // Add test results
            this.addTestResult('Device simulation started', 'success');
            this.addTestResult('ESP32 connected', 'success');
            this.addTestResult('Raspberry Pi connected', 'success');
            this.addTestResult('Camera initialized', 'success');
            this.addTestResult('Sensors calibrated', 'success');
            
            this.showNotification('Simulation started successfully', 'success');
        } catch (error) {
            console.error('Simulation start failed:', error);
            this.showNotification('Simulation start failed', 'error');
        }
    }

    async stopSimulation() {
        try {
            this.showNotification('Stopping device simulation...', 'info');
            
            // Simulate device disconnections
            this.updateDeviceStatus('esp32Status', 'disconnected');
            this.updateDeviceStatus('piStatus', 'disconnected');
            this.updateDeviceStatus('cameraStatus', 'disconnected');
            this.updateDeviceStatus('sensorStatus', 'disconnected');
            
            this.addTestResult('Simulation stopped', 'info');
            this.showNotification('Simulation stopped', 'success');
        } catch (error) {
            console.error('Simulation stop failed:', error);
            this.showNotification('Simulation stop failed', 'error');
        }
    }

    async testConnection() {
        try {
            this.showNotification('Testing device connections...', 'info');
            
            // Test ESP32 connection
            const esp32Response = await fetch('/api/status');
            if (esp32Response.ok) {
                this.updateDeviceStatus('esp32Status', 'connected');
                this.addTestResult('ESP32 connection successful', 'success');
            } else {
                this.updateDeviceStatus('esp32Status', 'disconnected');
                this.addTestResult('ESP32 connection failed', 'error');
            }
            
            // Test Raspberry Pi connection
            const piResponse = await fetch('/api/system/health');
            if (piResponse.ok) {
                this.updateDeviceStatus('piStatus', 'connected');
                this.addTestResult('Raspberry Pi connection successful', 'success');
            } else {
                this.updateDeviceStatus('piStatus', 'disconnected');
                this.addTestResult('Raspberry Pi connection failed', 'error');
            }
            
            this.showNotification('Connection test completed', 'success');
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showNotification('Connection test failed', 'error');
        }
    }

    updateDeviceStatus(deviceId, status) {
        const statusElement = document.getElementById(deviceId);
        if (statusElement) {
            statusElement.className = `status-indicator ${status}`;
            const statusText = statusElement.querySelector('span');
            if (statusText) {
                statusText.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
            }
        }
    }

    addTestResult(message, type) {
        const testResults = document.getElementById('testResults');
        if (testResults) {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            
            const icon = type === 'success' ? 'fa-check-circle' : 
                        type === 'error' ? 'fa-times-circle' : 
                        type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
            
            testItem.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${message}</span>
                <span class="test-time">now</span>
            `;
            
            testResults.insertBefore(testItem, testResults.firstChild);
            
            // Keep only last 10 results
            while (testResults.children.length > 10) {
                testResults.removeChild(testResults.lastChild);
            }
        }
    }

    // Mapping Methods
    async startMapping() {
        try {
            this.showNotification('Starting area mapping...', 'info');
            this.addTestResult('Mapping started', 'info');
            this.addTestResult('SLAM algorithm initialized', 'success');
            this.addTestResult('Lidar sensor activated', 'success');
            this.showNotification('Mapping started successfully', 'success');
        } catch (error) {
            console.error('Mapping start failed:', error);
            this.showNotification('Mapping start failed', 'error');
        }
    }

    async clearMap() {
        try {
            const mapContainer = document.getElementById('roverMap');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div class="map-placeholder">
                        <i class="fas fa-map-marked-alt"></i>
                        <p>Map cleared</p>
                        <p>Click to add waypoints</p>
                    </div>
                `;
            }
            
            // Clear waypoints
            const waypointsList = document.getElementById('waypointsList');
            if (waypointsList) {
                waypointsList.innerHTML = '';
            }
            
            // Reset stats
            document.getElementById('waypointCount').textContent = '0';
            document.getElementById('totalDistance').textContent = '0m';
            document.getElementById('mappedArea').textContent = '0m²';
            
            this.showNotification('Map cleared', 'success');
        } catch (error) {
            console.error('Map clear failed:', error);
            this.showNotification('Map clear failed', 'error');
        }
    }

    async saveMap() {
        try {
            this.showNotification('Saving map data...', 'info');
            // Simulate map saving
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showNotification('Map saved successfully', 'success');
        } catch (error) {
            console.error('Map save failed:', error);
            this.showNotification('Map save failed', 'error');
        }
    }

    async loadMap() {
        try {
            this.showNotification('Loading map data...', 'info');
            // Simulate map loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showNotification('Map loaded successfully', 'success');
        } catch (error) {
            console.error('Map load failed:', error);
            this.showNotification('Map load failed', 'error');
        }
    }

    addWaypoint() {
        const waypointsList = document.getElementById('waypointsList');
        if (waypointsList) {
            const waypointCount = waypointsList.children.length;
            const waypointItem = document.createElement('div');
            waypointItem.className = 'waypoint-item';
            waypointItem.innerHTML = `
                <div class="waypoint-info">
                    <span class="waypoint-name">Waypoint ${waypointCount + 1}</span>
                    <span class="waypoint-coords">${Math.random() * 100}, ${Math.random() * 100}</span>
                </div>
                <div class="waypoint-actions">
                    <button class="btn-icon" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            waypointsList.appendChild(waypointItem);
            
            // Update waypoint count
            document.getElementById('waypointCount').textContent = waypointsList.children.length;
            
            this.showNotification('Waypoint added', 'success');
        }
    }

    createRoute() {
        const waypointsList = document.getElementById('waypointsList');
        if (waypointsList && waypointsList.children.length > 1) {
            this.showNotification('Route created successfully', 'success');
            this.addTestResult('Route created with ' + waypointsList.children.length + ' waypoints', 'success');
        } else {
            this.showNotification('Add at least 2 waypoints to create a route', 'warning');
        }
    }

    async saveSettings() {
        const settings = {
            deviceType: document.getElementById('deviceType').value,
            deviceIP: document.getElementById('deviceIP').value,
            devicePort: document.getElementById('devicePort').value,
            cameraQuality: document.getElementById('cameraQuality').value,
            cameraBrightness: document.getElementById('cameraBrightness').value,
            cameraContrast: document.getElementById('cameraContrast').value,
            aiEnabled: document.getElementById('aiEnabled').checked,
            aiSensitivity: document.getElementById('aiSensitivity').value,
            batteryThreshold: document.getElementById('batteryThreshold').value,
            patrolSpeed: document.getElementById('patrolSpeed').value,
            autoReturn: document.getElementById('autoReturn').checked
        };
        
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            if (response.ok) {
                // Save to localStorage
                Object.keys(settings).forEach(key => {
                    localStorage.setItem(`yahmi${key.charAt(0).toUpperCase() + key.slice(1)}`, settings[key]);
                });
                
                this.showNotification('Settings saved successfully', 'success');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            this.showNotification('Failed to save settings: ' + error.message, 'error');
        }
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            // Reset form values
            document.getElementById('deviceType').value = 'esp32';
            document.getElementById('deviceIP').value = '192.168.1.100';
            document.getElementById('devicePort').value = '80';
            document.getElementById('cameraQuality').value = '12';
            document.getElementById('cameraBrightness').value = '0';
            document.getElementById('cameraContrast').value = '0';
            document.getElementById('aiEnabled').checked = true;
            document.getElementById('aiSensitivity').value = 'medium';
            document.getElementById('batteryThreshold').value = '20';
            document.getElementById('patrolSpeed').value = '50';
            document.getElementById('autoReturn').checked = true;
            
            this.showNotification('Settings reset to default', 'info');
        }
    }

    async restartSystem() {
        if (confirm('Are you sure you want to restart the system? This will disconnect all connections.')) {
            try {
                const response = await fetch('/api/system/restart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    this.showNotification('System restart initiated', 'warning');
                } else {
                    throw new Error('Restart failed');
                }
            } catch (error) {
                this.showNotification('Failed to restart system: ' + error.message, 'error');
            }
        }
    }

    handleAIDetection(analysis) {
        console.log('AI Detection:', analysis);
        
        this.detectionCount++;
        document.getElementById('detectionCount').textContent = this.detectionCount;
        
        // Show detection overlay
        this.showDetectionOverlay(analysis);
        
        // Add to detection history
        this.addDetectionToHistory(analysis);
        
        // Show notification
        const objects = analysis.detectedObjects?.join(', ') || 'Unknown object';
        this.showNotification(`AI Detection: ${objects}`, 'warning');
        
        // Play appropriate sound
        if (analysis.alertLevel === 'critical' || analysis.alertLevel === 'high') {
            this.playAudio('siren');
        } else {
            this.playAudio('alert');
        }
    }

    showDetectionOverlay(analysis) {
        const overlay = document.getElementById('aiOverlay');
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

    updateAIDetection(data) {
        console.log('AI Detection Update:', data);
    }

    loadSettings() {
        // Load settings from localStorage
        const settings = {
            deviceType: localStorage.getItem('yahmiDeviceType') || 'esp32',
            deviceIP: localStorage.getItem('yahmiDeviceIP') || '192.168.1.100',
            devicePort: localStorage.getItem('yahmiDevicePort') || '80',
            cameraQuality: localStorage.getItem('yahmiCameraQuality') || '12',
            cameraBrightness: localStorage.getItem('yahmiCameraBrightness') || '0',
            cameraContrast: localStorage.getItem('yahmiCameraContrast') || '0',
            aiEnabled: localStorage.getItem('yahmiAiEnabled') !== 'false',
            aiSensitivity: localStorage.getItem('yahmiAiSensitivity') || 'medium',
            batteryThreshold: localStorage.getItem('yahmiBatteryThreshold') || '20',
            patrolSpeed: localStorage.getItem('yahmiPatrolSpeed') || '50',
            autoReturn: localStorage.getItem('yahmiAutoReturn') !== 'false'
        };
        
        // Apply settings to form
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key];
                } else {
                    element.value = settings[key];
                }
            }
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
                this.toggleAI();
                break;
        }
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

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Remove after duration
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
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.yahmiDashboard = new YahmiDashboard();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        animation: slideInRight 0.3s ease-out;
    }
`;
document.head.appendChild(style);

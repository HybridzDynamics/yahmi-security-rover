// Comprehensive Simulation System for Surveillance Car

class SimulationSystem {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 1.0;
        this.scenario = 'patrol';
        this.startTime = null;
        this.duration = 0;
        this.interval = null;
        
        // Simulation data
        this.simulationData = {
            battery: 100,
            position: { x: 0, y: 0, angle: 0 },
            sensors: {
                ir: [0, 0, 0],
                ultrasonic: 0,
                batteryVoltage: 12.6
            },
            system: {
                cpuFreq: 240,
                freeHeap: 250000,
                uptime: 0,
                storageUsage: 45,
                wifiSSID: 'SurveillanceCar',
                wifiSignal: -45
            },
            detections: [],
            logs: []
        };
        
        // Scenario configurations
        this.scenarios = {
            patrol: {
                name: 'Patrol Mode',
                duration: 300, // 5 minutes
                batteryDrain: 0.1, // 0.1% per second
                movement: true,
                detections: 0.05, // 5% chance per second
                obstacles: 0.02 // 2% chance per second
            },
            obstacle: {
                name: 'Obstacle Avoidance',
                duration: 180, // 3 minutes
                batteryDrain: 0.15,
                movement: true,
                detections: 0.1,
                obstacles: 0.3 // High obstacle chance
            },
            detection: {
                name: 'AI Detection',
                duration: 240, // 4 minutes
                batteryDrain: 0.2, // Higher due to AI processing
                movement: false,
                detections: 0.2, // High detection chance
                obstacles: 0.05
            },
            battery: {
                name: 'Battery Drain',
                duration: 600, // 10 minutes
                batteryDrain: 0.5, // Fast battery drain
                movement: true,
                detections: 0.01,
                obstacles: 0.01
            },
            custom: {
                name: 'Custom Scenario',
                duration: 300,
                batteryDrain: 0.1,
                movement: true,
                detections: 0.05,
                obstacles: 0.02
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeData();
    }

    setupEventListeners() {
        // Simulation control buttons
        document.getElementById('startSimulationBtn')?.addEventListener('click', () => this.startSimulation());
        document.getElementById('pauseSimulationBtn')?.addEventListener('click', () => this.pauseSimulation());
        document.getElementById('stopSimulationBtn')?.addEventListener('click', () => this.stopSimulation());
        document.getElementById('resetSimulationBtn')?.addEventListener('click', () => this.resetSimulation());
        
        // Simulation settings
        document.getElementById('simulationSpeedSlider')?.addEventListener('input', (e) => this.setSpeed(e.target.value));
        document.getElementById('simulationScenario')?.addEventListener('change', (e) => this.setScenario(e.target.value));
        
        // System test button
        document.getElementById('testSystemBtn')?.addEventListener('click', () => this.testSystem());
        document.getElementById('simulationBtn')?.addEventListener('click', () => this.toggleSimulation());
    }

    initializeData() {
        // Initialize with realistic starting values
        this.simulationData.battery = 100;
        this.simulationData.position = { x: 0, y: 0, angle: 0 };
        this.simulationData.sensors = {
            ir: [0, 0, 0],
            ultrasonic: 400,
            batteryVoltage: 12.6
        };
        this.simulationData.system = {
            cpuFreq: 240,
            freeHeap: 250000,
            uptime: 0,
            storageUsage: 45,
            wifiSSID: 'SurveillanceCar',
            wifiSignal: -45
        };
        
        this.updateUI();
    }

    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.duration = 0;
        
        this.updateSimulationStatus('running');
        this.updateSimulationButtons();
        
        // Start simulation loop
        this.interval = setInterval(() => {
            this.updateSimulation();
        }, 1000 / this.speed);
        
        this.showToast('Simulation started', 'success');
        this.addLog('Simulation started', 'info');
    }

    pauseSimulation() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        clearInterval(this.interval);
        
        this.updateSimulationStatus('paused');
        this.updateSimulationButtons();
        
        this.showToast('Simulation paused', 'warning');
        this.addLog('Simulation paused', 'warning');
    }

    resumeSimulation() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        
        this.interval = setInterval(() => {
            this.updateSimulation();
        }, 1000 / this.speed);
        
        this.updateSimulationStatus('running');
        this.updateSimulationButtons();
        
        this.showToast('Simulation resumed', 'info');
        this.addLog('Simulation resumed', 'info');
    }

    stopSimulation() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.interval);
        
        this.updateSimulationStatus('stopped');
        this.updateSimulationButtons();
        
        this.showToast('Simulation stopped', 'info');
        this.addLog('Simulation stopped', 'info');
    }

    resetSimulation() {
        this.stopSimulation();
        this.initializeData();
        this.duration = 0;
        
        this.updateSimulationStatus('stopped');
        this.updateSimulationButtons();
        
        this.showToast('Simulation reset', 'info');
        this.addLog('Simulation reset', 'info');
    }

    updateSimulation() {
        if (!this.isRunning || this.isPaused) return;
        
        this.duration = Math.floor((Date.now() - this.startTime) / 1000);
        
        const scenario = this.scenarios[this.scenario];
        
        // Update battery
        this.simulationData.battery = Math.max(0, this.simulationData.battery - scenario.batteryDrain);
        
        // Update system data
        this.simulationData.system.uptime += 1;
        this.simulationData.system.freeHeap = Math.max(100000, this.simulationData.system.freeHeap - Math.random() * 100);
        
        // Update sensors based on scenario
        this.updateSensors();
        
        // Update position if movement is enabled
        if (scenario.movement) {
            this.updatePosition();
        }
        
        // Check for detections
        if (Math.random() < scenario.detections) {
            this.generateDetection();
        }
        
        // Check for obstacles
        if (Math.random() < scenario.obstacles) {
            this.generateObstacle();
        }
        
        // Update UI
        this.updateUI();
        
        // Check for simulation end conditions
        if (this.simulationData.battery <= 0) {
            this.handleBatteryLow();
        }
        
        if (this.duration >= scenario.duration) {
            this.handleSimulationComplete();
        }
    }

    updateSensors() {
        const scenario = this.scenarios[this.scenario];
        
        // Update IR sensors
        this.simulationData.sensors.ir = this.simulationData.sensors.ir.map(() => 
            Math.floor(Math.random() * 1024)
        );
        
        // Update ultrasonic sensor
        if (scenario.obstacles > 0.1) {
            // High obstacle scenario - closer objects
            this.simulationData.sensors.ultrasonic = Math.random() * 200 + 10;
        } else {
            // Normal scenario - farther objects
            this.simulationData.sensors.ultrasonic = Math.random() * 300 + 50;
        }
        
        // Update battery voltage based on battery percentage
        this.simulationData.sensors.batteryVoltage = 10.5 + (this.simulationData.battery / 100) * 2.1;
    }

    updatePosition() {
        const angle = this.simulationData.position.angle;
        const speed = 0.1; // meters per second
        
        // Move forward
        this.simulationData.position.x += Math.cos(angle) * speed;
        this.simulationData.position.y += Math.sin(angle) * speed;
        
        // Random turns
        if (Math.random() < 0.1) {
            this.simulationData.position.angle += (Math.random() - 0.5) * 0.5;
        }
        
        // Keep angle between 0 and 2π
        this.simulationData.position.angle = this.simulationData.position.angle % (2 * Math.PI);
    }

    generateDetection() {
        const detectionTypes = ['human', 'animal', 'vehicle', 'object'];
        const type = detectionTypes[Math.floor(Math.random() * detectionTypes.length)];
        
        const detection = {
            id: Date.now(),
            type: type,
            confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
            timestamp: Date.now(),
            location: `(${this.simulationData.position.x.toFixed(1)}, ${this.simulationData.position.y.toFixed(1)})`,
            boundingBox: {
                x: Math.random() * 200 + 50,
                y: Math.random() * 150 + 50,
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50
            },
            actions: this.getDetectionActions(type)
        };
        
        this.simulationData.detections.push(detection);
        
        // Trigger detection alert
        this.triggerDetectionAlert(detection);
        
        this.addLog(`${type.toUpperCase()} detected with ${Math.round(detection.confidence * 100)}% confidence`, 'info');
    }

    generateObstacle() {
        this.addLog('Obstacle detected - avoiding', 'warning');
        
        // Simulate obstacle avoidance behavior
        this.simulationData.position.angle += (Math.random() - 0.5) * Math.PI;
    }

    getDetectionActions(type) {
        const actions = {
            human: ['Siren activated', 'Email alert sent', 'Telegram notification sent'],
            animal: ['Low pitch sound played', 'Logged detection'],
            vehicle: ['Alert logged', 'Position recorded'],
            object: ['Object logged', 'Position recorded']
        };
        
        return actions[type] || ['Detection logged'];
    }

    triggerDetectionAlert(detection) {
        // Show detection overlay
        if (window.dashboard) {
            window.dashboard.showDetectionOverlay(
                detection.boundingBox,
                detection.type,
                detection.confidence
            );
        }
        
        // Add to detection history
        if (window.dashboard) {
            window.dashboard.addDetectionToHistory(
                detection.type,
                detection.confidence
            );
        }
        
        // Show alert modal
        if (window.dashboard) {
            window.dashboard.showDetectionAlert(
                detection.type,
                detection.confidence
            );
        }
    }

    handleBatteryLow() {
        this.addLog('Battery critically low - simulation stopping', 'error');
        this.showToast('Battery critically low!', 'error');
        this.stopSimulation();
    }

    handleSimulationComplete() {
        this.addLog('Simulation completed successfully', 'success');
        this.showToast('Simulation completed!', 'success');
        this.stopSimulation();
    }

    updateUI() {
        // Update battery status
        this.updateBatteryStatus(this.simulationData.battery);
        
        // Update sensor data
        this.updateSensorData(this.simulationData.sensors);
        
        // Update system status
        this.updateSystemStatus(this.simulationData.system);
        
        // Update simulation info
        this.updateSimulationInfo();
        
        // Update sensor bars
        this.updateSensorBars();
    }

    updateBatteryStatus(percentage) {
        const batteryElement = document.getElementById('batteryStatus');
        if (batteryElement) {
            const icon = batteryElement.querySelector('i');
            const text = batteryElement.querySelector('span');

            if (text) text.textContent = Math.round(percentage) + '%';

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

    updateSensorData(sensors) {
        // Update IR sensors
        document.getElementById('irLeft').textContent = sensors.ir[0];
        document.getElementById('irCenter').textContent = sensors.ir[1];
        document.getElementById('irRight').textContent = sensors.ir[2];
        
        // Update ultrasonic sensor
        document.getElementById('distance').textContent = sensors.ultrasonic.toFixed(1);
        
        // Update battery voltage
        document.getElementById('batteryVoltage').textContent = sensors.batteryVoltage.toFixed(1);
    }

    updateSystemStatus(system) {
        document.getElementById('cpuFreq').textContent = system.cpuFreq;
        document.getElementById('freeHeap').textContent = system.freeHeap.toLocaleString();
        document.getElementById('uptime').textContent = system.uptime;
        document.getElementById('storageUsage').textContent = system.storageUsage;
        document.getElementById('wifiSSID').textContent = system.wifiSSID;
        document.getElementById('wifiSignal').textContent = system.wifiSignal;
    }

    updateSimulationInfo() {
        const minutes = Math.floor(this.duration / 60);
        const seconds = this.duration % 60;
        document.getElementById('simulationDuration').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('simulationSpeed').textContent = this.speed + 'x';
    }

    updateSensorBars() {
        // Update IR sensor bars
        this.updateSensorBar('irLeftBar', this.simulationData.sensors.ir[0], 1024);
        this.updateSensorBar('irCenterBar', this.simulationData.sensors.ir[1], 1024);
        this.updateSensorBar('irRightBar', this.simulationData.sensors.ir[2], 1024);
        
        // Update ultrasonic sensor bar (inverted - closer = higher bar)
        const ultrasonicPercent = Math.max(0, (400 - this.simulationData.sensors.ultrasonic) / 400 * 100);
        this.updateSensorBar('distanceBar', ultrasonicPercent, 100);
        
        // Update battery bar
        this.updateSensorBar('batteryBar', this.simulationData.battery, 100);
    }

    updateSensorBar(barId, value, max) {
        const bar = document.getElementById(barId);
        if (bar) {
            const percentage = (value / max) * 100;
            bar.style.width = percentage + '%';
            
            // Update bar color based on value
            bar.className = 'sensor-fill';
            if (percentage < 20) {
                bar.classList.add('danger');
            } else if (percentage < 50) {
                bar.classList.add('warning');
            }
        }
    }

    updateSimulationStatus(status) {
        const statusElement = document.getElementById('simulationStatus');
        if (statusElement) {
            const icon = statusElement.querySelector('i');
            const text = statusElement.querySelector('span');
            
            statusElement.className = `status-indicator ${status}`;
            
            if (text) {
                switch (status) {
                    case 'running':
                        text.textContent = 'Running';
                        break;
                    case 'paused':
                        text.textContent = 'Paused';
                        break;
                    case 'stopped':
                        text.textContent = 'Stopped';
                        break;
                }
            }
        }
    }

    updateSimulationButtons() {
        const startBtn = document.getElementById('startSimulationBtn');
        const pauseBtn = document.getElementById('pauseSimulationBtn');
        const stopBtn = document.getElementById('stopSimulationBtn');
        
        if (this.isRunning) {
            if (this.isPaused) {
                if (startBtn) startBtn.textContent = 'Resume';
                if (pauseBtn) pauseBtn.disabled = true;
            } else {
                if (startBtn) startBtn.textContent = 'Start';
                if (pauseBtn) pauseBtn.disabled = false;
            }
            if (stopBtn) stopBtn.disabled = false;
        } else {
            if (startBtn) startBtn.textContent = 'Start';
            if (pauseBtn) pauseBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = true;
        }
    }

    setSpeed(speed) {
        this.speed = parseFloat(speed);
        document.getElementById('simulationSpeedValue').textContent = this.speed + 'x';
        
        // Restart interval with new speed if running
        if (this.isRunning && !this.isPaused) {
            clearInterval(this.interval);
            this.interval = setInterval(() => {
                this.updateSimulation();
            }, 1000 / this.speed);
        }
    }

    setScenario(scenario) {
        this.scenario = scenario;
        this.addLog(`Scenario changed to: ${this.scenarios[scenario].name}`, 'info');
    }

    async testSystem() {
        this.showToast('Running system tests...', 'info');
        
        // Simulate system tests
        const tests = [
            'WiFi Connection Test',
            'Camera Module Test',
            'Sensor Calibration Test',
            'Motor Control Test',
            'Audio System Test',
            'AI Detection Test',
            'Storage System Test'
        ];
        
        for (let i = 0; i < tests.length; i++) {
            await this.delay(500);
            this.addLog(`${tests[i]} - PASSED`, 'info');
        }
        
        this.showToast('All system tests passed!', 'success');
    }

    toggleSimulation() {
        if (this.isRunning) {
            this.stopSimulation();
        } else {
            this.startSimulation();
        }
    }

    addLog(message, level = 'info') {
        const log = {
            timestamp: Date.now(),
            level: level,
            message: message,
            source: 'simulation'
        };
        
        this.simulationData.logs.push(log);
        
        // Keep only last 100 logs
        if (this.simulationData.logs.length > 100) {
            this.simulationData.logs.shift();
        }
        
        console.log(`[${level.toUpperCase()}] ${message}`);
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get simulation data for external use
    getSimulationData() {
        return this.simulationData;
    }

    // Get current simulation status
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            speed: this.speed,
            scenario: this.scenario,
            duration: this.duration
        };
    }
}

// Initialize simulation system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.simulationSystem = new SimulationSystem();
});

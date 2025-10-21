// Settings Management System
class SettingsManager {
    constructor() {
        this.settings = {};
        this.defaultSettings = {};
        this.isLoading = false;
        this.hasUnsavedChanges = false;
        
        this.init();
    }
    
    init() {
        this.loadDefaultSettings();
        this.setupEventListeners();
        this.loadSettings();
        this.updateUI();
    }
    
    loadDefaultSettings() {
        this.defaultSettings = {
            general: {
                systemName: 'Surveillance Car',
                systemVersion: '1.0.0',
                timezone: 'UTC',
                language: 'en',
                autoStart: true,
                enableLogging: true
            },
            ai: {
                enabled: false,
                provider: 'gemini',
                apiKey: '',
                confidenceThreshold: 0.7,
                enableHumanDetection: true,
                enableAnimalDetection: true,
                enableVehicleDetection: false,
                enableObjectDetection: false,
                detectionInterval: 5
            },
            notifications: {
                email: {
                    enabled: false,
                    smtpHost: '',
                    smtpPort: 587,
                    smtpUser: '',
                    smtpPassword: '',
                    smtpSecure: false,
                    from: '',
                    fromName: 'Surveillance Car'
                },
                telegram: {
                    enabled: false,
                    botToken: '',
                    chatId: ''
                },
                types: {
                    humanDetection: true,
                    animalDetection: true,
                    systemAlert: true,
                    batteryLow: true,
                    connectionLost: true
                }
            },
            network: {
                wifiSSID: '',
                wifiPassword: '',
                hostname: 'surveillance-car',
                port: 80,
                websocketPort: 81
            },
            camera: {
                resolution: '640x480',
                quality: 12,
                brightness: 0,
                contrast: 0,
                saturation: 0,
                frameRate: 15
            },
            sensors: {
                updateInterval: 1000,
                ultrasonicThreshold: 50,
                irThreshold: 512,
                batteryLowThreshold: 20,
                batteryCriticalThreshold: 5
            },
            patrol: {
                enabled: false,
                speed: 150,
                interval: 30,
                timeout: 60,
                returnHome: true,
                avoidObstacles: true
            },
            security: {
                enableAuthentication: false,
                username: 'admin',
                password: '',
                sessionTimeout: 30,
                enableHTTPS: false,
                apiKey: ''
            }
        };
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Save all settings
        document.getElementById('saveAllSettingsBtn')?.addEventListener('click', () => {
            this.saveAllSettings();
        });
        
        // Reset settings
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
            this.resetSettings();
        });
        
        // Export settings
        document.getElementById('exportSettingsBtn')?.addEventListener('click', () => {
            this.exportSettings();
        });
        
        // Import settings
        document.getElementById('importSettingsBtn')?.addEventListener('click', () => {
            this.showImportModal();
        });
        
        // Import settings confirm
        document.getElementById('importSettingsConfirmBtn')?.addEventListener('click', () => {
            this.importSettings();
        });
        
        // Import settings cancel
        document.getElementById('importSettingsCancelBtn')?.addEventListener('click', () => {
            this.hideImportModal();
        });
        
        // Settings file input
        document.getElementById('settingsFile')?.addEventListener('change', (e) => {
            this.handleSettingsFile(e.target.files[0]);
        });
        
        // Range sliders
        this.setupRangeSliders();
        
        // Form inputs
        this.setupFormInputs();
        
        // Test buttons
        this.setupTestButtons();
    }
    
    setupRangeSliders() {
        // Confidence threshold
        const confidenceSlider = document.getElementById('confidenceThreshold');
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = Math.round(e.target.value * 100) + '%';
                this.markAsChanged();
            });
        }
        
        // Camera quality
        const qualitySlider = document.getElementById('cameraQuality');
        const qualityValue = document.getElementById('cameraQualityValue');
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                qualityValue.textContent = e.target.value;
                this.markAsChanged();
            });
        }
        
        // Camera brightness
        const brightnessSlider = document.getElementById('cameraBrightness');
        const brightnessValue = document.getElementById('cameraBrightnessValue');
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.addEventListener('input', (e) => {
                brightnessValue.textContent = e.target.value;
                this.markAsChanged();
            });
        }
        
        // Camera contrast
        const contrastSlider = document.getElementById('cameraContrast');
        const contrastValue = document.getElementById('cameraContrastValue');
        if (contrastSlider && contrastValue) {
            contrastSlider.addEventListener('input', (e) => {
                contrastValue.textContent = e.target.value;
                this.markAsChanged();
            });
        }
        
        // Camera saturation
        const saturationSlider = document.getElementById('cameraSaturation');
        const saturationValue = document.getElementById('cameraSaturationValue');
        if (saturationSlider && saturationValue) {
            saturationSlider.addEventListener('input', (e) => {
                saturationValue.textContent = e.target.value;
                this.markAsChanged();
            });
        }
        
        // Patrol speed
        const patrolSpeedSlider = document.getElementById('patrolSpeed');
        const patrolSpeedValue = document.getElementById('patrolSpeedValue');
        if (patrolSpeedSlider && patrolSpeedValue) {
            patrolSpeedSlider.addEventListener('input', (e) => {
                patrolSpeedValue.textContent = e.target.value;
                this.markAsChanged();
            });
        }
    }
    
    setupFormInputs() {
        // Add event listeners to all form inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => {
                this.markAsChanged();
            });
            
            input.addEventListener('input', () => {
                this.markAsChanged();
            });
        });
    }
    
    setupTestButtons() {
        // Test email button
        document.getElementById('testEmailBtn')?.addEventListener('click', () => {
            this.testEmail();
        });
        
        // Test Telegram button
        document.getElementById('testTelegramBtn')?.addEventListener('click', () => {
            this.testTelegram();
        });
        
        // Generate API key button
        document.getElementById('generateApiKeyBtn')?.addEventListener('click', () => {
            this.generateApiKey();
        });
    }
    
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(tabName);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Add active class to selected tab button
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
    }
    
    loadSettings() {
        try {
            // Load from localStorage
            const savedSettings = localStorage.getItem('surveillance_settings');
            if (savedSettings) {
                this.settings = { ...this.defaultSettings, ...JSON.parse(savedSettings) };
            } else {
                this.settings = { ...this.defaultSettings };
            }
            
            // Load from server if available
            this.loadSettingsFromServer();
            
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }
    
    async loadSettingsFromServer() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const serverSettings = await response.json();
                this.settings = { ...this.settings, ...serverSettings };
                this.updateUI();
            }
        } catch (error) {
            console.warn('Could not load settings from server:', error);
        }
    }
    
    updateUI() {
        // Update general settings
        this.updateGeneralSettings();
        
        // Update AI settings
        this.updateAISettings();
        
        // Update notification settings
        this.updateNotificationSettings();
        
        // Update network settings
        this.updateNetworkSettings();
        
        // Update camera settings
        this.updateCameraSettings();
        
        // Update sensor settings
        this.updateSensorSettings();
        
        // Update patrol settings
        this.updatePatrolSettings();
        
        // Update security settings
        this.updateSecuritySettings();
    }
    
    updateGeneralSettings() {
        const general = this.settings.general || {};
        
        document.getElementById('systemName').value = general.systemName || '';
        document.getElementById('systemVersion').value = general.systemVersion || '1.0.0';
        document.getElementById('timezone').value = general.timezone || 'UTC';
        document.getElementById('language').value = general.language || 'en';
        document.getElementById('autoStart').checked = general.autoStart || false;
        document.getElementById('enableLogging').checked = general.enableLogging || false;
    }
    
    updateAISettings() {
        const ai = this.settings.ai || {};
        
        document.getElementById('aiEnabled').checked = ai.enabled || false;
        document.getElementById('aiProvider').value = ai.provider || 'gemini';
        document.getElementById('aiApiKey').value = ai.apiKey || '';
        document.getElementById('confidenceThreshold').value = ai.confidenceThreshold || 0.7;
        document.getElementById('confidenceValue').textContent = Math.round((ai.confidenceThreshold || 0.7) * 100) + '%';
        document.getElementById('enableHumanDetection').checked = ai.enableHumanDetection || false;
        document.getElementById('enableAnimalDetection').checked = ai.enableAnimalDetection || false;
        document.getElementById('enableVehicleDetection').checked = ai.enableVehicleDetection || false;
        document.getElementById('enableObjectDetection').checked = ai.enableObjectDetection || false;
        document.getElementById('detectionInterval').value = ai.detectionInterval || 5;
    }
    
    updateNotificationSettings() {
        const notifications = this.settings.notifications || {};
        const email = notifications.email || {};
        const telegram = notifications.telegram || {};
        const types = notifications.types || {};
        
        // Email settings
        document.getElementById('emailEnabled').checked = email.enabled || false;
        document.getElementById('smtpHost').value = email.smtpHost || '';
        document.getElementById('smtpPort').value = email.smtpPort || 587;
        document.getElementById('smtpUser').value = email.smtpUser || '';
        document.getElementById('smtpPassword').value = email.smtpPassword || '';
        document.getElementById('smtpSecure').checked = email.smtpSecure || false;
        document.getElementById('emailFrom').value = email.from || '';
        document.getElementById('emailFromName').value = email.fromName || 'Surveillance Car';
        
        // Telegram settings
        document.getElementById('telegramEnabled').checked = telegram.enabled || false;
        document.getElementById('botToken').value = telegram.botToken || '';
        document.getElementById('chatId').value = telegram.chatId || '';
        
        // Notification types
        document.getElementById('enableTelegramHumanAlerts').checked = types.humanDetection || false;
        document.getElementById('enableTelegramAnimalAlerts').checked = types.animalDetection || false;
        document.getElementById('enableTelegramSystemAlerts').checked = types.systemAlert || false;
        document.getElementById('enableTelegramBatteryAlerts').checked = types.batteryLow || false;
        document.getElementById('enableTelegramConnectionAlerts').checked = types.connectionLost || false;
    }
    
    updateNetworkSettings() {
        const network = this.settings.network || {};
        
        document.getElementById('wifiSSID').value = network.wifiSSID || '';
        document.getElementById('wifiPassword').value = network.wifiPassword || '';
        document.getElementById('hostname').value = network.hostname || 'surveillance-car';
        document.getElementById('port').value = network.port || 80;
        document.getElementById('websocketPort').value = network.websocketPort || 81;
    }
    
    updateCameraSettings() {
        const camera = this.settings.camera || {};
        
        document.getElementById('cameraResolution').value = camera.resolution || '640x480';
        document.getElementById('cameraQuality').value = camera.quality || 12;
        document.getElementById('cameraQualityValue').textContent = camera.quality || 12;
        document.getElementById('cameraBrightness').value = camera.brightness || 0;
        document.getElementById('cameraBrightnessValue').textContent = camera.brightness || 0;
        document.getElementById('cameraContrast').value = camera.contrast || 0;
        document.getElementById('cameraContrastValue').textContent = camera.contrast || 0;
        document.getElementById('cameraSaturation').value = camera.saturation || 0;
        document.getElementById('cameraSaturationValue').textContent = camera.saturation || 0;
        document.getElementById('cameraFrameRate').value = camera.frameRate || 15;
    }
    
    updateSensorSettings() {
        const sensors = this.settings.sensors || {};
        
        document.getElementById('sensorUpdateInterval').value = sensors.updateInterval || 1000;
        document.getElementById('ultrasonicThreshold').value = sensors.ultrasonicThreshold || 50;
        document.getElementById('irThreshold').value = sensors.irThreshold || 512;
        document.getElementById('batteryLowThreshold').value = sensors.batteryLowThreshold || 20;
        document.getElementById('batteryCriticalThreshold').value = sensors.batteryCriticalThreshold || 5;
    }
    
    updatePatrolSettings() {
        const patrol = this.settings.patrol || {};
        
        document.getElementById('patrolEnabled').checked = patrol.enabled || false;
        document.getElementById('patrolSpeed').value = patrol.speed || 150;
        document.getElementById('patrolSpeedValue').textContent = patrol.speed || 150;
        document.getElementById('patrolInterval').value = patrol.interval || 30;
        document.getElementById('patrolTimeout').value = patrol.timeout || 60;
        document.getElementById('patrolReturnHome').checked = patrol.returnHome || false;
        document.getElementById('patrolAvoidObstacles').checked = patrol.avoidObstacles || false;
    }
    
    updateSecuritySettings() {
        const security = this.settings.security || {};
        
        document.getElementById('enableAuthentication').checked = security.enableAuthentication || false;
        document.getElementById('username').value = security.username || 'admin';
        document.getElementById('password').value = security.password || '';
        document.getElementById('sessionTimeout').value = security.sessionTimeout || 30;
        document.getElementById('enableHTTPS').checked = security.enableHTTPS || false;
        document.getElementById('apiKey').value = security.apiKey || '';
    }
    
    async saveAllSettings() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingOverlay('Saving settings...');
        
        try {
            // Collect all settings from UI
            this.collectSettingsFromUI();
            
            // Save to localStorage
            localStorage.setItem('surveillance_settings', JSON.stringify(this.settings));
            
            // Save to server
            await this.saveSettingsToServer();
            
            // Save to Firebase if available
            if (window.firebaseIntegration) {
                await window.firebaseIntegration.saveSettings(this.settings);
            }
            
            this.hasUnsavedChanges = false;
            this.showAlert('Settings Saved', 'All settings have been saved successfully.');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showAlert('Save Error', 'Failed to save settings: ' + error.message);
        } finally {
            this.isLoading = false;
            this.hideLoadingOverlay();
        }
    }
    
    collectSettingsFromUI() {
        // General settings
        this.settings.general = {
            systemName: document.getElementById('systemName').value,
            systemVersion: document.getElementById('systemVersion').value,
            timezone: document.getElementById('timezone').value,
            language: document.getElementById('language').value,
            autoStart: document.getElementById('autoStart').checked,
            enableLogging: document.getElementById('enableLogging').checked
        };
        
        // AI settings
        this.settings.ai = {
            enabled: document.getElementById('aiEnabled').checked,
            provider: document.getElementById('aiProvider').value,
            apiKey: document.getElementById('aiApiKey').value,
            confidenceThreshold: parseFloat(document.getElementById('confidenceThreshold').value),
            enableHumanDetection: document.getElementById('enableHumanDetection').checked,
            enableAnimalDetection: document.getElementById('enableAnimalDetection').checked,
            enableVehicleDetection: document.getElementById('enableVehicleDetection').checked,
            enableObjectDetection: document.getElementById('enableObjectDetection').checked,
            detectionInterval: parseInt(document.getElementById('detectionInterval').value)
        };
        
        // Notification settings
        this.settings.notifications = {
            email: {
                enabled: document.getElementById('emailEnabled').checked,
                smtpHost: document.getElementById('smtpHost').value,
                smtpPort: parseInt(document.getElementById('smtpPort').value),
                smtpUser: document.getElementById('smtpUser').value,
                smtpPassword: document.getElementById('smtpPassword').value,
                smtpSecure: document.getElementById('smtpSecure').checked,
                from: document.getElementById('emailFrom').value,
                fromName: document.getElementById('emailFromName').value
            },
            telegram: {
                enabled: document.getElementById('telegramEnabled').checked,
                botToken: document.getElementById('botToken').value,
                chatId: document.getElementById('chatId').value
            },
            types: {
                humanDetection: document.getElementById('enableTelegramHumanAlerts').checked,
                animalDetection: document.getElementById('enableTelegramAnimalAlerts').checked,
                systemAlert: document.getElementById('enableTelegramSystemAlerts').checked,
                batteryLow: document.getElementById('enableTelegramBatteryAlerts').checked,
                connectionLost: document.getElementById('enableTelegramConnectionAlerts').checked
            }
        };
        
        // Network settings
        this.settings.network = {
            wifiSSID: document.getElementById('wifiSSID').value,
            wifiPassword: document.getElementById('wifiPassword').value,
            hostname: document.getElementById('hostname').value,
            port: parseInt(document.getElementById('port').value),
            websocketPort: parseInt(document.getElementById('websocketPort').value)
        };
        
        // Camera settings
        this.settings.camera = {
            resolution: document.getElementById('cameraResolution').value,
            quality: parseInt(document.getElementById('cameraQuality').value),
            brightness: parseInt(document.getElementById('cameraBrightness').value),
            contrast: parseInt(document.getElementById('cameraContrast').value),
            saturation: parseInt(document.getElementById('cameraSaturation').value),
            frameRate: parseInt(document.getElementById('cameraFrameRate').value)
        };
        
        // Sensor settings
        this.settings.sensors = {
            updateInterval: parseInt(document.getElementById('sensorUpdateInterval').value),
            ultrasonicThreshold: parseInt(document.getElementById('ultrasonicThreshold').value),
            irThreshold: parseInt(document.getElementById('irThreshold').value),
            batteryLowThreshold: parseInt(document.getElementById('batteryLowThreshold').value),
            batteryCriticalThreshold: parseInt(document.getElementById('batteryCriticalThreshold').value)
        };
        
        // Patrol settings
        this.settings.patrol = {
            enabled: document.getElementById('patrolEnabled').checked,
            speed: parseInt(document.getElementById('patrolSpeed').value),
            interval: parseInt(document.getElementById('patrolInterval').value),
            timeout: parseInt(document.getElementById('patrolTimeout').value),
            returnHome: document.getElementById('patrolReturnHome').checked,
            avoidObstacles: document.getElementById('patrolAvoidObstacles').checked
        };
        
        // Security settings
        this.settings.security = {
            enableAuthentication: document.getElementById('enableAuthentication').checked,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
            enableHTTPS: document.getElementById('enableHTTPS').checked,
            apiKey: document.getElementById('apiKey').value
        };
    }
    
    async saveSettingsToServer() {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.settings)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save settings to server');
            }
        } catch (error) {
            console.warn('Could not save settings to server:', error);
        }
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            this.settings = { ...this.defaultSettings };
            this.updateUI();
            this.hasUnsavedChanges = true;
            this.showAlert('Settings Reset', 'All settings have been reset to default values.');
        }
    }
    
    exportSettings() {
        const settingsData = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([settingsData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `surveillance-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    showImportModal() {
        const modal = document.getElementById('importSettingsModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    hideImportModal() {
        const modal = document.getElementById('importSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    handleSettingsFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target.result);
                this.settings = { ...this.defaultSettings, ...importedSettings };
                this.updateUI();
                this.hasUnsavedChanges = true;
                this.showAlert('Settings Imported', 'Settings have been imported successfully.');
            } catch (error) {
                this.showAlert('Import Error', 'Failed to import settings: Invalid file format.');
            }
        };
        reader.readAsText(file);
    }
    
    importSettings() {
        const fileInput = document.getElementById('settingsFile');
        if (fileInput.files.length > 0) {
            this.handleSettingsFile(fileInput.files[0]);
            this.hideImportModal();
        } else {
            this.showAlert('Import Error', 'Please select a settings file to import.');
        }
    }
    
    async testEmail() {
        try {
            if (window.smtpNotifications) {
                await window.smtpNotifications.sendTestEmail();
            } else {
                this.showAlert('Test Email', 'Email test functionality not available.');
            }
        } catch (error) {
            this.showAlert('Test Email Failed', 'Failed to send test email: ' + error.message);
        }
    }
    
    async testTelegram() {
        try {
            if (window.telegramBot) {
                await window.telegramBot.testBotConnection();
            } else {
                this.showAlert('Test Telegram', 'Telegram test functionality not available.');
            }
        } catch (error) {
            this.showAlert('Test Telegram Failed', 'Failed to send test message: ' + error.message);
        }
    }
    
    generateApiKey() {
        const apiKey = this.generateRandomString(32);
        document.getElementById('apiKey').value = apiKey;
        this.markAsChanged();
    }
    
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    markAsChanged() {
        this.hasUnsavedChanges = true;
        // You could add a visual indicator here
    }
    
    showLoadingOverlay(message) {
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
    
    showAlert(title, message) {
        if (window.dashboard) {
            window.dashboard.showAlert(title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    // Public methods for external use
    getSettings() {
        return this.settings;
    }
    
    getSetting(category, key) {
        return this.settings[category]?.[key];
    }
    
    setSetting(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        this.settings[category][key] = value;
        this.markAsChanged();
    }
    
    hasChanges() {
        return this.hasUnsavedChanges;
    }
}

// Initialize Settings Manager
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});

// Warn user before leaving if there are unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (window.settingsManager && window.settingsManager.hasChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});
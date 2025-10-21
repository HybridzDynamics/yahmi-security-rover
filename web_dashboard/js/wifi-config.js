// Professional WiFi Configuration Handler
// Manages WiFi setup, network scanning, and connection management

class WiFiConfig {
    constructor() {
        this.isScanning = false;
        this.isConnecting = false;
        this.currentStatus = {
            connected: false,
            ssid: '',
            signal: 0,
            ip: '',
            security: ''
        };
        this.availableNetworks = [];
        this.scanInterval = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing WiFi Configuration...');
        
        try {
            this.setupEventListeners();
            await this.loadCurrentStatus();
            this.startNetworkScanning();
            this.startStatusMonitoring();
            
            console.log('WiFi Configuration initialized successfully');
        } catch (error) {
            console.error('WiFi Configuration initialization failed:', error);
            this.showError('WiFi Configuration initialization failed: ' + error.message);
        }
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('wifiConfigForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWiFiConfig();
        });

        // Static IP toggle
        document.getElementById('staticIP')?.addEventListener('change', (e) => {
            this.toggleStaticIPSettings(e.target.checked);
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Network selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.network-item')) {
                this.selectNetwork(e.target.closest('.network-item'));
            }
        });
    }

    async loadCurrentStatus() {
        try {
            const response = await fetch('/api/wifi/status');
            if (response.ok) {
                const status = await response.json();
                this.currentStatus = status;
                this.updateStatusDisplay();
            }
        } catch (error) {
            console.warn('Failed to load current WiFi status:', error);
        }
    }

    updateStatusDisplay() {
        document.getElementById('currentSSID').textContent = this.currentStatus.ssid || 'Not Connected';
        document.getElementById('currentSignal').textContent = this.currentStatus.signal || '-';
        document.getElementById('currentIP').textContent = this.currentStatus.ip || '-';
        document.getElementById('currentSecurity').textContent = this.currentStatus.security || '-';
        
        // Update status indicators
        this.updateStatusIndicators();
    }

    updateStatusIndicators() {
        const wifiStatus = document.getElementById('wifiStatus');
        const internetStatus = document.getElementById('internetStatus');
        const deviceStatus = document.getElementById('deviceStatus');
        
        if (wifiStatus) {
            wifiStatus.className = `status-indicator ${this.currentStatus.connected ? 'connected' : 'disconnected'}`;
            wifiStatus.querySelector('span').textContent = this.currentStatus.connected ? 'Connected' : 'Disconnected';
        }
        
        if (internetStatus) {
            // Check internet connectivity
            this.checkInternetConnectivity().then(connected => {
                internetStatus.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
                internetStatus.querySelector('span').textContent = connected ? 'Internet Available' : 'No Internet';
            });
        }
        
        if (deviceStatus) {
            // Check device connectivity
            this.checkDeviceConnectivity().then(connected => {
                deviceStatus.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
                deviceStatus.querySelector('span').textContent = connected ? 'Device Online' : 'Device Offline';
            });
        }
    }

    async checkInternetConnectivity() {
        try {
            const response = await fetch('https://www.google.com', { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkDeviceConnectivity() {
        try {
            const response = await fetch('/api/health');
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async handleWiFiConfig() {
        if (this.isConnecting) {
            this.showNotification('Already connecting to WiFi...', 'warning');
            return;
        }

        try {
            this.isConnecting = true;
            this.showLoading('Connecting to WiFi...');
            
            const formData = new FormData(document.getElementById('wifiConfigForm'));
            const config = {
                ssid: formData.get('ssid'),
                password: formData.get('password'),
                security: formData.get('security'),
                deviceName: formData.get('deviceName'),
                staticIP: document.getElementById('staticIP').checked,
                autoConnect: document.getElementById('autoConnect').checked,
                hiddenNetwork: document.getElementById('hiddenNetwork').checked
            };

            // Add static IP settings if enabled
            if (config.staticIP) {
                config.staticIPSettings = {
                    ipAddress: formData.get('ipAddress'),
                    subnetMask: formData.get('subnetMask'),
                    gateway: formData.get('gateway'),
                    dns1: formData.get('dns1'),
                    dns2: formData.get('dns2')
                };
            }

            const response = await fetch('/api/wifi/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const result = await response.json();
                this.showSuccess('WiFi connected successfully!', result);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Connection failed');
            }

        } catch (error) {
            console.error('WiFi connection failed:', error);
            this.showError('Failed to connect to WiFi: ' + error.message);
        } finally {
            this.isConnecting = false;
            this.hideLoading();
        }
    }

    async scanNetworks() {
        if (this.isScanning) {
            this.showNotification('Already scanning for networks...', 'info');
            return;
        }

        try {
            this.isScanning = true;
            this.showLoading('Scanning for networks...');
            
            const response = await fetch('/api/wifi/scan');
            if (response.ok) {
                const networks = await response.json();
                this.availableNetworks = networks;
                this.displayNetworks(networks);
            } else {
                throw new Error('Network scan failed');
            }

        } catch (error) {
            console.error('Network scan failed:', error);
            this.showError('Failed to scan networks: ' + error.message);
        } finally {
            this.isScanning = false;
            this.hideLoading();
        }
    }

    displayNetworks(networks) {
        const networksList = document.getElementById('networksList');
        if (!networksList) return;

        if (networks.length === 0) {
            networksList.innerHTML = `
                <div class="no-networks">
                    <i class="fas fa-wifi-slash"></i>
                    <p>No networks found</p>
                </div>
            `;
            return;
        }

        networksList.innerHTML = networks.map(network => `
            <div class="network-item" data-ssid="${network.ssid}" data-security="${network.security}">
                <div class="network-info">
                    <div class="network-name">
                        <i class="fas fa-wifi"></i>
                        <span>${network.ssid}</span>
                    </div>
                    <div class="network-details">
                        <span class="network-security">${network.security}</span>
                        <span class="network-signal">${network.signal} dBm</span>
                    </div>
                </div>
                <div class="network-signal-bar">
                    <div class="signal-level" style="width: ${this.calculateSignalPercentage(network.signal)}%"></div>
                </div>
            </div>
        `).join('');
    }

    calculateSignalPercentage(signal) {
        // Convert dBm to percentage (rough approximation)
        if (signal >= -30) return 100;
        if (signal >= -50) return 80;
        if (signal >= -60) return 60;
        if (signal >= -70) return 40;
        if (signal >= -80) return 20;
        return 10;
    }

    selectNetwork(networkItem) {
        const ssid = networkItem.dataset.ssid;
        const security = networkItem.dataset.security;
        
        document.getElementById('wifiSSID').value = ssid;
        document.getElementById('wifiSecurity').value = security;
        
        // Highlight selected network
        document.querySelectorAll('.network-item').forEach(item => {
            item.classList.remove('selected');
        });
        networkItem.classList.add('selected');
        
        this.showNotification(`Selected network: ${ssid}`, 'info');
    }

    async resetWiFi() {
        if (confirm('Are you sure you want to reset WiFi settings? This will disconnect the device.')) {
            try {
                this.showLoading('Resetting WiFi settings...');
                
                const response = await fetch('/api/wifi/reset', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.showSuccess('WiFi settings reset successfully!', {
                        message: 'The device will restart in AP mode.'
                    });
                    this.currentStatus = {
                        connected: false,
                        ssid: '',
                        signal: 0,
                        ip: '',
                        security: ''
                    };
                    this.updateStatusDisplay();
                } else {
                    throw new Error('Reset failed');
                }
            } catch (error) {
                console.error('WiFi reset failed:', error);
                this.showError('Failed to reset WiFi: ' + error.message);
            } finally {
                this.hideLoading();
            }
        }
    }

    toggleStaticIPSettings(enabled) {
        const staticIPSettings = document.getElementById('staticIPSettings');
        if (staticIPSettings) {
            staticIPSettings.style.display = enabled ? 'block' : 'none';
        }
    }

    startNetworkScanning() {
        // Auto-scan networks every 30 seconds
        this.scanInterval = setInterval(() => {
            if (!this.isScanning && !this.isConnecting) {
                this.scanNetworks();
            }
        }, 30000);
        
        // Initial scan
        setTimeout(() => this.scanNetworks(), 1000);
    }

    startStatusMonitoring() {
        // Update status every 5 seconds
        setInterval(() => {
            this.loadCurrentStatus();
        }, 5000);
    }

    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(title, data) {
        const modal = document.getElementById('successModal');
        const messageElement = document.getElementById('successMessage');
        
        if (modal) {
            modal.style.display = 'block';
        }
        
        if (messageElement) {
            messageElement.textContent = data.message || title;
        }
    }

    showError(message) {
        const modal = document.getElementById('errorModal');
        const messageElement = document.getElementById('errorMessage');
        
        if (modal) {
            modal.style.display = 'block';
        }
        
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
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
        `;
        
        const colors = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function scanNetworks() {
    if (window.wifiConfig) {
        window.wifiConfig.scanNetworks();
    }
}

function resetWiFi() {
    if (window.wifiConfig) {
        window.wifiConfig.resetWiFi();
    }
}

function goToDashboard() {
    window.location.href = 'index.html';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Initialize WiFi configuration when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wifiConfig = new WiFiConfig();
});

// Add CSS for WiFi configuration
const wifiStyle = document.createElement('style');
wifiStyle.textContent = `
    .wifi-config-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    .wifi-config-container h1 {
        color: var(--primary-color);
        margin-bottom: 2rem;
        text-align: center;
    }
    
    .wifi-config-container h2 {
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-size: 1.3rem;
    }
    
    .status-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        box-shadow: var(--box-shadow);
        margin-bottom: 2rem;
    }
    
    .status-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .status-item:last-child {
        border-bottom: none;
    }
    
    .status-item i {
        margin-right: 1rem;
        color: var(--secondary-color);
        width: 20px;
    }
    
    .wifi-config-form {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: var(--border-radius);
        padding: 2rem;
        box-shadow: var(--box-shadow);
        margin-bottom: 2rem;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--primary-color);
    }
    
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);
    }
    
    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--secondary-color);
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 2rem;
    }
    
    .available-networks {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: var(--border-radius);
        padding: 2rem;
        box-shadow: var(--box-shadow);
        margin-bottom: 2rem;
    }
    
    .networks-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .network-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 0.5rem;
        background: #f8f9fa;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        border: 2px solid transparent;
    }
    
    .network-item:hover {
        background: #e9ecef;
        border-color: var(--secondary-color);
    }
    
    .network-item.selected {
        background: rgba(52, 152, 219, 0.1);
        border-color: var(--secondary-color);
    }
    
    .network-info {
        flex: 1;
    }
    
    .network-name {
        display: flex;
        align-items: center;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }
    
    .network-name i {
        margin-right: 0.5rem;
        color: var(--secondary-color);
    }
    
    .network-details {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        color: #6c757d;
    }
    
    .network-signal-bar {
        width: 100px;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .signal-level {
        height: 100%;
        background: linear-gradient(90deg, #e74c3c, #f39c12, #27ae60);
        transition: width 0.3s ease;
    }
    
    .loading-networks {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }
    
    .loading-networks i {
        font-size: 2rem;
        margin-bottom: 1rem;
        animation: spin 1s linear infinite;
    }
    
    .no-networks {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }
    
    .no-networks i {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #dee2e6;
    }
    
    .advanced-settings {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: var(--border-radius);
        padding: 2rem;
        box-shadow: var(--box-shadow);
        margin-bottom: 2rem;
    }
    
    .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .setting-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .setting-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .setting-group input[type="checkbox"] {
        width: auto;
        margin: 0;
    }
    
    .connection-status {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: var(--border-radius);
        padding: 2rem;
        box-shadow: var(--box-shadow);
    }
    
    .status-indicators {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .status-indicator {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: var(--border-radius);
        font-weight: 500;
        transition: var(--transition);
    }
    
    .status-indicator.connected {
        background: var(--success-color);
        color: white;
    }
    
    .status-indicator.disconnected {
        background: var(--danger-color);
        color: white;
    }
    
    .status-indicator i {
        margin-right: 0.5rem;
        font-size: 1.2rem;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        justify-content: center;
    }
    
    @media (max-width: 768px) {
        .wifi-config-container {
            padding: 1rem;
        }
        
        .form-actions {
            flex-direction: column;
        }
        
        .settings-grid {
            grid-template-columns: 1fr;
        }
        
        .status-indicators {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(wifiStyle);

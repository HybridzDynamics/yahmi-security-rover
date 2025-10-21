// API Status Monitoring System
class APIMonitor {
    constructor() {
        this.endpoints = {
            status: '/api/status',
            health: '/api/health',
            system: '/api/system',
            sensors: '/api/sensors',
            logs: '/api/logs',
            detections: '/api/detections'
        };
        
        this.status = {
            connected: false,
            lastCheck: null,
            responseTime: 0,
            errors: 0,
            uptime: 0,
            version: '1.0.0',
            system: 'ESP32 Surveillance Car'
        };
        
        this.checkInterval = 5000; // Check every 5 seconds
        this.intervalId = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }
    
    init() {
        this.startMonitoring();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // API Status button
        document.getElementById('apiStatusBtn')?.addEventListener('click', () => {
            this.showDetailedStatus();
        });
        
        // Manual refresh
        document.getElementById('refreshApiBtn')?.addEventListener('click', () => {
            this.checkAllEndpoints();
        });
    }
    
    startMonitoring() {
        this.intervalId = setInterval(() => {
            this.checkAllEndpoints();
        }, this.checkInterval);
        
        // Initial check
        this.checkAllEndpoints();
    }
    
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    async checkAllEndpoints() {
        const startTime = Date.now();
        let allConnected = true;
        let totalResponseTime = 0;
        let successfulChecks = 0;
        
        const results = {};
        
        for (const [name, endpoint] of Object.entries(this.endpoints)) {
            try {
                const result = await this.checkEndpoint(endpoint);
                results[name] = result;
                
                if (result.success) {
                    successfulChecks++;
                    totalResponseTime += result.responseTime;
                } else {
                    allConnected = false;
                }
            } catch (error) {
                results[name] = {
                    success: false,
                    error: error.message,
                    responseTime: 0
                };
                allConnected = false;
            }
        }
        
        const averageResponseTime = successfulChecks > 0 ? totalResponseTime / successfulChecks : 0;
        
        this.status = {
            ...this.status,
            connected: allConnected,
            lastCheck: new Date().toISOString(),
            responseTime: Math.round(averageResponseTime),
            errors: this.status.errors + (allConnected ? 0 : 1),
            uptime: this.status.uptime + (this.checkInterval / 1000)
        };
        
        this.updateUI(results);
        this.updateStatusIndicator();
        
        // Reset retry count on successful connection
        if (allConnected) {
            this.retryCount = 0;
        } else {
            this.retryCount++;
            if (this.retryCount >= this.maxRetries) {
                this.handleConnectionFailure();
            }
        }
    }
    
    async checkEndpoint(endpoint) {
        const startTime = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(endpoint, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    data: data,
                    responseTime: responseTime,
                    status: response.status
                };
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    responseTime: responseTime,
                    status: response.status
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                error: error.name === 'AbortError' ? 'Timeout' : error.message,
                responseTime: responseTime,
                status: 0
            };
        }
    }
    
    updateUI(results) {
        // Update API status display
        const statusElement = document.getElementById('apiStatus');
        if (statusElement) {
            const connectedCount = Object.values(results).filter(r => r.success).length;
            const totalCount = Object.keys(results).length;
            
            statusElement.innerHTML = `
                <div class="api-status-header">
                    <h4>API Status</h4>
                    <span class="status-badge ${this.status.connected ? 'connected' : 'disconnected'}">
                        ${this.status.connected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                <div class="api-status-details">
                    <div class="status-item">
                        <span>Endpoints:</span>
                        <span>${connectedCount}/${totalCount}</span>
                    </div>
                    <div class="status-item">
                        <span>Response Time:</span>
                        <span>${this.status.responseTime}ms</span>
                    </div>
                    <div class="status-item">
                        <span>Last Check:</span>
                        <span>${this.formatTime(this.status.lastCheck)}</span>
                    </div>
                    <div class="status-item">
                        <span>Errors:</span>
                        <span class="${this.status.errors > 0 ? 'error' : 'success'}">${this.status.errors}</span>
                    </div>
                </div>
            `;
        }
        
        // Update individual endpoint status
        this.updateEndpointStatuses(results);
    }
    
    updateEndpointStatuses(results) {
        const container = document.getElementById('endpointStatuses');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [name, result] of Object.entries(results)) {
            const endpointElement = document.createElement('div');
            endpointElement.className = `endpoint-status ${result.success ? 'success' : 'error'}`;
            
            endpointElement.innerHTML = `
                <div class="endpoint-name">${name.toUpperCase()}</div>
                <div class="endpoint-details">
                    <span class="status-indicator ${result.success ? 'connected' : 'disconnected'}">
                        <i class="fas fa-${result.success ? 'check-circle' : 'times-circle'}"></i>
                    </span>
                    <span class="response-time">${result.responseTime}ms</span>
                    ${!result.success ? `<span class="error-message">${result.error}</span>` : ''}
                </div>
            `;
            
            container.appendChild(endpointElement);
        }
    }
    
    updateStatusIndicator() {
        const indicator = document.getElementById('apiStatusIndicator');
        if (indicator) {
            const icon = indicator.querySelector('i');
            const text = indicator.querySelector('span');
            
            if (this.status.connected) {
                indicator.className = 'status-indicator connected';
                if (icon) icon.className = 'fas fa-check-circle';
                if (text) text.textContent = 'API Connected';
            } else {
                indicator.className = 'status-indicator disconnected';
                if (icon) icon.className = 'fas fa-times-circle';
                if (text) text.textContent = 'API Disconnected';
            }
        }
    }
    
    showDetailedStatus() {
        const modal = document.getElementById('apiStatusModal');
        if (modal) {
            modal.style.display = 'block';
            this.populateDetailedStatus();
        }
    }
    
    populateDetailedStatus() {
        const content = document.getElementById('apiStatusContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="api-status-overview">
                <h3>API Status Overview</h3>
                <div class="status-grid">
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-label">System</div>
                            <div class="status-value">${this.status.system}</div>
                        </div>
                    </div>
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="fas fa-tag"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-label">Version</div>
                            <div class="status-value">${this.status.version}</div>
                        </div>
                    </div>
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-label">Uptime</div>
                            <div class="status-value">${this.formatUptime(this.status.uptime)}</div>
                        </div>
                    </div>
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-label">Response Time</div>
                            <div class="status-value">${this.status.responseTime}ms</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint-details">
                <h3>Endpoint Status</h3>
                <div id="endpointStatuses"></div>
            </div>
            
            <div class="api-actions">
                <button id="refreshApiBtn" class="btn btn-primary">
                    <i class="fas fa-sync-alt"></i> Refresh Status
                </button>
                <button id="testApiBtn" class="btn btn-secondary">
                    <i class="fas fa-vial"></i> Test All Endpoints
                </button>
            </div>
        `;
        
        // Re-attach event listeners
        document.getElementById('refreshApiBtn')?.addEventListener('click', () => {
            this.checkAllEndpoints();
        });
        
        document.getElementById('testApiBtn')?.addEventListener('click', () => {
            this.runComprehensiveTest();
        });
    }
    
    async runComprehensiveTest() {
        const testButton = document.getElementById('testApiBtn');
        if (testButton) {
            testButton.disabled = true;
            testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        }
        
        try {
            const results = await this.testAllEndpoints();
            this.showTestResults(results);
        } catch (error) {
            console.error('Comprehensive test failed:', error);
        } finally {
            if (testButton) {
                testButton.disabled = false;
                testButton.innerHTML = '<i class="fas fa-vial"></i> Test All Endpoints';
            }
        }
    }
    
    async testAllEndpoints() {
        const results = {};
        const testData = {
            status: { expected: 'object', timeout: 5000 },
            health: { expected: 'object', timeout: 3000 },
            system: { expected: 'object', timeout: 5000 },
            sensors: { expected: 'array', timeout: 3000 },
            logs: { expected: 'array', timeout: 5000 },
            detections: { expected: 'array', timeout: 5000 }
        };
        
        for (const [endpoint, config] of Object.entries(testData)) {
            const startTime = Date.now();
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(this.endpoints[endpoint], {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    const isValidType = this.validateResponseType(data, config.expected);
                    
                    results[endpoint] = {
                        success: true,
                        status: response.status,
                        responseTime: responseTime,
                        dataSize: JSON.stringify(data).length,
                        validType: isValidType,
                        data: data
                    };
                } else {
                    results[endpoint] = {
                        success: false,
                        status: response.status,
                        responseTime: responseTime,
                        error: `HTTP ${response.status}`
                    };
                }
            } catch (error) {
                results[endpoint] = {
                    success: false,
                    error: error.name === 'AbortError' ? 'Timeout' : error.message,
                    responseTime: Date.now() - startTime
                };
            }
        }
        
        return results;
    }
    
    validateResponseType(data, expectedType) {
        switch (expectedType) {
            case 'object':
                return typeof data === 'object' && !Array.isArray(data);
            case 'array':
                return Array.isArray(data);
            case 'string':
                return typeof data === 'string';
            case 'number':
                return typeof data === 'number';
            default:
                return true;
        }
    }
    
    showTestResults(results) {
        const modal = document.getElementById('testResultsModal');
        if (!modal) return;
        
        const content = document.getElementById('testResultsContent');
        if (!content) return;
        
        let html = '<div class="test-results">';
        html += '<h3>Comprehensive API Test Results</h3>';
        
        for (const [endpoint, result] of Object.entries(results)) {
            const statusClass = result.success ? 'success' : 'error';
            const statusIcon = result.success ? 'check-circle' : 'times-circle';
            
            html += `
                <div class="test-result ${statusClass}">
                    <div class="test-header">
                        <div class="test-endpoint">
                            <i class="fas fa-${statusIcon}"></i>
                            <span>${endpoint.toUpperCase()}</span>
                        </div>
                        <div class="test-status">
                            ${result.success ? 'PASS' : 'FAIL'}
                        </div>
                    </div>
                    <div class="test-details">
                        <div class="test-info">
                            <span>Response Time: ${result.responseTime}ms</span>
                            ${result.status ? `<span>Status: ${result.status}</span>` : ''}
                            ${result.dataSize ? `<span>Data Size: ${result.dataSize} bytes</span>` : ''}
                        </div>
                        ${result.error ? `<div class="test-error">Error: ${result.error}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        content.innerHTML = html;
        modal.style.display = 'block';
    }
    
    handleConnectionFailure() {
        console.error('API connection failed after maximum retries');
        this.showAlert('API Connection Failed', 'Unable to connect to surveillance car API. Please check the connection and try again.');
        
        // Attempt to reconnect
        setTimeout(() => {
            this.retryCount = 0;
            this.checkAllEndpoints();
        }, 10000); // Retry after 10 seconds
    }
    
    showAlert(title, message) {
        // Use existing alert system
        if (window.dashboard) {
            window.dashboard.showAlert(title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    formatTime(timestamp) {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    getStatus() {
        return this.status;
    }
    
    getEndpointResults() {
        return this.endpointResults || {};
    }
}

// Initialize API Monitor
document.addEventListener('DOMContentLoaded', () => {
    window.apiMonitor = new APIMonitor();
});

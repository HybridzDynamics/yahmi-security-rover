// System Logs Management
class SystemLogs {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevels = ['debug', 'info', 'warning', 'error', 'critical'];
        this.sources = ['system', 'sensors', 'camera', 'ai', 'network', 'storage', 'motor', 'audio'];
        this.filters = {
            level: 'all',
            source: 'all',
            search: '',
            dateRange: { start: null, end: null }
        };
        this.isRealTime = true;
        this.autoScroll = true;
        this.logInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startRealTimeLogs();
        this.loadInitialLogs();
    }
    
    setupEventListeners() {
        // Log level filter
        document.getElementById('logLevelFilter')?.addEventListener('change', (e) => {
            this.filters.level = e.target.value;
            this.applyFilters();
        });
        
        // Source filter
        document.getElementById('logSourceFilter')?.addEventListener('change', (e) => {
            this.filters.source = e.target.value;
            this.applyFilters();
        });
        
        // Search filter
        document.getElementById('logSearchInput')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });
        
        // Date range filters
        document.getElementById('logDateStart')?.addEventListener('change', (e) => {
            this.filters.dateRange.start = e.target.value ? new Date(e.target.value) : null;
            this.applyFilters();
        });
        
        document.getElementById('logDateEnd')?.addEventListener('change', (e) => {
            this.filters.dateRange.end = e.target.value ? new Date(e.target.value) : null;
            this.applyFilters();
        });
        
        // Real-time toggle
        document.getElementById('realTimeToggle')?.addEventListener('change', (e) => {
            this.isRealTime = e.target.checked;
            if (this.isRealTime) {
                this.startRealTimeLogs();
            } else {
                this.stopRealTimeLogs();
            }
        });
        
        // Auto-scroll toggle
        document.getElementById('autoScrollToggle')?.addEventListener('change', (e) => {
            this.autoScroll = e.target.checked;
        });
        
        // Clear logs
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
            this.clearLogs();
        });
        
        // Export logs
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => {
            this.exportLogs();
        });
        
        // Refresh logs
        document.getElementById('refreshLogsBtn')?.addEventListener('click', () => {
            this.refreshLogs();
        });
        
        // Log view toggle
        document.getElementById('logViewToggle')?.addEventListener('change', (e) => {
            this.toggleLogView(e.target.value);
        });
    }
    
    async loadInitialLogs() {
        try {
            const response = await fetch('/api/logs?limit=100');
            if (response.ok) {
                const data = await response.json();
                this.logs = data.logs || [];
                this.renderLogs();
                this.updateLogStats();
            }
        } catch (error) {
            console.error('Failed to load initial logs:', error);
            this.addLog('Failed to load logs from server', 'error', 'system');
        }
    }
    
    startRealTimeLogs() {
        if (this.logInterval) {
            clearInterval(this.logInterval);
        }
        
        this.logInterval = setInterval(async () => {
            await this.fetchNewLogs();
        }, 2000); // Check for new logs every 2 seconds
    }
    
    stopRealTimeLogs() {
        if (this.logInterval) {
            clearInterval(this.logInterval);
            this.logInterval = null;
        }
    }
    
    async fetchNewLogs() {
        try {
            const lastLogId = this.logs.length > 0 ? this.logs[this.logs.length - 1].id : 0;
            const response = await fetch(`/api/logs?since=${lastLogId}&limit=50`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.logs && data.logs.length > 0) {
                    this.logs.push(...data.logs);
                    this.trimLogs();
                    this.renderLogs();
                    this.updateLogStats();
                    
                    if (this.autoScroll) {
                        this.scrollToBottom();
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch new logs:', error);
        }
    }
    
    async refreshLogs() {
        this.stopRealTimeLogs();
        await this.loadInitialLogs();
        if (this.isRealTime) {
            this.startRealTimeLogs();
        }
    }
    
    addLog(message, level = 'info', source = 'system', data = null) {
        const log = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level: level,
            source: source,
            message: message,
            data: data
        };
        
        this.logs.push(log);
        this.trimLogs();
        
        if (this.isRealTime) {
            this.renderLogs();
            this.updateLogStats();
            
            if (this.autoScroll) {
                this.scrollToBottom();
            }
        }
    }
    
    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    
    applyFilters() {
        let filteredLogs = [...this.logs];
        
        // Filter by level
        if (this.filters.level !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.level === this.filters.level);
        }
        
        // Filter by source
        if (this.filters.source !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.source === this.filters.source);
        }
        
        // Filter by search term
        if (this.filters.search) {
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(this.filters.search) ||
                log.source.toLowerCase().includes(this.filters.search)
            );
        }
        
        // Filter by date range
        if (this.filters.dateRange.start) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) >= this.filters.dateRange.start
            );
        }
        
        if (this.filters.dateRange.end) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) <= this.filters.dateRange.end
            );
        }
        
        this.renderLogs(filteredLogs);
    }
    
    renderLogs(logsToRender = null) {
        const logsContainer = document.getElementById('logsList');
        if (!logsContainer) return;
        
        const logs = logsToRender || this.logs;
        
        if (logs.length === 0) {
            logsContainer.innerHTML = '<div class="no-logs">No logs found</div>';
            return;
        }
        
        const viewMode = document.getElementById('logViewToggle')?.value || 'list';
        
        if (viewMode === 'timeline') {
            this.renderTimelineView(logs, logsContainer);
        } else if (viewMode === 'grid') {
            this.renderGridView(logs, logsContainer);
        } else {
            this.renderListView(logs, logsContainer);
        }
    }
    
    renderListView(logs, container) {
        container.innerHTML = '';
        
        logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-item ${log.level}`;
            logElement.innerHTML = `
                <div class="log-header">
                    <span class="log-timestamp">${this.formatTimestamp(log.timestamp)}</span>
                    <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                    <span class="log-source">${log.source}</span>
                </div>
                <div class="log-message">${this.escapeHtml(log.message)}</div>
                ${log.data ? `<div class="log-data">${this.formatLogData(log.data)}</div>` : ''}
            `;
            
            logElement.addEventListener('click', () => this.showLogDetail(log));
            container.appendChild(logElement);
        });
    }
    
    renderGridView(logs, container) {
        container.innerHTML = '';
        container.className = 'logs-grid';
        
        logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-card ${log.level}`;
            logElement.innerHTML = `
                <div class="log-card-header">
                    <div class="log-level-badge ${log.level}">${log.level.toUpperCase()}</div>
                    <div class="log-source-badge">${log.source}</div>
                </div>
                <div class="log-card-content">
                    <div class="log-message">${this.escapeHtml(log.message)}</div>
                    <div class="log-timestamp">${this.formatTimestamp(log.timestamp)}</div>
                </div>
                ${log.data ? `<div class="log-data">${this.formatLogData(log.data)}</div>` : ''}
            `;
            
            logElement.addEventListener('click', () => this.showLogDetail(log));
            container.appendChild(logElement);
        });
    }
    
    renderTimelineView(logs, container) {
        container.innerHTML = '';
        container.className = 'logs-timeline';
        
        logs.forEach((log, index) => {
            const logElement = document.createElement('div');
            logElement.className = `timeline-item ${log.level}`;
            
            const isLast = index === logs.length - 1;
            const nextLog = logs[index + 1];
            const timeDiff = nextLog ? 
                new Date(nextLog.timestamp) - new Date(log.timestamp) : 0;
            
            logElement.innerHTML = `
                <div class="timeline-marker ${log.level}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                        <span class="log-source">${log.source}</span>
                        <span class="log-timestamp">${this.formatTimestamp(log.timestamp)}</span>
                    </div>
                    <div class="log-message">${this.escapeHtml(log.message)}</div>
                    ${log.data ? `<div class="log-data">${this.formatLogData(log.data)}</div>` : ''}
                </div>
                ${!isLast ? `<div class="timeline-connector" style="height: ${Math.max(20, timeDiff / 1000)}px"></div>` : ''}
            `;
            
            logElement.addEventListener('click', () => this.showLogDetail(log));
            container.appendChild(logElement);
        });
    }
    
    showLogDetail(log) {
        const modal = document.getElementById('logDetailModal');
        if (!modal) return;
        
        const content = document.getElementById('logDetailContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="log-detail-header">
                <h3>Log Details</h3>
                <div class="log-detail-badges">
                    <span class="log-level-badge ${log.level}">${log.level.toUpperCase()}</span>
                    <span class="log-source-badge">${log.source}</span>
                </div>
            </div>
            
            <div class="log-detail-content">
                <div class="log-detail-item">
                    <label>Timestamp:</label>
                    <span>${this.formatTimestamp(log.timestamp)}</span>
                </div>
                
                <div class="log-detail-item">
                    <label>Message:</label>
                    <div class="log-message-detail">${this.escapeHtml(log.message)}</div>
                </div>
                
                ${log.data ? `
                <div class="log-detail-item">
                    <label>Data:</label>
                    <div class="log-data-detail">${this.formatLogData(log.data)}</div>
                </div>
                ` : ''}
                
                <div class="log-detail-item">
                    <label>Log ID:</label>
                    <span>${log.id}</span>
                </div>
            </div>
            
            <div class="log-detail-actions">
                <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${JSON.stringify(log, null, 2)}')">
                    <i class="fas fa-copy"></i> Copy Log
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    updateLogStats() {
        const stats = this.calculateLogStats();
        
        // Update stats display
        const statsContainer = document.getElementById('logStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Total Logs:</span>
                    <span class="stat-value">${stats.total}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Errors:</span>
                    <span class="stat-value error">${stats.errors}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Warnings:</span>
                    <span class="stat-value warning">${stats.warnings}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Info:</span>
                    <span class="stat-value info">${stats.info}</span>
                </div>
            `;
        }
    }
    
    calculateLogStats() {
        const stats = {
            total: this.logs.length,
            errors: 0,
            warnings: 0,
            info: 0,
            debug: 0,
            critical: 0
        };
        
        this.logs.forEach(log => {
            switch (log.level) {
                case 'error':
                    stats.errors++;
                    break;
                case 'warning':
                    stats.warnings++;
                    break;
                case 'info':
                    stats.info++;
                    break;
                case 'debug':
                    stats.debug++;
                    break;
                case 'critical':
                    stats.critical++;
                    break;
            }
        });
        
        return stats;
    }
    
    clearLogs() {
        if (confirm('Are you sure you want to clear all logs?')) {
            this.logs = [];
            this.renderLogs();
            this.updateLogStats();
        }
    }
    
    exportLogs() {
        const logsToExport = this.logs;
        const dataStr = JSON.stringify(logsToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `surveillance-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
    
    toggleLogView(viewMode) {
        this.renderLogs();
    }
    
    scrollToBottom() {
        const container = document.getElementById('logsList');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
    
    formatLogData(data) {
        if (typeof data === 'object') {
            return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
        return this.escapeHtml(String(data));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Public methods for external use
    addSystemLog(message, level = 'info', data = null) {
        this.addLog(message, level, 'system', data);
    }
    
    addSensorLog(message, level = 'info', data = null) {
        this.addLog(message, level, 'sensors', data);
    }
    
    addCameraLog(message, level = 'info', data = null) {
        this.addLog(message, level, 'camera', data);
    }
    
    addAILog(message, level = 'info', data = null) {
        this.addLog(message, level, 'ai', data);
    }
    
    addNetworkLog(message, level = 'info', data = null) {
        this.addLog(message, level, 'network', data);
    }
    
    getLogs() {
        return this.logs;
    }
    
    getFilteredLogs() {
        return this.getFilteredLogs();
    }
}

// Initialize System Logs
document.addEventListener('DOMContentLoaded', () => {
    window.systemLogs = new SystemLogs();
});

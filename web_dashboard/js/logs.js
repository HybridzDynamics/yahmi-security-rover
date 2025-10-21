// Logs Page JavaScript

class LogsManager {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.logsPerPage = 50;
        this.autoRefresh = false;
        this.refreshInterval = null;
        this.currentFilters = {
            level: 'all',
            source: 'all',
            timeRange: '24h'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLogs();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('logLevelFilter')?.addEventListener('change', (e) => this.filterLogs());
        document.getElementById('logSourceFilter')?.addEventListener('change', (e) => this.filterLogs());
        document.getElementById('logTimeFilter')?.addEventListener('change', (e) => this.filterLogs());

        // Action buttons
        document.getElementById('refreshLogsBtn')?.addEventListener('click', () => this.loadLogs());
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => this.clearLogs());
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => this.exportLogs());
        document.getElementById('autoRefreshToggle')?.addEventListener('click', () => this.toggleAutoRefresh());

        // Search
        document.getElementById('logSearch')?.addEventListener('input', (e) => this.searchLogs(e.target.value));

        // View options
        document.getElementById('compactViewBtn')?.addEventListener('click', () => this.setViewMode('compact'));
        document.getElementById('detailedViewBtn')?.addEventListener('click', () => this.setViewMode('detailed'));

        // Pagination
        document.getElementById('prevPageBtn')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn')?.addEventListener('click', () => this.nextPage());

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });
    }

    async loadLogs() {
        try {
            const response = await fetch('/api/logs');
            if (response.ok) {
                const data = await response.json();
                this.logs = data.logs || [];
                this.filterLogs();
                this.updateStatistics();
            } else {
                throw new Error('Failed to load logs');
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showError('Failed to load logs: ' + error.message);
        }
    }

    filterLogs() {
        const levelFilter = document.getElementById('logLevelFilter')?.value || 'all';
        const sourceFilter = document.getElementById('logSourceFilter')?.value || 'all';
        const timeFilter = document.getElementById('logTimeFilter')?.value || '24h';

        this.currentFilters = { level: levelFilter, source: sourceFilter, timeRange: timeFilter };

        this.filteredLogs = this.logs.filter(log => {
            // Level filter
            if (levelFilter !== 'all' && log.level !== levelFilter) {
                return false;
            }

            // Source filter
            if (sourceFilter !== 'all' && log.source !== sourceFilter) {
                return false;
            }

            // Time filter
            if (timeFilter !== 'all') {
                const logTime = new Date(log.timestamp);
                const now = new Date();
                const timeDiff = now - logTime;

                switch (timeFilter) {
                    case '1h':
                        if (timeDiff > 60 * 60 * 1000) return false;
                        break;
                    case '6h':
                        if (timeDiff > 6 * 60 * 60 * 1000) return false;
                        break;
                    case '24h':
                        if (timeDiff > 24 * 60 * 60 * 1000) return false;
                        break;
                    case '7d':
                        if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
                        break;
                    case '30d':
                        if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false;
                        break;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.displayLogs();
        this.updatePagination();
    }

    searchLogs(query) {
        if (!query.trim()) {
            this.filterLogs();
            return;
        }

        const searchQuery = query.toLowerCase();
        this.filteredLogs = this.logs.filter(log => {
            return log.message.toLowerCase().includes(searchQuery) ||
                   log.source.toLowerCase().includes(searchQuery) ||
                   log.level.toLowerCase().includes(searchQuery);
        });

        this.currentPage = 1;
        this.displayLogs();
        this.updatePagination();
    }

    displayLogs() {
        const logsList = document.getElementById('logsList');
        if (!logsList) return;

        const startIndex = (this.currentPage - 1) * this.logsPerPage;
        const endIndex = startIndex + this.logsPerPage;
        const pageLogs = this.filteredLogs.slice(startIndex, endIndex);

        logsList.innerHTML = '';

        if (pageLogs.length === 0) {
            logsList.innerHTML = '<div class="no-logs">No logs found</div>';
            return;
        }

        pageLogs.forEach(log => {
            const logElement = this.createLogElement(log);
            logsList.appendChild(logElement);
        });
    }

    createLogElement(log) {
        const logDiv = document.createElement('div');
        logDiv.className = `log-item ${log.level}`;
        logDiv.onclick = () => this.showLogDetail(log);

        const timestamp = new Date(log.timestamp).toLocaleString();
        const levelIcon = this.getLevelIcon(log.level);
        const sourceBadge = this.createSourceBadge(log.source);

        logDiv.innerHTML = `
            <div class="log-header">
                <span class="log-timestamp">${timestamp}</span>
                <span class="log-level">${levelIcon} ${log.level.toUpperCase()}</span>
                ${sourceBadge}
            </div>
            <div class="log-message">${this.escapeHtml(log.message)}</div>
            ${log.data ? '<div class="log-data">' + this.escapeHtml(JSON.stringify(log.data, null, 2)) + '</div>' : ''}
        `;

        return logDiv;
    }

    getLevelIcon(level) {
        const icons = {
            debug: '<i class="fas fa-bug"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            error: '<i class="fas fa-times-circle"></i>'
        };
        return icons[level] || '<i class="fas fa-circle"></i>';
    }

    createSourceBadge(source) {
        const colors = {
            system: '#3498db',
            camera: '#e74c3c',
            sensors: '#f39c12',
            ai: '#9b59b6',
            network: '#2ecc71',
            database: '#1abc9c'
        };
        
        const color = colors[source] || '#95a5a6';
        return `<span class="log-source" style="background-color: ${color}">${source}</span>`;
    }

    showLogDetail(log) {
        const modal = document.getElementById('logDetailModal');
        if (!modal) return;

        document.getElementById('detailTimestamp').textContent = new Date(log.timestamp).toLocaleString();
        document.getElementById('detailLevel').textContent = log.level.toUpperCase();
        document.getElementById('detailLevel').className = `log-level ${log.level}`;
        document.getElementById('detailSource').textContent = log.source;
        document.getElementById('detailMessage').textContent = log.message;
        document.getElementById('detailData').textContent = log.data ? JSON.stringify(log.data, null, 2) : 'No data';

        modal.style.display = 'block';
    }

    updateStatistics() {
        const totalLogs = this.logs.length;
        const errorLogs = this.logs.filter(log => log.level === 'error').length;
        const warningLogs = this.logs.filter(log => log.level === 'warning').length;
        const infoLogs = this.logs.filter(log => log.level === 'info').length;

        document.getElementById('totalLogs').textContent = totalLogs;
        document.getElementById('errorLogs').textContent = errorLogs;
        document.getElementById('warningLogs').textContent = warningLogs;
        document.getElementById('infoLogs').textContent = infoLogs;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.logsPerPage);
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayLogs();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.logsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayLogs();
            this.updatePagination();
        }
    }

    setViewMode(mode) {
        const compactBtn = document.getElementById('compactViewBtn');
        const detailedBtn = document.getElementById('detailedViewBtn');
        const logsList = document.getElementById('logsList');

        if (compactBtn) compactBtn.classList.toggle('active', mode === 'compact');
        if (detailedBtn) detailedBtn.classList.toggle('active', mode === 'detailed');
        if (logsList) logsList.className = `logs-list ${mode}-view`;

        this.displayLogs();
    }

    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        const btn = document.getElementById('autoRefreshToggle');
        
        if (this.autoRefresh) {
            this.startAutoRefresh();
            if (btn) {
                btn.innerHTML = '<i class="fas fa-pause"></i> Auto Refresh';
                btn.classList.add('active');
            }
        } else {
            this.stopAutoRefresh();
            if (btn) {
                btn.innerHTML = '<i class="fas fa-play"></i> Auto Refresh';
                btn.classList.remove('active');
            }
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadLogs();
        }, 5000); // Refresh every 5 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async clearLogs() {
        if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
            try {
                const response = await fetch('/api/logs', {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.logs = [];
                    this.filteredLogs = [];
                    this.displayLogs();
                    this.updateStatistics();
                    this.updatePagination();
                    this.showSuccess('Logs cleared successfully');
                } else {
                    throw new Error('Failed to clear logs');
                }
            } catch (error) {
                this.showError('Failed to clear logs: ' + error.message);
            }
        }
    }

    exportLogs() {
        const exportData = {
            logs: this.filteredLogs,
            filters: this.currentFilters,
            exportTime: new Date().toISOString(),
            totalLogs: this.logs.length,
            filteredLogs: this.filteredLogs.length
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `surveillance_logs_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showSuccess('Logs exported successfully');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        this.showAlert('Error', message, 'error');
    }

    showSuccess(message) {
        this.showAlert('Success', message, 'success');
    }

    showAlert(title, message, type = 'info') {
        const modal = document.getElementById('alertModal');
        const titleElement = document.getElementById('alertTitle');
        const messageElement = document.getElementById('alertMessage');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        if (modal) {
            modal.className = `modal ${type}`;
            modal.style.display = 'block';
        }
    }

    closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }
}

// Initialize logs manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.logsManager = new LogsManager();
});

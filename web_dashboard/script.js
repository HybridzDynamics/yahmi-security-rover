// Common JavaScript functionality for all pages

class CommonUtils {
    constructor() {
        this.init();
    }

    init() {
        this.setupCommonEventListeners();
        this.updateConnectionStatus();
    }

    setupCommonEventListeners() {
        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Alert modal
        document.getElementById('alertOk')?.addEventListener('click', () => this.hideAlert());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

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

    updateConnectionStatus() {
        // This will be updated by the main dashboard
        const connectionStatus = document.getElementById('connectionStatus');
        const batteryStatus = document.getElementById('batteryStatus');
        
        if (connectionStatus) {
            connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Connecting...</span>';
        }
        
        if (batteryStatus) {
            batteryStatus.innerHTML = '<i class="fas fa-battery-full"></i><span>0%</span>';
        }
    }

    handleKeyboardShortcuts(e) {
        // ESC key closes modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                this.closeModal(openModal);
            }
        }
    }

    // Utility functions
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize common utilities when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.commonUtils = new CommonUtils();
});
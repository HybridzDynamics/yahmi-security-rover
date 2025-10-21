// Detection Management System
class DetectionManager {
    constructor() {
        this.detections = [];
        this.filteredDetections = [];
        this.filters = {
            type: 'all',
            date: null,
            confidence: 50,
            showOnlyAlerts: false,
            search: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
        this.isRealTime = true;
        this.detectionInterval = null;
        
        // Detection types
        this.detectionTypes = {
            human: { color: '#e74c3c', icon: 'fas fa-user', priority: 'critical' },
            animal: { color: '#f39c12', icon: 'fas fa-paw', priority: 'medium' },
            vehicle: { color: '#3498db', icon: 'fas fa-car', priority: 'low' },
            object: { color: '#95a5a6', icon: 'fas fa-cube', priority: 'low' }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDetections();
        this.startRealTimeUpdates();
    }
    
    setupEventListeners() {
        // Filter controls
        document.getElementById('detectionTypeFilter')?.addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('detectionDateFilter')?.addEventListener('change', (e) => {
            this.filters.date = e.target.value ? new Date(e.target.value) : null;
            this.applyFilters();
        });
        
        document.getElementById('detectionConfidenceFilter')?.addEventListener('input', (e) => {
            this.filters.confidence = parseInt(e.target.value);
            document.getElementById('confidenceFilterValue').textContent = e.target.value + '%';
            this.applyFilters();
        });
        
        document.getElementById('showOnlyAlerts')?.addEventListener('change', (e) => {
            this.filters.showOnlyAlerts = e.target.checked;
            this.applyFilters();
        });
        
        // Search
        document.getElementById('detectionSearchInput')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });
        
        // Real-time toggle
        document.getElementById('realTimeDetections')?.addEventListener('change', (e) => {
            this.isRealTime = e.target.checked;
            if (this.isRealTime) {
                this.startRealTimeUpdates();
            } else {
                this.stopRealTimeUpdates();
            }
        });
        
        // View toggle
        document.getElementById('detectionViewToggle')?.addEventListener('change', (e) => {
            this.toggleView(e.target.value);
        });
        
        // Toolbar actions
        document.getElementById('refreshDetectionsBtn')?.addEventListener('click', () => {
            this.refreshDetections();
        });
        
        document.getElementById('exportDetectionsBtn')?.addEventListener('click', () => {
            this.exportDetections();
        });
        
        document.getElementById('clearDetectionsBtn')?.addEventListener('click', () => {
            this.clearDetections();
        });
        
        // Pagination
        document.getElementById('prevPageBtn')?.addEventListener('click', () => {
            this.previousPage();
        });
        
        document.getElementById('nextPageBtn')?.addEventListener('click', () => {
            this.nextPage();
        });
    }
    
    async loadDetections() {
        try {
            // Load from Firebase if available
            if (window.firebaseIntegration) {
                const detections = await window.firebaseIntegration.getDetections(100);
                this.detections = detections;
            } else {
                // Load from localStorage as fallback
                const savedDetections = localStorage.getItem('surveillance_detections');
                if (savedDetections) {
                    this.detections = JSON.parse(savedDetections);
                }
            }
            
            this.applyFilters();
            this.updateStats();
            this.renderDetections();
            
        } catch (error) {
            console.error('Failed to load detections:', error);
            this.showAlert('Load Error', 'Failed to load detections: ' + error.message);
        }
    }
    
    async refreshDetections() {
        this.showLoadingOverlay('Refreshing detections...');
        await this.loadDetections();
        this.hideLoadingOverlay();
    }
    
    startRealTimeUpdates() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        
        this.detectionInterval = setInterval(async () => {
            await this.fetchNewDetections();
        }, 5000); // Check for new detections every 5 seconds
    }
    
    stopRealTimeUpdates() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }
    
    async fetchNewDetections() {
        try {
            const response = await fetch('/api/detections?limit=10');
            if (response.ok) {
                const data = await response.json();
                if (data.detections && data.detections.length > 0) {
                    // Add new detections
                    data.detections.forEach(detection => {
                        if (!this.detections.find(d => d.id === detection.id)) {
                            this.detections.unshift(detection);
                        }
                    });
                    
                    // Keep only recent detections
                    if (this.detections.length > 1000) {
                        this.detections = this.detections.slice(0, 1000);
                    }
                    
                    this.applyFilters();
                    this.updateStats();
                    this.renderDetections();
                }
            }
        } catch (error) {
            console.error('Failed to fetch new detections:', error);
        }
    }
    
    addDetection(detection) {
        const detectionData = {
            id: detection.id || this.generateId(),
            type: detection.type,
            confidence: detection.confidence,
            timestamp: detection.timestamp || new Date().toISOString(),
            location: detection.location || 'Unknown',
            description: detection.description || '',
            boundingBox: detection.boundingBox || null,
            imageUrl: detection.imageUrl || null,
            actions: detection.actions || [],
            priority: this.detectionTypes[detection.type]?.priority || 'low'
        };
        
        this.detections.unshift(detectionData);
        
        // Save to Firebase
        if (window.firebaseIntegration) {
            window.firebaseIntegration.saveDetection(detectionData);
        }
        
        // Save to localStorage as backup
        this.saveDetectionsToLocalStorage();
        
        this.applyFilters();
        this.updateStats();
        this.renderDetections();
        
        // Show alert for high priority detections
        if (detectionData.priority === 'critical') {
            this.showDetectionAlert(detectionData);
        }
    }
    
    applyFilters() {
        let filtered = [...this.detections];
        
        // Filter by type
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(detection => detection.type === this.filters.type);
        }
        
        // Filter by date
        if (this.filters.date) {
            const filterDate = new Date(this.filters.date);
            filtered = filtered.filter(detection => {
                const detectionDate = new Date(detection.timestamp);
                return detectionDate.toDateString() === filterDate.toDateString();
            });
        }
        
        // Filter by confidence
        filtered = filtered.filter(detection => 
            detection.confidence >= (this.filters.confidence / 100)
        );
        
        // Filter by alerts only
        if (this.filters.showOnlyAlerts) {
            filtered = filtered.filter(detection => 
                detection.priority === 'critical' || detection.priority === 'high'
            );
        }
        
        // Filter by search term
        if (this.filters.search) {
            filtered = filtered.filter(detection =>
                detection.type.toLowerCase().includes(this.filters.search) ||
                detection.description.toLowerCase().includes(this.filters.search) ||
                detection.location.toLowerCase().includes(this.filters.search)
            );
        }
        
        this.filteredDetections = filtered;
        this.updatePagination();
        this.renderDetections();
    }
    
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredDetections.length / this.itemsPerPage);
        this.currentPage = Math.min(this.currentPage, this.totalPages);
        this.currentPage = Math.max(1, this.currentPage);
        
        // Update pagination info
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
        
        // Update pagination buttons
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    }
    
    renderDetections() {
        const container = document.getElementById('detectionsList');
        if (!container) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageDetections = this.filteredDetections.slice(startIndex, endIndex);
        
        if (pageDetections.length === 0) {
            container.innerHTML = '<div class="no-detections">No detections found</div>';
            return;
        }
        
        const viewMode = document.getElementById('detectionViewToggle')?.value || 'list';
        
        if (viewMode === 'timeline') {
            this.renderTimelineView(pageDetections, container);
        } else if (viewMode === 'grid') {
            this.renderGridView(pageDetections, container);
        } else {
            this.renderListView(pageDetections, container);
        }
    }
    
    renderListView(detections, container) {
        container.innerHTML = '';
        
        detections.forEach(detection => {
            const detectionElement = document.createElement('div');
            detectionElement.className = `detection-item ${detection.type}`;
            detectionElement.innerHTML = `
                <div class="detection-image">
                    ${detection.imageUrl ? 
                        `<img src="${detection.imageUrl}" alt="Detection image" onclick="window.detectionManager.showDetectionImage('${detection.id}')">` :
                        '<div class="no-image"><i class="fas fa-image"></i></div>'
                    }
                </div>
                <div class="detection-info">
                    <div class="detection-header">
                        <div class="detection-type">
                            <i class="${this.detectionTypes[detection.type]?.icon}"></i>
                            <span>${detection.type.toUpperCase()}</span>
                        </div>
                        <div class="detection-confidence">
                            ${Math.round(detection.confidence * 100)}%
                        </div>
                    </div>
                    <div class="detection-details">
                        <div class="detection-time">${this.formatTimestamp(detection.timestamp)}</div>
                        <div class="detection-location">${detection.location}</div>
                        <div class="detection-description">${detection.description}</div>
                    </div>
                    <div class="detection-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.detectionManager.showDetectionDetail('${detection.id}')">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.detectionManager.showOnMap('${detection.id}')">
                            <i class="fas fa-map-marker-alt"></i> Map
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.detectionManager.deleteDetection('${detection.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(detectionElement);
        });
    }
    
    renderGridView(detections, container) {
        container.innerHTML = '';
        container.className = 'detections-grid';
        
        detections.forEach(detection => {
            const detectionElement = document.createElement('div');
            detectionElement.className = `detection-card ${detection.type}`;
            detectionElement.innerHTML = `
                <div class="detection-card-header">
                    <div class="detection-type-badge ${detection.type}">
                        <i class="${this.detectionTypes[detection.type]?.icon}"></i>
                        <span>${detection.type.toUpperCase()}</span>
                    </div>
                    <div class="detection-confidence-badge">
                        ${Math.round(detection.confidence * 100)}%
                    </div>
                </div>
                <div class="detection-card-image">
                    ${detection.imageUrl ? 
                        `<img src="${detection.imageUrl}" alt="Detection image" onclick="window.detectionManager.showDetectionImage('${detection.id}')">` :
                        '<div class="no-image"><i class="fas fa-image"></i></div>'
                    }
                </div>
                <div class="detection-card-content">
                    <div class="detection-time">${this.formatTimestamp(detection.timestamp)}</div>
                    <div class="detection-location">${detection.location}</div>
                    <div class="detection-description">${detection.description}</div>
                </div>
                <div class="detection-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.detectionManager.showDetectionDetail('${detection.id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="window.detectionManager.showOnMap('${detection.id}')">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.detectionManager.deleteDetection('${detection.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(detectionElement);
        });
    }
    
    renderTimelineView(detections, container) {
        container.innerHTML = '';
        container.className = 'detections-timeline';
        
        detections.forEach((detection, index) => {
            const detectionElement = document.createElement('div');
            detectionElement.className = `timeline-item ${detection.type}`;
            
            const isLast = index === detections.length - 1;
            const nextDetection = detections[index + 1];
            const timeDiff = nextDetection ? 
                new Date(detection.timestamp) - new Date(nextDetection.timestamp) : 0;
            
            detectionElement.innerHTML = `
                <div class="timeline-marker ${detection.type}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="detection-type">
                            <i class="${this.detectionTypes[detection.type]?.icon}"></i>
                            <span>${detection.type.toUpperCase()}</span>
                        </div>
                        <div class="detection-confidence">
                            ${Math.round(detection.confidence * 100)}%
                        </div>
                        <div class="detection-time">${this.formatTimestamp(detection.timestamp)}</div>
                    </div>
                    <div class="timeline-body">
                        <div class="detection-location">${detection.location}</div>
                        <div class="detection-description">${detection.description}</div>
                        ${detection.imageUrl ? 
                            `<div class="detection-image-small">
                                <img src="${detection.imageUrl}" alt="Detection image" onclick="window.detectionManager.showDetectionImage('${detection.id}')">
                            </div>` : ''
                        }
                    </div>
                    <div class="timeline-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.detectionManager.showDetectionDetail('${detection.id}')">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.detectionManager.showOnMap('${detection.id}')">
                            <i class="fas fa-map-marker-alt"></i> Map
                        </button>
                    </div>
                </div>
                ${!isLast ? `<div class="timeline-connector" style="height: ${Math.max(20, timeDiff / 1000)}px"></div>` : ''}
            `;
            
            container.appendChild(detectionElement);
        });
    }
    
    showDetectionDetail(detectionId) {
        const detection = this.detections.find(d => d.id === detectionId);
        if (!detection) return;
        
        const modal = document.getElementById('detectionDetailModal');
        const content = document.getElementById('detectionDetailContent');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="detection-detail-header">
                    <h3>Detection Details</h3>
                    <div class="detection-detail-badges">
                        <span class="detection-type-badge ${detection.type}">
                            <i class="${this.detectionTypes[detection.type]?.icon}"></i>
                            ${detection.type.toUpperCase()}
                        </span>
                        <span class="confidence-badge">
                            ${Math.round(detection.confidence * 100)}%
                        </span>
                    </div>
                </div>
                
                <div class="detection-detail-content">
                    <div class="detection-detail-item">
                        <label>Timestamp:</label>
                        <span>${this.formatTimestamp(detection.timestamp)}</span>
                    </div>
                    
                    <div class="detection-detail-item">
                        <label>Location:</label>
                        <span>${detection.location}</span>
                    </div>
                    
                    <div class="detection-detail-item">
                        <label>Description:</label>
                        <span>${detection.description}</span>
                    </div>
                    
                    <div class="detection-detail-item">
                        <label>Confidence:</label>
                        <span>${Math.round(detection.confidence * 100)}%</span>
                    </div>
                    
                    <div class="detection-detail-item">
                        <label>Priority:</label>
                        <span class="priority-badge ${detection.priority}">${detection.priority.toUpperCase()}</span>
                    </div>
                    
                    ${detection.boundingBox ? `
                    <div class="detection-detail-item">
                        <label>Bounding Box:</label>
                        <span>X: ${detection.boundingBox.x}, Y: ${detection.boundingBox.y}, W: ${detection.boundingBox.width}, H: ${detection.boundingBox.height}</span>
                    </div>
                    ` : ''}
                    
                    ${detection.actions && detection.actions.length > 0 ? `
                    <div class="detection-detail-item">
                        <label>Actions Taken:</label>
                        <ul>
                            ${detection.actions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                
                ${detection.imageUrl ? `
                <div class="detection-detail-image">
                    <img src="${detection.imageUrl}" alt="Detection image" onclick="window.detectionManager.showDetectionImage('${detection.id}')">
                </div>
                ` : ''}
                
                <div class="detection-detail-actions">
                    <button class="btn btn-primary" onclick="window.detectionManager.showOnMap('${detection.id}')">
                        <i class="fas fa-map-marker-alt"></i> Show on Map
                    </button>
                    <button class="btn btn-secondary" onclick="window.detectionManager.exportDetection('${detection.id}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-danger" onclick="window.detectionManager.deleteDetection('${detection.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            modal.style.display = 'block';
        }
    }
    
    showDetectionImage(detectionId) {
        const detection = this.detections.find(d => d.id === detectionId);
        if (!detection || !detection.imageUrl) return;
        
        const modal = document.getElementById('detectionImageModal');
        const content = document.getElementById('detectionImageContent');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="detection-image-header">
                    <h3>Detection Image</h3>
                    <div class="detection-image-info">
                        <span class="detection-type-badge ${detection.type}">
                            <i class="${this.detectionTypes[detection.type]?.icon}"></i>
                            ${detection.type.toUpperCase()}
                        </span>
                        <span class="confidence-badge">
                            ${Math.round(detection.confidence * 100)}%
                        </span>
                        <span class="detection-time">${this.formatTimestamp(detection.timestamp)}</span>
                    </div>
                </div>
                
                <div class="detection-image-container">
                    <img src="${detection.imageUrl}" alt="Detection image" class="detection-image-full">
                    ${detection.boundingBox ? `
                    <div class="detection-bounding-box" style="
                        left: ${detection.boundingBox.x}px;
                        top: ${detection.boundingBox.y}px;
                        width: ${detection.boundingBox.width}px;
                        height: ${detection.boundingBox.height}px;
                    "></div>
                    ` : ''}
                </div>
                
                <div class="detection-image-actions">
                    <button class="btn btn-primary" onclick="window.detectionManager.downloadImage('${detection.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-secondary" onclick="window.detectionManager.showOnMap('${detection.id}')">
                        <i class="fas fa-map-marker-alt"></i> Show on Map
                    </button>
                </div>
            `;
            
            modal.style.display = 'block';
        }
    }
    
    showOnMap(detectionId) {
        const detection = this.detections.find(d => d.id === detectionId);
        if (!detection) return;
        
        // Switch to map page and show detection
        window.location.href = 'map.html';
        
        // Add detection marker to map
        if (window.interactiveMap) {
            window.interactiveMap.addDetection(detection);
        }
    }
    
    deleteDetection(detectionId) {
        if (confirm('Are you sure you want to delete this detection?')) {
            this.detections = this.detections.filter(d => d.id !== detectionId);
            this.saveDetectionsToLocalStorage();
            this.applyFilters();
            this.updateStats();
            this.renderDetections();
        }
    }
    
    exportDetection(detectionId) {
        const detection = this.detections.find(d => d.id === detectionId);
        if (!detection) return;
        
        const dataStr = JSON.stringify(detection, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `detection-${detectionId}.json`;
        link.click();
    }
    
    downloadImage(detectionId) {
        const detection = this.detections.find(d => d.id === detectionId);
        if (!detection || !detection.imageUrl) return;
        
        const link = document.createElement('a');
        link.href = detection.imageUrl;
        link.download = `detection-${detectionId}.jpg`;
        link.click();
    }
    
    exportDetections() {
        const dataStr = JSON.stringify(this.filteredDetections, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `surveillance-detections-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
    
    clearDetections() {
        if (confirm('Are you sure you want to clear all detections?')) {
            this.detections = [];
            this.saveDetectionsToLocalStorage();
            this.applyFilters();
            this.updateStats();
            this.renderDetections();
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
            this.renderDetections();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
            this.renderDetections();
        }
    }
    
    toggleView(viewMode) {
        this.renderDetections();
    }
    
    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('totalDetections').textContent = stats.total;
        document.getElementById('humanDetections').textContent = stats.human;
        document.getElementById('animalDetections').textContent = stats.animal;
        document.getElementById('vehicleDetections').textContent = stats.vehicle;
    }
    
    calculateStats() {
        const stats = {
            total: this.detections.length,
            human: 0,
            animal: 0,
            vehicle: 0,
            object: 0
        };
        
        this.detections.forEach(detection => {
            switch (detection.type) {
                case 'human':
                    stats.human++;
                    break;
                case 'animal':
                    stats.animal++;
                    break;
                case 'vehicle':
                    stats.vehicle++;
                    break;
                case 'object':
                    stats.object++;
                    break;
            }
        });
        
        return stats;
    }
    
    showDetectionAlert(detection) {
        if (window.dashboard) {
            window.dashboard.showAlert(
                `${detection.type.toUpperCase()} Detected!`,
                `A ${detection.type} has been detected with ${Math.round(detection.confidence * 100)}% confidence.`
            );
        }
    }
    
    saveDetectionsToLocalStorage() {
        localStorage.setItem('surveillance_detections', JSON.stringify(this.detections));
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
    getDetections() {
        return this.detections;
    }
    
    getFilteredDetections() {
        return this.filteredDetections;
    }
    
    addDetection(detection) {
        this.addDetection(detection);
    }
}

// Initialize Detection Manager
document.addEventListener('DOMContentLoaded', () => {
    window.detectionManager = new DetectionManager();
});
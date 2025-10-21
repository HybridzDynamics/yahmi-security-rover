// Interactive Mapping System for Area Surveillance
class InteractiveMap {
    constructor() {
        this.map = null;
        this.carMarker = null;
        this.detectionMarkers = [];
        this.patrolRoute = null;
        this.surveillanceZones = [];
        this.waypoints = [];
        this.isTracking = false;
        this.currentPosition = null;
        this.mapData = null;
        this.slamData = null;
        
        // Map configuration
        this.mapConfig = {
            center: [0, 0], // Default center
            zoom: 15,
            maxZoom: 20,
            minZoom: 10
        };
        
        // Car tracking
        this.trackingHistory = [];
        this.maxHistoryPoints = 1000;
        
        // Detection markers
        this.detectionTypes = {
            human: { color: '#e74c3c', icon: 'fas fa-user' },
            animal: { color: '#f39c12', icon: 'fas fa-paw' },
            vehicle: { color: '#3498db', icon: 'fas fa-car' },
            object: { color: '#95a5a6', icon: 'fas fa-cube' }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeMap();
        this.loadMapData();
        this.startPositionTracking();
    }
    
    setupEventListeners() {
        // Map controls
        document.getElementById('startTrackingBtn')?.addEventListener('click', () => {
            this.startTracking();
        });
        
        document.getElementById('stopTrackingBtn')?.addEventListener('click', () => {
            this.stopTracking();
        });
        
        document.getElementById('clearMapBtn')?.addEventListener('click', () => {
            this.clearMap();
        });
        
        document.getElementById('saveMapBtn')?.addEventListener('click', () => {
            this.saveMapData();
        });
        
        document.getElementById('loadMapBtn')?.addEventListener('click', () => {
            this.loadMapData();
        });
        
        // Patrol controls
        document.getElementById('startPatrolBtn')?.addEventListener('click', () => {
            this.startPatrol();
        });
        
        document.getElementById('stopPatrolBtn')?.addEventListener('click', () => {
            this.stopPatrol();
        });
        
        document.getElementById('addWaypointBtn')?.addEventListener('click', () => {
            this.addWaypoint();
        });
        
        document.getElementById('clearWaypointsBtn')?.addEventListener('click', () => {
            this.clearWaypoints();
        });
        
        // Surveillance zones
        document.getElementById('addSurveillanceZoneBtn')?.addEventListener('click', () => {
            this.addSurveillanceZone();
        });
        
        document.getElementById('clearSurveillanceZonesBtn')?.addEventListener('click', () => {
            this.clearSurveillanceZones();
        });
        
        // Map view controls
        document.getElementById('mapViewToggle')?.addEventListener('change', (e) => {
            this.toggleMapView(e.target.value);
        });
        
        document.getElementById('showDetectionsToggle')?.addEventListener('change', (e) => {
            this.toggleDetectionMarkers(e.target.checked);
        });
        
        document.getElementById('showPatrolRouteToggle')?.addEventListener('change', (e) => {
            this.togglePatrolRoute(e.target.checked);
        });
    }
    
    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('surveillanceMap', {
            center: this.mapConfig.center,
            zoom: this.mapConfig.zoom,
            maxZoom: this.mapConfig.maxZoom,
            minZoom: this.mapConfig.minZoom
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Add scale control
        L.control.scale().addTo(this.map);
        
        // Add fullscreen control
        this.map.addControl(new L.Control.Fullscreen());
        
        // Add custom controls
        this.addCustomControls();
        
        // Set up map event listeners
        this.setupMapEventListeners();
        
        console.log('Interactive map initialized');
    }
    
    addCustomControls() {
        // Add custom control panel
        const controlPanel = L.control({ position: 'topright' });
        
        controlPanel.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'map-control-panel');
            div.innerHTML = `
                <div class="map-controls">
                    <h4>Map Controls</h4>
                    <div class="control-group">
                        <button id="centerOnCarBtn" class="btn btn-sm btn-primary">
                            <i class="fas fa-crosshairs"></i> Center on Car
                        </button>
                        <button id="fitBoundsBtn" class="btn btn-sm btn-secondary">
                            <i class="fas fa-expand"></i> Fit All
                        </button>
                    </div>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="showTrackingHistory" checked>
                            Show Tracking History
                        </label>
                    </div>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="showSurveillanceZones" checked>
                            Show Surveillance Zones
                        </label>
                    </div>
                </div>
            `;
            
            // Add event listeners
            div.querySelector('#centerOnCarBtn').addEventListener('click', () => {
                if (window.interactiveMap && window.interactiveMap.currentPosition) {
                    window.interactiveMap.map.setView(window.interactiveMap.currentPosition, 18);
                }
            });
            
            div.querySelector('#fitBoundsBtn').addEventListener('click', () => {
                if (window.interactiveMap) {
                    window.interactiveMap.fitAllBounds();
                }
            });
            
            div.querySelector('#showTrackingHistory').addEventListener('change', (e) => {
                if (window.interactiveMap) {
                    window.interactiveMap.toggleTrackingHistory(e.target.checked);
                }
            });
            
            div.querySelector('#showSurveillanceZones').addEventListener('change', (e) => {
                if (window.interactiveMap) {
                    window.interactiveMap.toggleSurveillanceZones(e.target.checked);
                }
            });
            
            return div;
        };
        
        controlPanel.addTo(this.map);
    }
    
    setupMapEventListeners() {
        // Map click event for adding waypoints
        this.map.on('click', (e) => {
            if (this.isAddingWaypoint) {
                this.addWaypointAtPosition(e.latlng);
            }
        });
        
        // Map move event for updating position
        this.map.on('moveend', () => {
            this.updateMapInfo();
        });
        
        // Map zoom event
        this.map.on('zoomend', () => {
            this.updateMapInfo();
        });
    }
    
    startPositionTracking() {
        // Start tracking car position
        setInterval(() => {
            this.updateCarPosition();
        }, 1000); // Update every second
    }
    
    async updateCarPosition() {
        try {
            // Get current position from ESP32
            const response = await fetch('/api/position');
            if (response.ok) {
                const position = await response.json();
                this.currentPosition = [position.lat, position.lng];
                
                // Update car marker
                this.updateCarMarker(position);
                
                // Add to tracking history
                this.addToTrackingHistory(position);
                
                // Check if in surveillance zones
                this.checkSurveillanceZones(position);
                
                // Update map info
                this.updateMapInfo();
            }
        } catch (error) {
            console.error('Failed to update car position:', error);
        }
    }
    
    updateCarMarker(position) {
        if (!this.carMarker) {
            // Create car marker
            const carIcon = L.divIcon({
                className: 'car-marker',
                html: '<i class="fas fa-car"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            this.carMarker = L.marker([position.lat, position.lng], { icon: carIcon })
                .addTo(this.map);
        } else {
            // Update existing marker
            this.carMarker.setLatLng([position.lat, position.lng]);
        }
        
        // Add popup with car info
        this.carMarker.bindPopup(`
            <div class="car-popup">
                <h4>Surveillance Car</h4>
                <p><strong>Position:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
                <p><strong>Battery:</strong> ${position.battery || 'Unknown'}%</p>
                <p><strong>Speed:</strong> ${position.speed || '0'} km/h</p>
                <p><strong>Heading:</strong> ${position.heading || '0'}°</p>
                <p><strong>Last Update:</strong> ${new Date().toLocaleString()}</p>
            </div>
        `);
    }
    
    addToTrackingHistory(position) {
        const historyPoint = {
            lat: position.lat,
            lng: position.lng,
            timestamp: Date.now(),
            battery: position.battery,
            speed: position.speed,
            heading: position.heading
        };
        
        this.trackingHistory.push(historyPoint);
        
        // Keep only recent history
        if (this.trackingHistory.length > this.maxHistoryPoints) {
            this.trackingHistory = this.trackingHistory.slice(-this.maxHistoryPoints);
        }
        
        // Update tracking line
        this.updateTrackingLine();
    }
    
    updateTrackingLine() {
        if (this.trackingLine) {
            this.map.removeLayer(this.trackingLine);
        }
        
        if (this.trackingHistory.length > 1) {
            const coordinates = this.trackingHistory.map(point => [point.lat, point.lng]);
            
            this.trackingLine = L.polyline(coordinates, {
                color: '#3498db',
                weight: 3,
                opacity: 0.7
            }).addTo(this.map);
        }
    }
    
    addDetectionMarker(detection) {
        const type = detection.type.toLowerCase();
        const config = this.detectionTypes[type] || this.detectionTypes.object;
        
        const icon = L.divIcon({
            className: 'detection-marker',
            html: `<i class="${config.icon}" style="color: ${config.color}"></i>`,
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        });
        
        const marker = L.marker([detection.lat, detection.lng], { icon: icon })
            .addTo(this.map);
        
        // Add popup
        marker.bindPopup(`
            <div class="detection-popup">
                <h4>${type.toUpperCase()} Detection</h4>
                <p><strong>Time:</strong> ${new Date(detection.timestamp).toLocaleString()}</p>
                <p><strong>Confidence:</strong> ${Math.round(detection.confidence * 100)}%</p>
                <p><strong>Description:</strong> ${detection.description || 'No description'}</p>
                <p><strong>Location:</strong> ${detection.lat.toFixed(6)}, ${detection.lng.toFixed(6)}</p>
            </div>
        `);
        
        this.detectionMarkers.push(marker);
        
        // Keep only recent detections
        if (this.detectionMarkers.length > 100) {
            const oldMarker = this.detectionMarkers.shift();
            this.map.removeLayer(oldMarker);
        }
    }
    
    addWaypoint(position) {
        const waypoint = {
            id: this.generateId(),
            lat: position.lat,
            lng: position.lng,
            name: `Waypoint ${this.waypoints.length + 1}`,
            timestamp: Date.now()
        };
        
        this.waypoints.push(waypoint);
        this.updateWaypointMarkers();
        this.updatePatrolRoute();
    }
    
    addWaypointAtPosition(latlng) {
        this.addWaypoint({
            lat: latlng.lat,
            lng: latlng.lng
        });
    }
    
    updateWaypointMarkers() {
        // Clear existing waypoint markers
        this.waypointMarkers?.forEach(marker => this.map.removeLayer(marker));
        this.waypointMarkers = [];
        
        // Add new waypoint markers
        this.waypoints.forEach((waypoint, index) => {
            const icon = L.divIcon({
                className: 'waypoint-marker',
                html: `<span class="waypoint-number">${index + 1}</span>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker([waypoint.lat, waypoint.lng], { icon: icon })
                .addTo(this.map);
            
            marker.bindPopup(`
                <div class="waypoint-popup">
                    <h4>${waypoint.name}</h4>
                    <p><strong>Position:</strong> ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}</p>
                    <p><strong>Order:</strong> ${index + 1}</p>
                    <div class="waypoint-actions">
                        <button class="btn btn-sm btn-danger" onclick="window.interactiveMap.removeWaypoint('${waypoint.id}')">
                            Remove
                        </button>
                    </div>
                </div>
            `);
            
            this.waypointMarkers.push(marker);
        });
    }
    
    removeWaypoint(waypointId) {
        this.waypoints = this.waypoints.filter(w => w.id !== waypointId);
        this.updateWaypointMarkers();
        this.updatePatrolRoute();
    }
    
    updatePatrolRoute() {
        if (this.patrolRoute) {
            this.map.removeLayer(this.patrolRoute);
        }
        
        if (this.waypoints.length > 1) {
            const coordinates = this.waypoints.map(w => [w.lat, w.lng]);
            
            this.patrolRoute = L.polyline(coordinates, {
                color: '#e74c3c',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(this.map);
        }
    }
    
    addSurveillanceZone(zone) {
        if (!zone) {
            // Create default zone
            zone = {
                id: this.generateId(),
                name: `Surveillance Zone ${this.surveillanceZones.length + 1}`,
                type: 'circle',
                center: this.currentPosition || [0, 0],
                radius: 50, // meters
                color: '#f39c12',
                opacity: 0.3
            };
        }
        
        this.surveillanceZones.push(zone);
        this.updateSurveillanceZoneMarkers();
    }
    
    updateSurveillanceZoneMarkers() {
        // Clear existing zone markers
        this.zoneMarkers?.forEach(marker => this.map.removeLayer(marker));
        this.zoneMarkers = [];
        
        // Add new zone markers
        this.surveillanceZones.forEach(zone => {
            let marker;
            
            if (zone.type === 'circle') {
                marker = L.circle([zone.center[0], zone.center[1]], {
                    radius: zone.radius,
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: zone.opacity
                }).addTo(this.map);
            } else if (zone.type === 'polygon') {
                marker = L.polygon(zone.coordinates, {
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: zone.opacity
                }).addTo(this.map);
            }
            
            if (marker) {
                marker.bindPopup(`
                    <div class="zone-popup">
                        <h4>${zone.name}</h4>
                        <p><strong>Type:</strong> ${zone.type}</p>
                        <p><strong>Area:</strong> ${this.calculateZoneArea(zone)} m²</p>
                        <div class="zone-actions">
                            <button class="btn btn-sm btn-danger" onclick="window.interactiveMap.removeSurveillanceZone('${zone.id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                `);
                
                this.zoneMarkers.push(marker);
            }
        });
    }
    
    removeSurveillanceZone(zoneId) {
        this.surveillanceZones = this.surveillanceZones.filter(z => z.id !== zoneId);
        this.updateSurveillanceZoneMarkers();
    }
    
    calculateZoneArea(zone) {
        if (zone.type === 'circle') {
            return Math.PI * zone.radius * zone.radius;
        } else if (zone.type === 'polygon') {
            // Calculate polygon area using shoelace formula
            let area = 0;
            const coords = zone.coordinates;
            for (let i = 0; i < coords.length; i++) {
                const j = (i + 1) % coords.length;
                area += coords[i][0] * coords[j][1];
                area -= coords[j][0] * coords[i][1];
            }
            return Math.abs(area) / 2;
        }
        return 0;
    }
    
    checkSurveillanceZones(position) {
        this.surveillanceZones.forEach(zone => {
            const isInside = this.isPositionInZone(position, zone);
            if (isInside && !zone.entered) {
                zone.entered = true;
                this.onZoneEntered(zone, position);
            } else if (!isInside && zone.entered) {
                zone.entered = false;
                this.onZoneExited(zone, position);
            }
        });
    }
    
    isPositionInZone(position, zone) {
        if (zone.type === 'circle') {
            const distance = this.calculateDistance(
                position.lat, position.lng,
                zone.center[0], zone.center[1]
            );
            return distance <= zone.radius;
        } else if (zone.type === 'polygon') {
            return this.isPointInPolygon([position.lat, position.lng], zone.coordinates);
        }
        return false;
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    isPointInPolygon(point, polygon) {
        const x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i][1] > y) !== (polygon[j][1] > y)) &&
                (x < (polygon[j][0] - polygon[i][0]) * (y - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    onZoneEntered(zone, position) {
        console.log(`Entered surveillance zone: ${zone.name}`);
        this.showZoneAlert(`Entered surveillance zone: ${zone.name}`, 'info');
    }
    
    onZoneExited(zone, position) {
        console.log(`Exited surveillance zone: ${zone.name}`);
        this.showZoneAlert(`Exited surveillance zone: ${zone.name}`, 'info');
    }
    
    showZoneAlert(message, type) {
        if (window.dashboard) {
            window.dashboard.showAlert('Zone Alert', message);
        }
    }
    
    startTracking() {
        this.isTracking = true;
        this.updateTrackingControls();
        console.log('Position tracking started');
    }
    
    stopTracking() {
        this.isTracking = false;
        this.updateTrackingControls();
        console.log('Position tracking stopped');
    }
    
    updateTrackingControls() {
        const startBtn = document.getElementById('startTrackingBtn');
        const stopBtn = document.getElementById('stopTrackingBtn');
        
        if (startBtn) startBtn.disabled = this.isTracking;
        if (stopBtn) stopBtn.disabled = !this.isTracking;
    }
    
    startPatrol() {
        if (this.waypoints.length < 2) {
            this.showAlert('Patrol Error', 'Please add at least 2 waypoints to start patrol.');
            return;
        }
        
        this.isPatrolling = true;
        this.updatePatrolControls();
        console.log('Patrol started');
    }
    
    stopPatrol() {
        this.isPatrolling = false;
        this.updatePatrolControls();
        console.log('Patrol stopped');
    }
    
    updatePatrolControls() {
        const startBtn = document.getElementById('startPatrolBtn');
        const stopBtn = document.getElementById('stopPatrolBtn');
        
        if (startBtn) startBtn.disabled = this.isPatrolling;
        if (stopBtn) stopBtn.disabled = !this.isPatrolling;
    }
    
    clearMap() {
        // Clear all markers and overlays
        this.detectionMarkers.forEach(marker => this.map.removeLayer(marker));
        this.detectionMarkers = [];
        
        if (this.trackingLine) {
            this.map.removeLayer(this.trackingLine);
            this.trackingLine = null;
        }
        
        this.waypointMarkers?.forEach(marker => this.map.removeLayer(marker));
        this.waypointMarkers = [];
        this.waypoints = [];
        
        if (this.patrolRoute) {
            this.map.removeLayer(this.patrolRoute);
            this.patrolRoute = null;
        }
        
        this.zoneMarkers?.forEach(marker => this.map.removeLayer(marker));
        this.zoneMarkers = [];
        this.surveillanceZones = [];
        
        this.trackingHistory = [];
        
        console.log('Map cleared');
    }
    
    async saveMapData() {
        const mapData = {
            waypoints: this.waypoints,
            surveillanceZones: this.surveillanceZones,
            trackingHistory: this.trackingHistory,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Save to Firebase
            if (window.firebaseIntegration) {
                await window.firebaseIntegration.saveMapData(mapData);
            }
            
            // Save to localStorage as backup
            localStorage.setItem('surveillance_map_data', JSON.stringify(mapData));
            
            this.showAlert('Map Saved', 'Map data saved successfully.');
        } catch (error) {
            console.error('Failed to save map data:', error);
            this.showAlert('Save Error', 'Failed to save map data: ' + error.message);
        }
    }
    
    async loadMapData() {
        try {
            // Try to load from Firebase first
            if (window.firebaseIntegration) {
                const mapData = await window.firebaseIntegration.getMapData();
                if (mapData) {
                    this.applyMapData(mapData);
                    return;
                }
            }
            
            // Fallback to localStorage
            const savedData = localStorage.getItem('surveillance_map_data');
            if (savedData) {
                const mapData = JSON.parse(savedData);
                this.applyMapData(mapData);
            }
        } catch (error) {
            console.error('Failed to load map data:', error);
        }
    }
    
    applyMapData(mapData) {
        if (mapData.waypoints) {
            this.waypoints = mapData.waypoints;
            this.updateWaypointMarkers();
            this.updatePatrolRoute();
        }
        
        if (mapData.surveillanceZones) {
            this.surveillanceZones = mapData.surveillanceZones;
            this.updateSurveillanceZoneMarkers();
        }
        
        if (mapData.trackingHistory) {
            this.trackingHistory = mapData.trackingHistory;
            this.updateTrackingLine();
        }
        
        console.log('Map data loaded');
    }
    
    updateMapInfo() {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        const bounds = this.map.getBounds();
        
        const infoElement = document.getElementById('mapInfo');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="map-info">
                    <h4>Map Information</h4>
                    <p><strong>Center:</strong> ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</p>
                    <p><strong>Zoom:</strong> ${zoom}</p>
                    <p><strong>Bounds:</strong> ${bounds.getSouthWest().lat.toFixed(4)}, ${bounds.getSouthWest().lng.toFixed(4)} to ${bounds.getNorthEast().lat.toFixed(4)}, ${bounds.getNorthEast().lng.toFixed(4)}</p>
                    <p><strong>Waypoints:</strong> ${this.waypoints.length}</p>
                    <p><strong>Surveillance Zones:</strong> ${this.surveillanceZones.length}</p>
                    <p><strong>Tracking Points:</strong> ${this.trackingHistory.length}</p>
                </div>
            `;
        }
    }
    
    fitAllBounds() {
        const group = new L.featureGroup();
        
        // Add all markers to group
        if (this.carMarker) group.addLayer(this.carMarker);
        this.detectionMarkers.forEach(marker => group.addLayer(marker));
        this.waypointMarkers?.forEach(marker => group.addLayer(marker));
        this.zoneMarkers?.forEach(marker => group.addLayer(marker));
        
        if (group.getLayers().length > 0) {
            this.map.fitBounds(group.getBounds());
        }
    }
    
    toggleTrackingHistory(show) {
        if (this.trackingLine) {
            if (show) {
                this.map.addLayer(this.trackingLine);
            } else {
                this.map.removeLayer(this.trackingLine);
            }
        }
    }
    
    toggleSurveillanceZones(show) {
        this.zoneMarkers?.forEach(marker => {
            if (show) {
                this.map.addLayer(marker);
            } else {
                this.map.removeLayer(marker);
            }
        });
    }
    
    toggleDetectionMarkers(show) {
        this.detectionMarkers.forEach(marker => {
            if (show) {
                this.map.addLayer(marker);
            } else {
                this.map.removeLayer(marker);
            }
        });
    }
    
    togglePatrolRoute(show) {
        if (this.patrolRoute) {
            if (show) {
                this.map.addLayer(this.patrolRoute);
            } else {
                this.map.removeLayer(this.patrolRoute);
            }
        }
    }
    
    toggleMapView(viewType) {
        // Switch between different map views
        switch (viewType) {
            case 'satellite':
                // Switch to satellite view
                break;
            case 'terrain':
                // Switch to terrain view
                break;
            case 'street':
                // Switch to street view
                break;
            default:
                // Default view
                break;
        }
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    showAlert(title, message) {
        if (window.dashboard) {
            window.dashboard.showAlert(title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    // Public methods for external use
    getMap() {
        return this.map;
    }
    
    getCurrentPosition() {
        return this.currentPosition;
    }
    
    getWaypoints() {
        return this.waypoints;
    }
    
    getSurveillanceZones() {
        return this.surveillanceZones;
    }
    
    getTrackingHistory() {
        return this.trackingHistory;
    }
    
    // Add detection from external source
    addDetection(detection) {
        this.addDetectionMarker(detection);
    }
    
    // Update car position from external source
    updatePosition(position) {
        this.currentPosition = [position.lat, position.lng];
        this.updateCarMarker(position);
        this.addToTrackingHistory(position);
    }
}

// Initialize Interactive Map
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveMap = new InteractiveMap();
});

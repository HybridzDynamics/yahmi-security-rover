// Custom Map System for Car-Generated Maps

class CustomMapSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mapData = null;
        this.waypoints = [];
        this.carPosition = { x: 0, y: 0, angle: 0 };
        this.mapConfig = {
            cellSize: 0.1,
            width: 200,
            height: 200,
            originX: 10.0,
            originY: 10.0
        };
        
        // Map view settings
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.scale = 10; // pixels per meter
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isAddingWaypoint = false;
        
        // Map colors
        this.colors = {
            unknown: '#34495e',
            free: '#27ae60',
            obstacle: '#e74c3c',
            waypoint: '#f39c12',
            visited: '#3498db',
            car: '#e74c3c',
            path: '#9b59b6'
        };
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('mapCanvas');
        if (!this.canvas) {
            console.error('Map canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.resizeCanvas();
        this.loadMapData();
        
        // Start map update loop
        this.updateLoop();
    }

    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Button events
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('centerMapBtn')?.addEventListener('click', () => this.centerMap());
        document.getElementById('resetMapBtn')?.addEventListener('click', () => this.resetMap());
        document.getElementById('addWaypointBtn')?.addEventListener('click', () => this.toggleAddWaypoint());
        document.getElementById('startPatrolBtn')?.addEventListener('click', () => this.startPatrol());
        document.getElementById('stopPatrolBtn')?.addEventListener('click', () => this.stopPatrol());
        document.getElementById('clearWaypointsBtn')?.addEventListener('click', () => this.clearWaypoints());
        document.getElementById('saveRouteBtn')?.addEventListener('click', () => this.saveRoute());
        document.getElementById('loadRouteBtn')?.addEventListener('click', () => this.loadRoute());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    async loadMapData() {
        try {
            const response = await fetch('/api/map-data');
            if (response.ok) {
                const data = await response.json();
                this.mapData = data;
                this.waypoints = data.waypoints || [];
                this.carPosition = data.carPosition || { x: 0, y: 0, angle: 0 };
                this.mapConfig = data.config || this.mapConfig;
                this.render();
                this.updateStatistics();
            } else {
                console.log('No map data available, creating empty map');
                this.createEmptyMap();
            }
        } catch (error) {
            console.error('Error loading map data:', error);
            this.createEmptyMap();
        }
    }

    createEmptyMap() {
        this.mapData = {
            cells: [],
            config: this.mapConfig,
            carPosition: this.carPosition,
            waypoints: []
        };
        this.render();
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.panX += deltaX;
            this.panY += deltaY;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.render();
        } else if (this.isAddingWaypoint) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'grab';
        }
    }

    onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        } else if (this.isAddingWaypoint) {
            this.addWaypointAtMouse(e);
        }
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= delta;
        this.zoom = Math.max(0.1, Math.min(5.0, this.zoom));
        this.render();
    }

    addWaypointAtMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const worldX = (mouseX - this.panX) / (this.scale * this.zoom) - this.mapConfig.originX;
        const worldY = (mouseY - this.panY) / (this.scale * this.zoom) - this.mapConfig.originY;
        
        this.addWaypoint(worldX, worldY);
    }

    addWaypoint(x, y, name = '') {
        if (!name) {
            name = `Waypoint ${this.waypoints.length + 1}`;
        }
        
        const waypoint = {
            id: Date.now(),
            x: x,
            y: y,
            name: name,
            visited: false,
            timestamp: Date.now()
        };
        
        this.waypoints.push(waypoint);
        this.updateWaypointList();
        this.render();
        
        // Send to ESP32
        this.sendWaypointToESP32(waypoint);
    }

    async sendWaypointToESP32(waypoint) {
        try {
            const response = await fetch('/api/add-waypoint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(waypoint)
            });
            
            if (!response.ok) {
                throw new Error('Failed to add waypoint');
            }
        } catch (error) {
            console.error('Error sending waypoint to ESP32:', error);
        }
    }

    toggleAddWaypoint() {
        this.isAddingWaypoint = !this.isAddingWaypoint;
        const btn = document.getElementById('addWaypointBtn');
        
        if (this.isAddingWaypoint) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-times"></i> Cancel';
            this.canvas.style.cursor = 'crosshair';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-map-pin"></i> Add Waypoint';
            this.canvas.style.cursor = 'grab';
        }
    }

    startPatrol() {
        if (this.waypoints.length < 2) {
            alert('Please add at least 2 waypoints for patrol');
            return;
        }
        
        this.sendPatrolCommand('start');
        this.updatePatrolStatus('Running');
    }

    stopPatrol() {
        this.sendPatrolCommand('stop');
        this.updatePatrolStatus('Stopped');
    }

    async sendPatrolCommand(action) {
        try {
            const response = await fetch('/api/patrol', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    waypoints: this.waypoints.map(wp => ({ x: wp.x, y: wp.y }))
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send patrol command');
            }
        } catch (error) {
            console.error('Error sending patrol command:', error);
        }
    }

    clearWaypoints() {
        if (confirm('Are you sure you want to clear all waypoints?')) {
            this.waypoints = [];
            this.updateWaypointList();
            this.render();
        }
    }

    updateWaypointList() {
        const list = document.getElementById('waypointList');
        if (!list) return;
        
        list.innerHTML = '';
        
        this.waypoints.forEach(waypoint => {
            const item = document.createElement('div');
            item.className = 'waypoint-item';
            item.innerHTML = `
                <div class="waypoint-info">
                    <div class="waypoint-name">${waypoint.name}</div>
                    <div class="waypoint-coords">(${waypoint.x.toFixed(2)}, ${waypoint.y.toFixed(2)})</div>
                </div>
                <div class="waypoint-actions">
                    <button class="btn btn-sm btn-secondary" onclick="mapSystem.editWaypoint(${waypoint.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="mapSystem.removeWaypoint(${waypoint.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    removeWaypoint(id) {
        this.waypoints = this.waypoints.filter(wp => wp.id !== id);
        this.updateWaypointList();
        this.render();
    }

    editWaypoint(id) {
        const waypoint = this.waypoints.find(wp => wp.id === id);
        if (waypoint) {
            const newName = prompt('Enter new waypoint name:', waypoint.name);
            if (newName !== null) {
                waypoint.name = newName;
                this.updateWaypointList();
            }
        }
    }

    zoomIn() {
        this.zoom *= 1.2;
        this.zoom = Math.min(5.0, this.zoom);
        this.render();
    }

    zoomOut() {
        this.zoom *= 0.8;
        this.zoom = Math.max(0.1, this.zoom);
        this.render();
    }

    centerMap() {
        this.panX = this.canvas.width / 2 - (this.carPosition.x + this.mapConfig.originX) * this.scale * this.zoom;
        this.panY = this.canvas.height / 2 - (this.carPosition.y + this.mapConfig.originY) * this.scale * this.zoom;
        this.render();
    }

    resetMap() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.render();
    }

    render() {
        if (!this.ctx || !this.mapData) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.colors.unknown;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw map cells
        this.drawMapCells();
        
        // Draw waypoints
        this.drawWaypoints();
        
        // Draw car
        this.drawCar();
        
        // Draw paths
        this.drawPaths();
        
        // Update info
        this.updateMapInfo();
    }

    drawGrid() {
        const cellSize = this.scale * this.zoom;
        const startX = -this.panX % cellSize;
        const startY = -this.panY % cellSize;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        for (let x = startX; x < this.canvas.width; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < this.canvas.height; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawMapCells() {
        if (!this.mapData.cells) return;
        
        const cellSize = this.scale * this.zoom;
        
        this.mapData.cells.forEach(cell => {
            const screenX = (cell.x * this.mapConfig.cellSize + this.mapConfig.originX) * this.scale * this.zoom + this.panX;
            const screenY = (cell.y * this.mapConfig.cellSize + this.mapConfig.originY) * this.scale * this.zoom + this.panY;
            
            if (screenX >= -cellSize && screenX <= this.canvas.width + cellSize &&
                screenY >= -cellSize && screenY <= this.canvas.height + cellSize) {
                
                this.ctx.fillStyle = this.getCellColor(cell.type);
                this.ctx.fillRect(screenX, screenY, cellSize, cellSize);
            }
        });
    }

    getCellColor(type) {
        switch (type) {
            case 0: return this.colors.unknown;
            case 1: return this.colors.free;
            case 2: return this.colors.obstacle;
            case 3: return this.colors.waypoint;
            case 4: return this.colors.car;
            default: return this.colors.unknown;
        }
    }

    drawWaypoints() {
        const cellSize = this.scale * this.zoom;
        
        this.waypoints.forEach(waypoint => {
            const screenX = (waypoint.x + this.mapConfig.originX) * this.scale * this.zoom + this.panX;
            const screenY = (waypoint.y + this.mapConfig.originY) * this.scale * this.zoom + this.panY;
            
            // Draw waypoint marker
            this.ctx.fillStyle = this.colors.waypoint;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, cellSize * 0.3, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw waypoint border
            this.ctx.strokeStyle = '#e67e22';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw waypoint label
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(waypoint.name, screenX, screenY - cellSize * 0.5);
        });
    }

    drawCar() {
        const cellSize = this.scale * this.zoom;
        const screenX = (this.carPosition.x + this.mapConfig.originX) * this.scale * this.zoom + this.panX;
        const screenY = (this.carPosition.y + this.mapConfig.originY) * this.scale * this.zoom + this.panY;
        
        // Draw car body
        this.ctx.fillStyle = this.colors.car;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, cellSize * 0.4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw car direction
        const directionLength = cellSize * 0.6;
        const endX = screenX + Math.cos(this.carPosition.angle) * directionLength;
        const endY = screenY + Math.sin(this.carPosition.angle) * directionLength;
        
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }

    drawPaths() {
        if (this.waypoints.length < 2) return;
        
        this.ctx.strokeStyle = this.colors.path;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.waypoints.forEach((waypoint, index) => {
            const screenX = (waypoint.x + this.mapConfig.originX) * this.scale * this.zoom + this.panX;
            const screenY = (waypoint.y + this.mapConfig.originY) * this.scale * this.zoom + this.panY;
            
            if (index === 0) {
                this.ctx.moveTo(screenX, screenY);
            } else {
                this.ctx.lineTo(screenX, screenY);
            }
        });
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    updateMapInfo() {
        const scaleElement = document.getElementById('mapScale');
        const positionElement = document.getElementById('mapPosition');
        
        if (scaleElement) {
            scaleElement.textContent = `1m = ${Math.round(this.scale * this.zoom)}px`;
        }
        
        if (positionElement) {
            positionElement.textContent = `(${this.carPosition.x.toFixed(2)}, ${this.carPosition.y.toFixed(2)})`;
        }
    }

    updateStatistics() {
        const totalDistance = this.calculateTotalDistance();
        const waypointCount = this.waypoints.length;
        
        document.getElementById('totalDistance').textContent = `${totalDistance.toFixed(1)} m`;
        document.getElementById('waypointCount').textContent = waypointCount;
    }

    calculateTotalDistance() {
        if (this.waypoints.length < 2) return 0;
        
        let total = 0;
        for (let i = 1; i < this.waypoints.length; i++) {
            const dx = this.waypoints[i].x - this.waypoints[i-1].x;
            const dy = this.waypoints[i].y - this.waypoints[i-1].y;
            total += Math.sqrt(dx * dx + dy * dy);
        }
        return total;
    }

    updatePatrolStatus(status) {
        document.getElementById('patrolStatus').textContent = status;
    }

    updateLoop() {
        // Update map data every 5 seconds
        setInterval(() => {
            this.loadMapData();
        }, 5000);
        
        // Render at 30 FPS
        setInterval(() => {
            this.render();
        }, 1000 / 30);
    }

    saveRoute() {
        const routeName = prompt('Enter route name:');
        if (routeName) {
            const route = {
                name: routeName,
                waypoints: this.waypoints,
                timestamp: Date.now()
            };
            
            localStorage.setItem(`route_${routeName}`, JSON.stringify(route));
            this.updateRouteList();
        }
    }

    loadRoute() {
        const routes = this.getSavedRoutes();
        if (routes.length === 0) {
            alert('No saved routes found');
            return;
        }
        
        const routeNames = routes.map(r => r.name);
        const selectedRoute = prompt(`Select route:\n${routeNames.join('\n')}`);
        
        if (selectedRoute && routes.find(r => r.name === selectedRoute)) {
            const route = routes.find(r => r.name === selectedRoute);
            this.waypoints = route.waypoints;
            this.updateWaypointList();
            this.render();
        }
    }

    getSavedRoutes() {
        const routes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('route_')) {
                try {
                    const route = JSON.parse(localStorage.getItem(key));
                    routes.push(route);
                } catch (e) {
                    console.error('Error parsing route:', e);
                }
            }
        }
        return routes;
    }

    updateRouteList() {
        const list = document.getElementById('routeList');
        if (!list) return;
        
        const routes = this.getSavedRoutes();
        list.innerHTML = '';
        
        routes.forEach(route => {
            const item = document.createElement('div');
            item.className = 'route-item';
            item.innerHTML = `
                <div class="route-info">
                    <div class="route-name">${route.name}</div>
                    <div class="route-stats">${route.waypoints.length} waypoints</div>
                </div>
                <div class="route-actions">
                    <button class="btn btn-sm btn-primary" onclick="mapSystem.loadRouteByName('${route.name}')">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="mapSystem.deleteRoute('${route.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    loadRouteByName(name) {
        const route = JSON.parse(localStorage.getItem(`route_${name}`));
        if (route) {
            this.waypoints = route.waypoints;
            this.updateWaypointList();
            this.render();
        }
    }

    deleteRoute(name) {
        if (confirm(`Delete route "${name}"?`)) {
            localStorage.removeItem(`route_${name}`);
            this.updateRouteList();
        }
    }
}

// Initialize map system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mapSystem = new CustomMapSystem();
});

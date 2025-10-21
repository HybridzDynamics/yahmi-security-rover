// Firebase Integration for Surveillance Car Data Storage
class FirebaseIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.isInitialized = false;
        this.config = null;
        
        // Collections
        this.collections = {
            detections: 'detections',
            logs: 'system_logs',
            sensorData: 'sensor_data',
            systemStatus: 'system_status',
            patrolRoutes: 'patrol_routes',
            mapData: 'map_data',
            settings: 'settings',
            notifications: 'notifications'
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.initializeFirebase();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Firebase integration initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            this.showError('Firebase initialization failed: ' + error.message);
        }
    }
    
    async initializeFirebase() {
        // Check if Firebase is already initialized
        if (window.firebase && window.firebase.apps.length > 0) {
            this.db = window.firebase.firestore();
            this.auth = window.firebase.auth();
            this.storage = window.firebase.storage();
            return;
        }
        
        // Load Firebase SDK if not already loaded
        if (!window.firebase) {
            await this.loadFirebaseSDK();
        }
        
        // Load Firebase configuration
        this.config = await this.loadFirebaseConfig();
        
        if (!this.config) {
            console.warn('Firebase configuration not found, using mock data');
            this.isInitialized = true;
            return;
        }
        
        try {
            // Initialize Firebase services
            this.db = window.firebase.firestore();
            this.auth = window.firebase.auth();
            this.storage = window.firebase.storage();
        } catch (error) {
            console.warn('Firebase services not available, using mock data:', error);
            this.isInitialized = true;
            return;
        }
        
        // Configure Firestore settings
        this.db.settings({
            cacheSizeBytes: window.firebase.firestore.CACHE_SIZE_UNLIMITED
        });
        
        // Enable offline persistence
        this.db.enablePersistence({
            synchronizeTabs: true
        }).catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
                console.warn('The current browser does not support all features required for persistence');
            }
        });
    }
    
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // Check if Firebase is already loaded
            if (window.firebase) {
                resolve();
                return;
            }
            
            // Load Firebase SDK
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
            script.onload = () => {
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
                authScript.onload = () => {
                    const firestoreScript = document.createElement('script');
                    firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
                    firestoreScript.onload = () => {
                        const storageScript = document.createElement('script');
                        storageScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
                        storageScript.onload = resolve;
                        storageScript.onerror = reject;
                        document.head.appendChild(storageScript);
                    };
                    firestoreScript.onerror = reject;
                    document.head.appendChild(firestoreScript);
                };
                authScript.onerror = reject;
                document.head.appendChild(authScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async loadFirebaseConfig() {
        try {
            // Try to load from server first
            const response = await fetch('/api/firebase/config');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not load Firebase config from server:', error);
        }
        
        // Fallback to localStorage
        const config = localStorage.getItem('firebase_config');
        if (config) {
            return JSON.parse(config);
        }
        
        // Return null to indicate no config available
        return null;
    }
    
    setupEventListeners() {
        // Firebase connection status
        this.db.onSnapshot(() => {
            this.updateConnectionStatus(true);
        }, (error) => {
            this.updateConnectionStatus(false);
            console.error('Firebase connection error:', error);
        });
    }
    
    // Detection Management
    async saveDetection(detection) {
        try {
            if (!this.db) {
                // Mock save for offline mode
                const mockId = this.generateId();
                console.log('Mock detection saved with ID:', mockId);
                return mockId;
            }
            
            const detectionData = {
                ...detection,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                id: detection.id || this.generateId()
            };
            
            const docRef = await this.db.collection(this.collections.detections).add(detectionData);
            
            console.log('Detection saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Failed to save detection:', error);
            throw error;
        }
    }
    
    async getDetections(limit = 100, startAfter = null) {
        try {
            if (!this.db) {
                // Return mock data for offline mode
                return this.getMockDetections(limit);
            }
            
            let query = this.db.collection(this.collections.detections)
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            if (startAfter) {
                query = query.startAfter(startAfter);
            }
            
            const snapshot = await query.get();
            const detections = [];
            
            snapshot.forEach(doc => {
                detections.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return detections;
        } catch (error) {
            console.error('Failed to get detections:', error);
            // Return mock data on error
            return this.getMockDetections(limit);
        }
    }
    
    getMockDetections(limit = 100) {
        const mockDetections = [];
        const types = ['human', 'animal', 'vehicle', 'object'];
        const levels = ['high', 'medium', 'low'];
        
        for (let i = 0; i < Math.min(limit, 20); i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const confidence = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
            const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            
            mockDetections.push({
                id: `mock_${i}`,
                type: type,
                confidence: confidence,
                timestamp: timestamp,
                createdAt: timestamp.toISOString(),
                location: {
                    lat: 40.7128 + (Math.random() - 0.5) * 0.01,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.01
                },
                imageUrl: `https://via.placeholder.com/300x200?text=${type}`,
                level: levels[Math.floor(Math.random() * levels.length)]
            });
        }
        
        return mockDetections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    async getDetectionsByType(type, limit = 50) {
        try {
            const snapshot = await this.db.collection(this.collections.detections)
                .where('type', '==', type)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            
            const detections = [];
            snapshot.forEach(doc => {
                detections.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return detections;
        } catch (error) {
            console.error('Failed to get detections by type:', error);
            throw error;
        }
    }
    
    // System Logs Management
    async saveLog(log) {
        try {
            const logData = {
                ...log,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                id: log.id || this.generateId()
            };
            
            const docRef = await this.db.collection(this.collections.logs).add(logData);
            return docRef.id;
        } catch (error) {
            console.error('Failed to save log:', error);
            throw error;
        }
    }
    
    async getLogs(limit = 100, startAfter = null) {
        try {
            let query = this.db.collection(this.collections.logs)
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            if (startAfter) {
                query = query.startAfter(startAfter);
            }
            
            const snapshot = await query.get();
            const logs = [];
            
            snapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return logs;
        } catch (error) {
            console.error('Failed to get logs:', error);
            throw error;
        }
    }
    
    async getLogsByLevel(level, limit = 50) {
        try {
            const snapshot = await this.db.collection(this.collections.logs)
                .where('level', '==', level)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            
            const logs = [];
            snapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return logs;
        } catch (error) {
            console.error('Failed to get logs by level:', error);
            throw error;
        }
    }
    
    // Sensor Data Management
    async saveSensorData(sensorData) {
        try {
            const data = {
                ...sensorData,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            };
            
            const docRef = await this.db.collection(this.collections.sensorData).add(data);
            return docRef.id;
        } catch (error) {
            console.error('Failed to save sensor data:', error);
            throw error;
        }
    }
    
    async getSensorData(limit = 100, startAfter = null) {
        try {
            let query = this.db.collection(this.collections.sensorData)
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            if (startAfter) {
                query = query.startAfter(startAfter);
            }
            
            const snapshot = await query.get();
            const sensorData = [];
            
            snapshot.forEach(doc => {
                sensorData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return sensorData;
        } catch (error) {
            console.error('Failed to get sensor data:', error);
            throw error;
        }
    }
    
    // System Status Management
    async saveSystemStatus(status) {
        try {
            const statusData = {
                ...status,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString()
            };
            
            // Update the latest system status document
            await this.db.collection(this.collections.systemStatus).doc('latest').set(statusData);
            
            // Also save to history
            await this.db.collection(this.collections.systemStatus).add(statusData);
            
            return true;
        } catch (error) {
            console.error('Failed to save system status:', error);
            throw error;
        }
    }
    
    async getLatestSystemStatus() {
        try {
            const doc = await this.db.collection(this.collections.systemStatus).doc('latest').get();
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get latest system status:', error);
            throw error;
        }
    }
    
    // Patrol Routes Management
    async savePatrolRoute(route) {
        try {
            const routeData = {
                ...route,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                id: route.id || this.generateId()
            };
            
            const docRef = await this.db.collection(this.collections.patrolRoutes).add(routeData);
            return docRef.id;
        } catch (error) {
            console.error('Failed to save patrol route:', error);
            throw error;
        }
    }
    
    async getPatrolRoutes() {
        try {
            const snapshot = await this.db.collection(this.collections.patrolRoutes)
                .orderBy('createdAt', 'desc')
                .get();
            
            const routes = [];
            snapshot.forEach(doc => {
                routes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return routes;
        } catch (error) {
            console.error('Failed to get patrol routes:', error);
            throw error;
        }
    }
    
    // Map Data Management
    async saveMapData(mapData) {
        try {
            const data = {
                ...mapData,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString()
            };
            
            await this.db.collection(this.collections.mapData).doc('current').set(data);
            return true;
        } catch (error) {
            console.error('Failed to save map data:', error);
            throw error;
        }
    }
    
    async getMapData() {
        try {
            const doc = await this.db.collection(this.collections.mapData).doc('current').get();
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get map data:', error);
            throw error;
        }
    }
    
    // Settings Management
    async saveSettings(settings) {
        try {
            const settingsData = {
                ...settings,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString()
            };
            
            await this.db.collection(this.collections.settings).doc('current').set(settingsData);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    }
    
    async getSettings() {
        try {
            const doc = await this.db.collection(this.collections.settings).doc('current').get();
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get settings:', error);
            throw error;
        }
    }
    
    // Notifications Management
    async saveNotification(notification) {
        try {
            const notificationData = {
                ...notification,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                id: notification.id || this.generateId()
            };
            
            const docRef = await this.db.collection(this.collections.notifications).add(notificationData);
            return docRef.id;
        } catch (error) {
            console.error('Failed to save notification:', error);
            throw error;
        }
    }
    
    async getNotifications(limit = 50) {
        try {
            const snapshot = await this.db.collection(this.collections.notifications)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            
            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return notifications;
        } catch (error) {
            console.error('Failed to get notifications:', error);
            throw error;
        }
    }
    
    // Real-time Listeners
    setupRealtimeListeners() {
        // Listen for new detections
        this.db.collection(this.collections.detections)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleNewDetection(change.doc.data());
                    }
                });
            });
        
        // Listen for system status updates
        this.db.collection(this.collections.systemStatus)
            .doc('latest')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.handleSystemStatusUpdate(doc.data());
                }
            });
        
        // Listen for new logs
        this.db.collection(this.collections.logs)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleNewLog(change.doc.data());
                    }
                });
            });
    }
    
    handleNewDetection(detection) {
        // Update detection history in UI
        if (window.dashboard) {
            window.dashboard.addDetectionToHistory(detection.type, detection.confidence);
        }
        
        // Show detection alert if high priority
        if (detection.type === 'human' && detection.confidence > 0.8) {
            this.showDetectionAlert('Human Detected', 
                `A human has been detected with ${Math.round(detection.confidence * 100)}% confidence.`);
        }
    }
    
    handleSystemStatusUpdate(status) {
        // Update system status in UI
        if (window.dashboard) {
            window.dashboard.updateSystemStatus(status);
        }
    }
    
    handleNewLog(log) {
        // Add new log to system logs
        if (window.systemLogs) {
            window.systemLogs.addLog(log.message, log.level, log.source, log.data);
        }
    }
    
    showDetectionAlert(title, message) {
        if (window.dashboard) {
            window.dashboard.showAlert(title, message);
        }
    }
    
    // File Storage
    async uploadFile(file, path) {
        try {
            const storageRef = this.storage.ref().child(path);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return {
                url: downloadURL,
                path: path,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw error;
        }
    }
    
    async deleteFile(path) {
        try {
            const storageRef = this.storage.ref().child(path);
            await storageRef.delete();
            return true;
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }
    
    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            if (connected) {
                statusElement.className = 'status-indicator connected';
                statusElement.querySelector('span').textContent = 'Firebase Connected';
            } else {
                statusElement.className = 'status-indicator disconnected';
                statusElement.querySelector('span').textContent = 'Firebase Disconnected';
            }
        }
    }
    
    showError(message) {
        if (window.dashboard) {
            window.dashboard.showAlert('Firebase Error', message);
        } else {
            console.error(message);
        }
    }
    
    // Data Export/Import
    async exportData(collection, format = 'json') {
        try {
            const snapshot = await this.db.collection(collection).get();
            const data = [];
            
            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (format === 'json') {
                return JSON.stringify(data, null, 2);
            } else if (format === 'csv') {
                return this.convertToCSV(data);
            }
            
            return data;
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ].join('\n');
        
        return csvContent;
    }
    
    // Cleanup old data
    async cleanupOldData(collection, daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const snapshot = await this.db.collection(collection)
                .where('timestamp', '<', cutoffDate)
                .get();
            
            const batch = this.db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            console.log(`Cleaned up ${snapshot.size} old documents from ${collection}`);
            return snapshot.size;
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            throw error;
        }
    }
    
    // Get connection status
    isConnected() {
        return this.isInitialized && this.db !== null;
    }
    
    // Get database instance
    getDatabase() {
        return this.db;
    }
    
    // Get auth instance
    getAuth() {
        return this.auth;
    }
    
    // Get storage instance
    getStorage() {
        return this.storage;
    }
}

// Initialize Firebase Integration
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseIntegration = new FirebaseIntegration();
});

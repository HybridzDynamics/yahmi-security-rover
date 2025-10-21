// Professional Firebase Integration
// Handles Firestore database operations and real-time synchronization

class FirebaseIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
        this.collections = {
            detections: 'ai_detections',
            sensorData: 'sensor_data',
            systemStatus: 'system_status',
            controlCommands: 'control_commands',
            systemEvents: 'system_events',
            configurations: 'configurations'
        };
        this.listeners = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.initializeFirebase();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Firebase integration initialized successfully');
        } catch (error) {
            console.error('Firebase integration initialization failed:', error);
            this.showError('Firebase initialization failed: ' + error.message);
        }
    }

    async initializeFirebase() {
        try {
            // Firebase configuration
            const firebaseConfig = {
                apiKey: "your-api-key",
                authDomain: "surveillance-car-project.firebaseapp.com",
                projectId: "surveillance-car-project",
                storageBucket: "surveillance-car-project.appspot.com",
                messagingSenderId: "123456789",
                appId: "your-app-id"
            };

            if (typeof firebase !== 'undefined') {
                if (firebase.apps.length === 0) {
                    firebase.initializeApp(firebaseConfig);
                }
                
                this.db = firebase.firestore();
                this.auth = firebase.auth();
                
                console.log('Firebase initialized');
            } else {
                throw new Error('Firebase SDK not loaded');
            }
        } catch (error) {
            console.warn('Firebase initialization failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Listen for authentication state changes
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('User authenticated:', user.uid);
                } else {
                    console.log('User not authenticated');
                }
            });
        }
    }

    // AI Detection Operations
    async saveDetection(detectionData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const docRef = await this.db.collection(this.collections.detections).add({
                ...detectionData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            console.log('Detection saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Failed to save detection:', error);
            throw error;
        }
    }

    async getDetections(limit = 50, orderBy = 'timestamp', orderDirection = 'desc') {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.detections)
                .orderBy(orderBy, orderDirection)
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
            console.error('Failed to get detections:', error);
            throw error;
        }
    }

    async listenToDetections(callback) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        const listener = this.db.collection(this.collections.detections)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                const detections = [];
                snapshot.forEach(doc => {
                    detections.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(detections);
            }, (error) => {
                console.error('Detection listener error:', error);
            });

        this.listeners.set('detections', listener);
        return listener;
    }

    // Sensor Data Operations
    async saveSensorData(sensorData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const docRef = await this.db.collection(this.collections.sensorData).add({
                ...sensorData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Failed to save sensor data:', error);
            throw error;
        }
    }

    async getSensorData(limit = 100, orderBy = 'timestamp', orderDirection = 'desc') {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.sensorData)
                .orderBy(orderBy, orderDirection)
                .limit(limit)
                .get();
            
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

    async listenToSensorData(callback) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        const listener = this.db.collection(this.collections.sensorData)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            }, (error) => {
                console.error('Sensor data listener error:', error);
            });

        this.listeners.set('sensorData', listener);
        return listener;
    }

    // System Status Operations
    async saveSystemStatus(statusData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const docRef = await this.db.collection(this.collections.systemStatus).add({
                ...statusData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Failed to save system status:', error);
            throw error;
        }
    }

    async getLatestSystemStatus() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.systemStatus)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get system status:', error);
            throw error;
        }
    }

    async listenToSystemStatus(callback) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        const listener = this.db.collection(this.collections.systemStatus)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            }, (error) => {
                console.error('System status listener error:', error);
            });

        this.listeners.set('systemStatus', listener);
        return listener;
    }

    // Control Commands Operations
    async saveControlCommand(commandData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const docRef = await this.db.collection(this.collections.controlCommands).add({
                ...commandData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Failed to save control command:', error);
            throw error;
        }
    }

    async getControlCommands(limit = 50, orderBy = 'timestamp', orderDirection = 'desc') {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.controlCommands)
                .orderBy(orderBy, orderDirection)
                .limit(limit)
                .get();
            
            const commands = [];
            snapshot.forEach(doc => {
                commands.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return commands;
        } catch (error) {
            console.error('Failed to get control commands:', error);
            throw error;
        }
    }

    // System Events Operations
    async saveSystemEvent(eventData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const docRef = await this.db.collection(this.collections.systemEvents).add({
                ...eventData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Failed to save system event:', error);
            throw error;
        }
    }

    async getSystemEvents(limit = 50, orderBy = 'timestamp', orderDirection = 'desc') {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.systemEvents)
                .orderBy(orderBy, orderDirection)
                .limit(limit)
                .get();
            
            const events = [];
            snapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return events;
        } catch (error) {
            console.error('Failed to get system events:', error);
            throw error;
        }
    }

    async listenToSystemEvents(callback) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        const listener = this.db.collection(this.collections.systemEvents)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                const events = [];
                snapshot.forEach(doc => {
                    events.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(events);
            }, (error) => {
                console.error('System events listener error:', error);
            });

        this.listeners.set('systemEvents', listener);
        return listener;
    }

    // Configuration Operations
    async saveConfiguration(configData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const docRef = await this.db.collection(this.collections.configurations).add({
                ...configData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            throw error;
        }
    }

    async getConfigurations() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.configurations)
                .orderBy('timestamp', 'desc')
                .get();
            
            const configurations = [];
            snapshot.forEach(doc => {
                configurations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return configurations;
        } catch (error) {
            console.error('Failed to get configurations:', error);
            throw error;
        }
    }

    // Analytics and Statistics
    async getDetectionStats(startDate, endDate) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.detections)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .get();
            
            const stats = {
                totalDetections: snapshot.size,
                alertCount: 0,
                averageConfidence: 0,
                objectTypes: {},
                alertLevels: {}
            };
            
            let totalConfidence = 0;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                if (data.should_alert) {
                    stats.alertCount++;
                }
                
                totalConfidence += data.confidence || 0;
                
                // Count object types
                if (data.detected_objects) {
                    data.detected_objects.forEach(obj => {
                        stats.objectTypes[obj] = (stats.objectTypes[obj] || 0) + 1;
                    });
                }
                
                // Count alert levels
                const alertLevel = data.alert_level || 'medium';
                stats.alertLevels[alertLevel] = (stats.alertLevels[alertLevel] || 0) + 1;
            });
            
            stats.averageConfidence = snapshot.size > 0 ? totalConfidence / snapshot.size : 0;
            
            return stats;
        } catch (error) {
            console.error('Failed to get detection stats:', error);
            throw error;
        }
    }

    async getSystemHealthStats(startDate, endDate) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const snapshot = await this.db.collection(this.collections.systemStatus)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .get();
            
            const stats = {
                totalRecords: snapshot.size,
                averageBattery: 0,
                averageUptime: 0,
                systemErrors: 0,
                connectionIssues: 0
            };
            
            let totalBattery = 0;
            let totalUptime = 0;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                totalBattery += data.batteryLevel || 0;
                totalUptime += data.uptime || 0;
                
                if (data.isRunning === false) {
                    stats.systemErrors++;
                }
                
                if (data.connectedClients === 0) {
                    stats.connectionIssues++;
                }
            });
            
            stats.averageBattery = snapshot.size > 0 ? totalBattery / snapshot.size : 0;
            stats.averageUptime = snapshot.size > 0 ? totalUptime / snapshot.size : 0;
            
            return stats;
        } catch (error) {
            console.error('Failed to get system health stats:', error);
            throw error;
        }
    }

    // Data Export
    async exportData(collection, startDate, endDate) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            let query = this.db.collection(collection);
            
            if (startDate && endDate) {
                query = query.where('timestamp', '>=', startDate)
                           .where('timestamp', '<=', endDate);
            }
            
            const snapshot = await query.get();
            const data = [];
            
            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return data;
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }

    // Cleanup Operations
    async cleanupOldData(daysToKeep = 30) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const collections = Object.values(this.collections);
            const results = {};
            
            for (const collection of collections) {
                const snapshot = await this.db.collection(collection)
                    .where('timestamp', '<', cutoffDate)
                    .get();
                
                const batch = this.db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                results[collection] = snapshot.size;
            }
            
            console.log('Cleanup completed:', results);
            return results;
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            throw error;
        }
    }

    // Listener Management
    removeListener(name) {
        const listener = this.listeners.get(name);
        if (listener) {
            listener();
            this.listeners.delete(name);
            console.log(`Listener ${name} removed`);
        }
    }

    removeAllListeners() {
        this.listeners.forEach((listener, name) => {
            listener();
            console.log(`Listener ${name} removed`);
        });
        this.listeners.clear();
    }

    // Utility Methods
    showError(message) {
        console.error('Firebase Error:', message);
        
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: #e74c3c;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
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

    // Public API methods
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            activeListeners: this.listeners.size,
            collections: this.collections
        };
    }

    async testConnection() {
        try {
            if (!this.isInitialized) {
                throw new Error('Firebase not initialized');
            }
            
            await this.db.collection('test').limit(1).get();
            return true;
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            return false;
        }
    }
}

// Initialize Firebase integration when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseIntegration = new FirebaseIntegration();
});

// Add CSS animations
const firebaseStyle = document.createElement('style');
firebaseStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification {
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
`;
document.head.appendChild(firebaseStyle);

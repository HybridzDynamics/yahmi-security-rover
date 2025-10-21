/**
 * Yahmi Security Rover - System Status Model
 * MongoDB schema for system status data
 */

const mongoose = require('mongoose');

const systemStatusSchema = new mongoose.Schema({
    // Battery information
    batteryLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 100
    },
    batteryVoltage: {
        type: Number,
        required: true,
        default: 12.6
    },
    batteryTemperature: {
        type: Number,
        default: 25
    },
    batteryCycles: {
        type: Number,
        default: 0
    },
    
    // System performance
    cpuUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    memoryUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    diskUsage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    temperature: {
        type: Number,
        default: 25
    },
    
    // System uptime
    uptime: {
        type: Number,
        required: true,
        default: 0
    },
    
    // Network information
    wifiSSID: {
        type: String,
        default: 'Yahmi-Network'
    },
    wifiSignal: {
        type: Number,
        default: -45
    },
    ipAddress: {
        type: String,
        default: '192.168.1.100'
    },
    macAddress: {
        type: String,
        default: ''
    },
    
    // Device information
    deviceType: {
        type: String,
        enum: ['esp32', 'raspberry_pi'],
        default: 'esp32'
    },
    firmwareVersion: {
        type: String,
        default: '1.0.0'
    },
    hardwareVersion: {
        type: String,
        default: '1.0'
    },
    
    // System state
    isOnline: {
        type: Boolean,
        default: true
    },
    isCharging: {
        type: Boolean,
        default: false
    },
    isMoving: {
        type: Boolean,
        default: false
    },
    currentMode: {
        type: String,
        enum: ['manual', 'autonomous', 'patrol', 'surveillance'],
        default: 'manual'
    },
    
    // AI status
    aiEnabled: {
        type: Boolean,
        default: true
    },
    aiProcessing: {
        type: Boolean,
        default: false
    },
    
    // Camera status
    cameraConnected: {
        type: Boolean,
        default: true
    },
    cameraRecording: {
        type: Boolean,
        default: false
    },
    
    // Audio status
    speakerConnected: {
        type: Boolean,
        default: true
    },
    microphoneConnected: {
        type: Boolean,
        default: true
    },
    
    // Sensor status
    sensorsConnected: {
        ir: { type: Boolean, default: true },
        ultrasonic: { type: Boolean, default: true },
        accelerometer: { type: Boolean, default: true },
        gyroscope: { type: Boolean, default: true }
    },
    
    // Error states
    errors: [{
        code: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        }
    }],
    
    // Warnings
    warnings: [{
        code: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    }],
    
    // Location data
    location: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        accuracy: Number,
        timestamp: Date
    },
    
    // Performance metrics
    performance: {
        averageCpuUsage: Number,
        averageMemoryUsage: Number,
        peakCpuUsage: Number,
        peakMemoryUsage: Number,
        totalUptime: Number,
        restartCount: { type: Number, default: 0 }
    },
    
    // Network performance
    networkPerformance: {
        latency: Number,
        bandwidth: Number,
        packetLoss: Number,
        connectionQuality: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor'],
            default: 'good'
        }
    },
    
    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'system_status'
});

// Indexes for better performance
systemStatusSchema.index({ timestamp: -1 });
systemStatusSchema.index({ deviceType: 1, timestamp: -1 });
systemStatusSchema.index({ isOnline: 1, timestamp: -1 });
systemStatusSchema.index({ 'errors.severity': 1, timestamp: -1 });

// Virtual for formatted uptime
systemStatusSchema.virtual('formattedUptime').get(function() {
    const hours = Math.floor(this.uptime / 3600);
    const minutes = Math.floor((this.uptime % 3600) / 60);
    const seconds = this.uptime % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
});

// Virtual for battery status
systemStatusSchema.virtual('batteryStatus').get(function() {
    if (this.batteryLevel > 75) return 'excellent';
    if (this.batteryLevel > 50) return 'good';
    if (this.batteryLevel > 25) return 'fair';
    if (this.batteryLevel > 10) return 'low';
    return 'critical';
});

// Virtual for system health
systemStatusSchema.virtual('systemHealth').get(function() {
    const errors = this.errors.filter(e => e.severity === 'critical').length;
    const warnings = this.warnings.filter(w => w.severity === 'high').length;
    
    if (errors > 0) return 'critical';
    if (warnings > 2) return 'warning';
    if (this.cpuUsage > 90 || this.memoryUsage > 90) return 'warning';
    if (this.batteryLevel < 20) return 'warning';
    return 'healthy';
});

// Methods
systemStatusSchema.methods.addError = function(code, message, severity = 'medium') {
    this.errors.push({
        code,
        message,
        severity,
        timestamp: new Date()
    });
    return this.save();
};

systemStatusSchema.methods.addWarning = function(code, message, severity = 'low') {
    this.warnings.push({
        code,
        message,
        severity,
        timestamp: new Date()
    });
    return this.save();
};

systemStatusSchema.methods.clearErrors = function() {
    this.errors = [];
    return this.save();
};

systemStatusSchema.methods.clearWarnings = function() {
    this.warnings = [];
    return this.save();
};

systemStatusSchema.methods.updatePerformance = function(cpuUsage, memoryUsage) {
    if (!this.performance) {
        this.performance = {
            averageCpuUsage: 0,
            averageMemoryUsage: 0,
            peakCpuUsage: 0,
            peakMemoryUsage: 0,
            totalUptime: 0,
            restartCount: 0
        };
    }
    
    // Update averages (simple moving average)
    this.performance.averageCpuUsage = (this.performance.averageCpuUsage + cpuUsage) / 2;
    this.performance.averageMemoryUsage = (this.performance.averageMemoryUsage + memoryUsage) / 2;
    
    // Update peaks
    this.performance.peakCpuUsage = Math.max(this.performance.peakCpuUsage, cpuUsage);
    this.performance.peakMemoryUsage = Math.max(this.performance.peakMemoryUsage, memoryUsage);
    
    return this.save();
};

// Static methods
systemStatusSchema.statics.getLatestStatus = function() {
    return this.findOne().sort({ timestamp: -1 });
};

systemStatusSchema.statics.getStatusHistory = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ timestamp: { $gte: cutoffDate } }).sort({ timestamp: -1 });
};

systemStatusSchema.statics.getSystemHealth = function() {
    return this.aggregate([
        { $sort: { timestamp: -1 } },
        { $limit: 1 },
        {
            $project: {
                batteryLevel: 1,
                cpuUsage: 1,
                memoryUsage: 1,
                isOnline: 1,
                errors: 1,
                warnings: 1,
                systemHealth: {
                    $cond: {
                        if: { $gt: [{ $size: { $filter: { input: "$errors", cond: { $eq: ["$$this.severity", "critical"] } } } }, 0] },
                        then: "critical",
                        else: {
                            $cond: {
                                if: { $gt: [{ $size: { $filter: { input: "$warnings", cond: { $eq: ["$$this.severity", "high"] } } } }, 2] },
                                then: "warning",
                                else: "healthy"
                            }
                        }
                    }
                }
            }
        }
    ]);
};

systemStatusSchema.statics.getPerformanceStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                avgCpuUsage: { $avg: "$cpuUsage" },
                avgMemoryUsage: { $avg: "$memoryUsage" },
                avgBatteryLevel: { $avg: "$batteryLevel" },
                maxCpuUsage: { $max: "$cpuUsage" },
                maxMemoryUsage: { $max: "$memoryUsage" },
                minBatteryLevel: { $min: "$batteryLevel" },
                totalRecords: { $sum: 1 }
            }
        }
    ]);
};

// Pre-save middleware
systemStatusSchema.pre('save', function(next) {
    this.lastUpdate = new Date();
    
    // Auto-clear old errors and warnings (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.errors = this.errors.filter(error => error.timestamp > oneHourAgo);
    this.warnings = this.warnings.filter(warning => warning.timestamp > oneHourAgo);
    
    next();
});

module.exports = mongoose.model('SystemStatus', systemStatusSchema);

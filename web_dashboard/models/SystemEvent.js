/**
 * Yahmi Security Rover - System Event Model
 * MongoDB schema for system events, logs, and notifications
 */

const mongoose = require('mongoose');

const systemEventSchema = new mongoose.Schema({
    // Event identification
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Event classification
    type: {
        type: String,
        enum: [
            'system_startup', 'system_shutdown', 'system_restart',
            'connection_established', 'connection_lost', 'reconnection',
            'battery_low', 'battery_critical', 'battery_charging',
            'obstacle_detected', 'obstacle_cleared', 'collision_avoided',
            'motion_detected', 'motion_stopped', 'patrol_started', 'patrol_completed',
            'surveillance_started', 'surveillance_stopped', 'recording_started', 'recording_stopped',
            'ai_detection', 'ai_analysis_completed', 'threat_detected',
            'alert_triggered', 'notification_sent', 'emergency_stop',
            'mode_changed', 'settings_updated', 'firmware_updated',
            'sensor_failure', 'sensor_recovered', 'calibration_needed',
            'maintenance_required', 'health_check', 'performance_alert',
            'user_action', 'command_executed', 'command_failed',
            'data_backup', 'data_restore', 'file_uploaded', 'file_downloaded',
            'security_breach', 'unauthorized_access', 'authentication_failed'
        ],
        required: true
    },
    
    // Event severity
    severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical'],
        default: 'info'
    },
    
    // Event details
    message: {
        type: String,
        required: true
    },
    
    description: String,
    
    // Event source
    source: {
        type: String,
        enum: ['system', 'user', 'sensor', 'ai', 'network', 'device', 'external'],
        default: 'system'
    },
    
    component: {
        type: String,
        enum: ['motor', 'camera', 'audio', 'sensors', 'ai', 'network', 'battery', 'system'],
        default: 'system'
    },
    
    // User information
    userId: String,
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    
    // Device information
    deviceInfo: {
        deviceType: {
            type: String,
            enum: ['esp32', 'raspberry_pi'],
            default: 'esp32'
        },
        deviceId: String,
        firmwareVersion: String,
        hardwareVersion: String
    },
    
    // Event data
    data: {
        // System metrics
        systemMetrics: {
            cpuUsage: Number,
            memoryUsage: Number,
            diskUsage: Number,
            temperature: Number,
            uptime: Number
        },
        
        // Battery information
        batteryInfo: {
            level: Number,
            voltage: Number,
            temperature: Number,
            charging: Boolean
        },
        
        // Network information
        networkInfo: {
            signalStrength: Number,
            connectionQuality: String,
            latency: Number,
            bandwidth: Number
        },
        
        // Sensor data
        sensorData: {
            irSensors: [Number],
            ultrasonicDistance: Number,
            accelerometer: [Number],
            gyroscope: [Number]
        },
        
        // AI detection data
        aiData: {
            detectedObjects: [String],
            confidence: Number,
            boundingBoxes: [Object],
            analysisTime: Number
        },
        
        // Location data
        location: {
            latitude: Number,
            longitude: Number,
            altitude: Number,
            accuracy: Number
        },
        
        // Performance data
        performance: {
            processingTime: Number,
            responseTime: Number,
            throughput: Number,
            efficiency: Number
        },
        
        // Error information
        error: {
            code: String,
            message: String,
            stack: String,
            context: mongoose.Schema.Types.Mixed
        },
        
        // Custom data
        custom: mongoose.Schema.Types.Mixed
    },
    
    // Event context
    context: {
        // Current system state
        systemState: {
            mode: {
                type: String,
                enum: ['manual', 'autonomous', 'patrol', 'surveillance'],
                default: 'manual'
            },
            status: {
                type: String,
                enum: ['online', 'offline', 'maintenance', 'error'],
                default: 'online'
            },
            health: {
                type: String,
                enum: ['healthy', 'warning', 'critical'],
                default: 'healthy'
            }
        },
        
        // Environmental context
        environment: {
            lighting: String,
            weather: String,
            timeOfDay: String,
            dayOfWeek: String,
            season: String
        },
        
        // Operational context
        operation: {
            patrolRoute: String,
            surveillanceZone: String,
            taskId: String,
            missionId: String
        }
    },
    
    // Event relationships
    relatedEvents: [{
        eventId: String,
        relationship: {
            type: String,
            enum: ['caused_by', 'causes', 'related_to', 'follows', 'precedes']
        }
    }],
    
    // Event lifecycle
    lifecycle: {
        created: { type: Date, default: Date.now },
        acknowledged: Date,
        resolved: Date,
        escalated: Date,
        closed: Date
    },
    
    // Event status
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved', 'escalated', 'closed'],
        default: 'active'
    },
    
    // Notification settings
    notifications: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
        webhook: { type: Boolean, default: false }
    },
    
    // Event tags
    tags: [String],
    
    // Event priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical', 'emergency'],
        default: 'normal'
    },
    
    // Event category
    category: {
        type: String,
        enum: ['system', 'security', 'performance', 'maintenance', 'user', 'error'],
        default: 'system'
    },
    
    // Event duration (for events that have a duration)
    duration: {
        startTime: Date,
        endTime: Date,
        duration: Number // milliseconds
    },
    
    // Event resolution
    resolution: {
        resolved: { type: Boolean, default: false },
        resolvedBy: String,
        resolutionNotes: String,
        resolutionTime: Date,
        autoResolved: { type: Boolean, default: false }
    },
    
    // Event escalation
    escalation: {
        escalated: { type: Boolean, default: false },
        escalatedTo: String,
        escalationReason: String,
        escalationTime: Date,
        escalationLevel: { type: Number, default: 0 }
    },
    
    // Event impact
    impact: {
        level: {
            type: String,
            enum: ['none', 'low', 'medium', 'high', 'critical'],
            default: 'none'
        },
        affectedSystems: [String],
        affectedUsers: [String],
        businessImpact: String
    },
    
    // Event metadata
    metadata: {
        sourceFile: String,
        lineNumber: Number,
        functionName: String,
        threadId: String,
        processId: String,
        version: String
    },
    
    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'system_events'
});

// Indexes for better performance
systemEventSchema.index({ eventId: 1 });
systemEventSchema.index({ timestamp: -1 });
systemEventSchema.index({ type: 1, timestamp: -1 });
systemEventSchema.index({ severity: 1, timestamp: -1 });
systemEventSchema.index({ status: 1, timestamp: -1 });
systemEventSchema.index({ component: 1, timestamp: -1 });
systemEventSchema.index({ userId: 1, timestamp: -1 });
systemEventSchema.index({ 'deviceInfo.deviceType': 1, timestamp: -1 });
systemEventSchema.index({ priority: 1, timestamp: -1 });
systemEventSchema.index({ category: 1, timestamp: -1 });
systemEventSchema.index({ tags: 1, timestamp: -1 });

// Virtual for event age
systemEventSchema.virtual('eventAge').get(function() {
    return Date.now() - this.timestamp.getTime();
});

// Virtual for is active
systemEventSchema.virtual('isActive').get(function() {
    return this.status === 'active' || this.status === 'acknowledged';
});

// Virtual for requires attention
systemEventSchema.virtual('requiresAttention').get(function() {
    return this.severity === 'error' || this.severity === 'critical' || this.priority === 'high' || this.priority === 'critical';
});

// Virtual for formatted duration
systemEventSchema.virtual('formattedDuration').get(function() {
    if (this.duration && this.duration.duration) {
        const duration = this.duration.duration;
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    return null;
});

// Methods
systemEventSchema.methods.acknowledge = function(acknowledgedBy) {
    this.status = 'acknowledged';
    this.lifecycle.acknowledged = new Date();
    return this.save();
};

systemEventSchema.methods.resolve = function(resolvedBy, notes = '') {
    this.status = 'resolved';
    this.resolution.resolved = true;
    this.resolution.resolvedBy = resolvedBy;
    this.resolution.resolutionNotes = notes;
    this.resolution.resolutionTime = new Date();
    this.lifecycle.resolved = new Date();
    return this.save();
};

systemEventSchema.methods.escalate = function(escalatedTo, reason = '') {
    this.escalation.escalated = true;
    this.escalation.escalatedTo = escalatedTo;
    this.escalation.escalationReason = reason;
    this.escalation.escalationTime = new Date();
    this.escalation.escalationLevel += 1;
    this.lifecycle.escalated = new Date();
    return this.save();
};

systemEventSchema.methods.addRelatedEvent = function(eventId, relationship) {
    this.relatedEvents.push({
        eventId,
        relationship
    });
    return this.save();
};

systemEventSchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
    }
    return this.save();
};

systemEventSchema.methods.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
};

systemEventSchema.methods.updateDuration = function() {
    if (this.duration && this.duration.startTime && this.duration.endTime) {
        this.duration.duration = this.duration.endTime.getTime() - this.duration.startTime.getTime();
    }
    return this.save();
};

systemEventSchema.methods.startDuration = function() {
    if (!this.duration) {
        this.duration = {};
    }
    this.duration.startTime = new Date();
    return this.save();
};

systemEventSchema.methods.endDuration = function() {
    if (this.duration && this.duration.startTime) {
        this.duration.endTime = new Date();
        this.updateDuration();
    }
    return this.save();
};

// Static methods
systemEventSchema.statics.generateEventId = function() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

systemEventSchema.statics.getActiveEvents = function() {
    return this.find({
        status: { $in: ['active', 'acknowledged'] }
    }).sort({ priority: -1, timestamp: -1 });
};

systemEventSchema.statics.getEventsByType = function(type, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        type,
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

systemEventSchema.statics.getEventsBySeverity = function(severity, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        severity,
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

systemEventSchema.statics.getCriticalEvents = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        $or: [
            { severity: 'critical' },
            { priority: 'critical' },
            { priority: 'emergency' }
        ],
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

systemEventSchema.statics.getEventStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                bySeverity: {
                    $push: {
                        severity: '$severity',
                        count: 1
                    }
                },
                byType: {
                    $push: {
                        type: '$type',
                        count: 1
                    }
                },
                byStatus: {
                    $push: {
                        status: '$status',
                        count: 1
                    }
                },
                critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
                errors: { $sum: { $cond: [{ $eq: ['$severity', 'error'] }, 1, 0] } },
                warnings: { $sum: { $cond: [{ $eq: ['$severity', 'warning'] }, 1, 0] } },
                resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
            }
        }
    ]);
};

systemEventSchema.statics.getEventTrends = function(hours = 24, interval = 1) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const intervalMs = interval * 60 * 60 * 1000; // Convert hours to milliseconds
    
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: {
                    $toDate: {
                        $subtract: [
                            { $toLong: '$timestamp' },
                            { $mod: [{ $toLong: '$timestamp' }, intervalMs] }
                        ]
                    }
                },
                count: { $sum: 1 },
                critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
                errors: { $sum: { $cond: [{ $eq: ['$severity', 'error'] }, 1, 0] } },
                warnings: { $sum: { $cond: [{ $eq: ['$severity', 'warning'] }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

systemEventSchema.statics.cleanupOldEvents = function(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.deleteMany({
        timestamp: { $lt: cutoffDate },
        status: { $in: ['resolved', 'closed'] }
    });
};

// Pre-save middleware
systemEventSchema.pre('save', function(next) {
    // Generate event ID if not present
    if (!this.eventId) {
        this.eventId = this.constructor.generateEventId();
    }
    
    // Set priority based on severity if not explicitly set
    if (!this.priority || this.priority === 'normal') {
        if (this.severity === 'critical') {
            this.priority = 'critical';
        } else if (this.severity === 'error') {
            this.priority = 'high';
        } else if (this.severity === 'warning') {
            this.priority = 'normal';
        }
    }
    
    // Set category based on type if not explicitly set
    if (!this.category || this.category === 'system') {
        if (this.type.includes('security') || this.type.includes('breach') || this.type.includes('unauthorized')) {
            this.category = 'security';
        } else if (this.type.includes('performance') || this.type.includes('health')) {
            this.category = 'performance';
        } else if (this.type.includes('maintenance') || this.type.includes('calibration')) {
            this.category = 'maintenance';
        } else if (this.type.includes('user') || this.type.includes('command')) {
            this.category = 'user';
        } else if (this.type.includes('error') || this.type.includes('failure')) {
            this.category = 'error';
        }
    }
    
    next();
});

module.exports = mongoose.model('SystemEvent', systemEventSchema);

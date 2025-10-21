/**
 * Yahmi Security Rover - Security Alert Model
 * MongoDB schema for security alerts and incident management
 */

const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
    // Alert identification
    alertId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Alert classification
    type: {
        type: String,
        enum: [
            'intrusion', 'unauthorized_access', 'suspicious_activity',
            'threat_detected', 'security_breach', 'tampering',
            'motion_detected', 'person_detected', 'vehicle_detected',
            'object_detected', 'anomaly_detected', 'system_compromise',
            'network_intrusion', 'data_breach', 'physical_breach',
            'emergency', 'fire', 'flood', 'gas_leak', 'power_failure',
            'equipment_failure', 'communication_loss', 'battery_low',
            'maintenance_required', 'calibration_needed'
        ],
        required: true
    },
    
    // Alert severity
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical', 'emergency'],
        required: true
    },
    
    // Alert priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical', 'emergency'],
        required: true
    },
    
    // Alert status
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'investigating', 'resolved', 'false_positive', 'escalated'],
        default: 'active'
    },
    
    // Alert details
    title: {
        type: String,
        required: true,
        trim: true
    },
    
    description: {
        type: String,
        required: true
    },
    
    // Location information
    location: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        accuracy: Number,
        address: String,
        zone: String,
        building: String,
        floor: String,
        room: String,
        coordinates: {
            x: Number,
            y: Number,
            z: Number
        }
    },
    
    // Device information
    deviceInfo: {
        deviceType: {
            type: String,
            enum: ['esp32', 'raspberry_pi'],
            required: true
        },
        deviceId: String,
        firmwareVersion: String,
        ipAddress: String,
        macAddress: String,
        cameraId: String,
        sensorId: String
    },
    
    // Detection information
    detection: {
        source: {
            type: String,
            enum: ['camera', 'sensor', 'ai', 'manual', 'system'],
            required: true
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        },
        detectionData: mongoose.Schema.Types.Mixed,
        boundingBox: {
            x: Number,
            y: Number,
            width: Number,
            height: Number
        },
        detectionImage: String, // Base64 or URL
        detectionVideo: String, // URL to video clip
        sensorReadings: mongoose.Schema.Types.Mixed
    },
    
    // AI analysis results
    aiAnalysis: {
        analyzed: { type: Boolean, default: false },
        analysisTime: Date,
        detectedObjects: [{
            type: String,
            confidence: Number,
            attributes: mongoose.Schema.Types.Mixed
        }],
        behavioralAnalysis: {
            suspicious: { type: Boolean, default: false },
            activities: [String],
            movement: String,
            interactions: [String]
        },
        threatAssessment: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'low'
            },
            riskScore: { type: Number, min: 0, max: 100, default: 0 },
            factors: [String],
            recommendations: [String]
        }
    },
    
    // Alert context
    context: {
        environment: {
            lighting: String,
            weather: String,
            timeOfDay: String,
            dayOfWeek: String,
            season: String
        },
        system: {
            mode: {
                type: String,
                enum: ['manual', 'autonomous', 'patrol', 'surveillance'],
                default: 'surveillance'
            },
            patrolRoute: String,
            surveillanceZone: String,
            taskId: String
        },
        user: {
            userId: String,
            sessionId: String,
            ipAddress: String,
            userAgent: String
        }
    },
    
    // Alert timeline
    timeline: [{
        event: String,
        description: String,
        timestamp: { type: Date, default: Date.now },
        userId: String,
        automated: { type: Boolean, default: false }
    }],
    
    // Response actions
    response: {
        actions: [{
            type: {
                type: String,
                enum: ['notification_sent', 'recording_started', 'patrol_redirected', 'security_notified', 'emergency_called', 'system_locked', 'user_alerted'],
                required: true
            },
            timestamp: { type: Date, default: Date.now },
            success: { type: Boolean, default: true },
            details: String,
            userId: String,
            automated: { type: Boolean, default: false }
        }],
        notifications: [{
            type: {
                type: String,
                enum: ['email', 'sms', 'push', 'webhook', 'phone'],
                required: true
            },
            recipient: String,
            sent: { type: Boolean, default: false },
            timestamp: { type: Date, default: Date.now },
            response: String
        }],
        escalations: [{
            level: { type: Number, default: 1 },
            escalatedTo: String,
            reason: String,
            timestamp: { type: Date, default: Date.now },
            response: String
        }]
    },
    
    // Assignment and ownership
    assignment: {
        assignedTo: String,
        assignedBy: String,
        assignedAt: Date,
        dueDate: Date,
        notes: String
    },
    
    // Resolution information
    resolution: {
        resolved: { type: Boolean, default: false },
        resolvedBy: String,
        resolvedAt: Date,
        resolutionNotes: String,
        resolutionType: {
            type: String,
            enum: ['confirmed', 'false_positive', 'resolved', 'escalated', 'closed'],
            default: 'resolved'
        },
        followUpRequired: { type: Boolean, default: false },
        followUpDate: Date
    },
    
    // Alert impact
    impact: {
        level: {
            type: String,
            enum: ['none', 'low', 'medium', 'high', 'critical'],
            default: 'none'
        },
        affectedSystems: [String],
        affectedUsers: [String],
        businessImpact: String,
        securityRisk: {
            type: String,
            enum: ['none', 'low', 'medium', 'high', 'critical'],
            default: 'low'
        }
    },
    
    // Alert tags and categorization
    tags: [String],
    category: {
        type: String,
        enum: ['security', 'safety', 'operational', 'technical', 'environmental'],
        default: 'security'
    },
    
    // Alert metadata
    metadata: {
        source: String,
        sessionId: String,
        batchId: String,
        correlationId: String,
        relatedAlerts: [String],
        parentAlert: String,
        childAlerts: [String]
    },
    
    // Alert statistics
    statistics: {
        viewCount: { type: Number, default: 0 },
        responseTime: Number, // milliseconds
        resolutionTime: Number, // milliseconds
        escalationCount: { type: Number, default: 0 },
        notificationCount: { type: Number, default: 0 }
    },
    
    // Alert configuration
    configuration: {
        autoResolve: { type: Boolean, default: false },
        autoEscalate: { type: Boolean, default: false },
        escalationThreshold: { type: Number, default: 30 }, // minutes
        notificationChannels: [String],
        escalationChannels: [String],
        suppressionRules: [String]
    },
    
    // Alert suppression
    suppression: {
        suppressed: { type: Boolean, default: false },
        suppressedBy: String,
        suppressedAt: Date,
        suppressionReason: String,
        suppressionDuration: Number, // minutes
        suppressionExpires: Date
    },
    
    // Alert correlation
    correlation: {
        correlated: { type: Boolean, default: false },
        correlationScore: { type: Number, min: 0, max: 1, default: 0 },
        correlatedAlerts: [String],
        correlationRules: [String]
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
    collection: 'security_alerts'
});

// Indexes for better performance
securityAlertSchema.index({ alertId: 1 });
securityAlertSchema.index({ timestamp: -1 });
securityAlertSchema.index({ type: 1, timestamp: -1 });
securityAlertSchema.index({ severity: 1, timestamp: -1 });
securityAlertSchema.index({ priority: 1, timestamp: -1 });
securityAlertSchema.index({ status: 1, timestamp: -1 });
securityAlertSchema.index({ 'deviceInfo.deviceType': 1, timestamp: -1 });
securityAlertSchema.index({ 'assignment.assignedTo': 1, timestamp: -1 });
securityAlertSchema.index({ 'resolution.resolved': 1, timestamp: -1 });
securityAlertSchema.index({ tags: 1, timestamp: -1 });
securityAlertSchema.index({ category: 1, timestamp: -1 });

// Virtual for alert age
securityAlertSchema.virtual('alertAge').get(function() {
    return Date.now() - this.timestamp.getTime();
});

// Virtual for is active
securityAlertSchema.virtual('isActive').get(function() {
    return this.status === 'active' || this.status === 'acknowledged' || this.status === 'investigating';
});

// Virtual for requires immediate attention
securityAlertSchema.virtual('requiresImmediateAttention').get(function() {
    return this.severity === 'critical' || this.severity === 'emergency' || this.priority === 'critical' || this.priority === 'emergency';
});

// Virtual for is overdue
securityAlertSchema.virtual('isOverdue').get(function() {
    if (this.assignment.dueDate) {
        return new Date() > this.assignment.dueDate;
    }
    return false;
});

// Virtual for response time in human readable format
securityAlertSchema.virtual('formattedResponseTime').get(function() {
    if (this.statistics.responseTime) {
        const minutes = Math.floor(this.statistics.responseTime / 60000);
        const seconds = Math.floor((this.statistics.responseTime % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    return null;
});

// Virtual for resolution time in human readable format
securityAlertSchema.virtual('formattedResolutionTime').get(function() {
    if (this.statistics.resolutionTime) {
        const hours = Math.floor(this.statistics.resolutionTime / 3600000);
        const minutes = Math.floor((this.statistics.resolutionTime % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }
    return null;
});

// Methods
securityAlertSchema.methods.addTimelineEvent = function(event, description, userId = null, automated = false) {
    this.timeline.push({
        event,
        description,
        userId,
        automated,
        timestamp: new Date()
    });
    return this.save();
};

securityAlertSchema.methods.addResponseAction = function(type, details = '', userId = null, automated = false) {
    this.response.actions.push({
        type,
        details,
        userId,
        automated,
        timestamp: new Date()
    });
    return this.save();
};

securityAlertSchema.methods.addNotification = function(type, recipient) {
    this.response.notifications.push({
        type,
        recipient,
        timestamp: new Date()
    });
    this.statistics.notificationCount += 1;
    return this.save();
};

securityAlertSchema.methods.escalate = function(escalatedTo, reason = '') {
    this.response.escalations.push({
        level: this.response.escalations.length + 1,
        escalatedTo,
        reason,
        timestamp: new Date()
    });
    this.statistics.escalationCount += 1;
    return this.save();
};

securityAlertSchema.methods.assign = function(assignedTo, assignedBy, dueDate = null, notes = '') {
    this.assignment.assignedTo = assignedTo;
    this.assignment.assignedBy = assignedBy;
    this.assignment.assignedAt = new Date();
    this.assignment.dueDate = dueDate;
    this.assignment.notes = notes;
    this.status = 'acknowledged';
    return this.save();
};

securityAlertSchema.methods.resolve = function(resolvedBy, resolutionNotes = '', resolutionType = 'resolved', followUpRequired = false) {
    this.resolution.resolved = true;
    this.resolution.resolvedBy = resolvedBy;
    this.resolution.resolvedAt = new Date();
    this.resolution.resolutionNotes = resolutionNotes;
    this.resolution.resolutionType = resolutionType;
    this.resolution.followUpRequired = followUpRequired;
    this.status = 'resolved';
    
    // Calculate resolution time
    if (this.timestamp) {
        this.statistics.resolutionTime = this.resolution.resolvedAt.getTime() - this.timestamp.getTime();
    }
    
    return this.save();
};

securityAlertSchema.methods.suppress = function(suppressedBy, reason, duration = 60) {
    this.suppression.suppressed = true;
    this.suppression.suppressedBy = suppressedBy;
    this.suppression.suppressedAt = new Date();
    this.suppression.suppressionReason = reason;
    this.suppression.suppressionDuration = duration;
    this.suppression.suppressionExpires = new Date(Date.now() + duration * 60 * 1000);
    return this.save();
};

securityAlertSchema.methods.unsuppress = function() {
    this.suppression.suppressed = false;
    this.suppression.suppressedBy = null;
    this.suppression.suppressedAt = null;
    this.suppression.suppressionReason = null;
    this.suppression.suppressionDuration = null;
    this.suppression.suppressionExpires = null;
    return this.save();
};

securityAlertSchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
    }
    return this.save();
};

securityAlertSchema.methods.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
};

securityAlertSchema.methods.incrementViewCount = function() {
    this.statistics.viewCount += 1;
    return this.save();
};

securityAlertSchema.methods.correlateWith = function(alertId, correlationScore = 0.5) {
    this.correlation.correlated = true;
    this.correlation.correlationScore = correlationScore;
    if (!this.correlation.correlatedAlerts.includes(alertId)) {
        this.correlation.correlatedAlerts.push(alertId);
    }
    return this.save();
};

// Static methods
securityAlertSchema.statics.generateAlertId = function() {
    return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

securityAlertSchema.statics.getActiveAlerts = function() {
    return this.find({
        status: { $in: ['active', 'acknowledged', 'investigating'] }
    }).sort({ priority: -1, timestamp: -1 });
};

securityAlertSchema.statics.getAlertsByType = function(type, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        type,
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

securityAlertSchema.statics.getAlertsBySeverity = function(severity, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        severity,
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

securityAlertSchema.statics.getCriticalAlerts = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        $or: [
            { severity: 'critical' },
            { severity: 'emergency' },
            { priority: 'critical' },
            { priority: 'emergency' }
        ],
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

securityAlertSchema.statics.getAlertStats = function(hours = 24) {
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
                resolved: { $sum: { $cond: [{ $eq: ['$resolution.resolved', true] }, 1, 0] } },
                active: { $sum: { $cond: [{ $in: ['$status', ['active', 'acknowledged', 'investigating']] }, 1, 0] } },
                avgResponseTime: { $avg: '$statistics.responseTime' },
                avgResolutionTime: { $avg: '$statistics.resolutionTime' }
            }
        }
    ]);
};

securityAlertSchema.statics.getAlertTrends = function(hours = 24, interval = 1) {
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
                resolved: { $sum: { $cond: [{ $eq: ['$resolution.resolved', true] }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

securityAlertSchema.statics.cleanupOldAlerts = function(days = 90) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.deleteMany({
        timestamp: { $lt: cutoffDate },
        status: { $in: ['resolved', 'false_positive'] }
    });
};

// Pre-save middleware
securityAlertSchema.pre('save', function(next) {
    // Generate alert ID if not present
    if (!this.alertId) {
        this.alertId = this.constructor.generateAlertId();
    }
    
    // Set priority based on severity if not explicitly set
    if (!this.priority || this.priority === 'normal') {
        if (this.severity === 'critical' || this.severity === 'emergency') {
            this.priority = 'critical';
        } else if (this.severity === 'high') {
            this.priority = 'high';
        } else if (this.severity === 'medium') {
            this.priority = 'normal';
        } else {
            this.priority = 'low';
        }
    }
    
    // Set category based on type if not explicitly set
    if (!this.category || this.category === 'security') {
        if (this.type.includes('emergency') || this.type.includes('fire') || this.type.includes('flood')) {
            this.category = 'safety';
        } else if (this.type.includes('equipment') || this.type.includes('maintenance')) {
            this.category = 'technical';
        } else if (this.type.includes('power') || this.type.includes('communication')) {
            this.category = 'operational';
        }
    }
    
    next();
});

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);

/**
 * Yahmi Security Rover - AI Detection Model
 * MongoDB schema for AI-powered object detection and analysis
 */

const mongoose = require('mongoose');

const aiDetectionSchema = new mongoose.Schema({
    // Image data
    imageData: {
        type: String, // Base64 encoded image
        required: true
    },
    imageMetadata: {
        width: { type: Number, default: 640 },
        height: { type: Number, default: 480 },
        format: { type: String, default: 'jpeg' },
        size: { type: Number, default: 0 },
        quality: { type: Number, default: 80 }
    },
    
    // AI Analysis results
    analysis: {
        detectedObjects: [{
            type: {
                type: String,
                enum: ['person', 'vehicle', 'animal', 'object', 'unknown'],
                required: true
            },
            confidence: {
                type: Number,
                min: 0,
                max: 1,
                required: true
            },
            boundingBox: {
                x: { type: Number, required: true },
                y: { type: Number, required: true },
                width: { type: Number, required: true },
                height: { type: Number, required: true }
            },
            attributes: {
                age: String,
                gender: String,
                clothing: [String],
                color: String,
                size: String,
                pose: String,
                activity: String
            }
        }],
        
        overallConfidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        },
        
        sceneAnalysis: {
            environment: {
                type: String,
                enum: ['indoor', 'outdoor', 'mixed', 'unknown'],
                default: 'unknown'
            },
            lighting: {
                type: String,
                enum: ['bright', 'normal', 'dim', 'dark', 'unknown'],
                default: 'unknown'
            },
            weather: {
                type: String,
                enum: ['clear', 'cloudy', 'rainy', 'snowy', 'foggy', 'unknown'],
                default: 'unknown'
            },
            timeOfDay: {
                type: String,
                enum: ['morning', 'afternoon', 'evening', 'night', 'unknown'],
                default: 'unknown'
            }
        },
        
        threatAssessment: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'low'
            },
            factors: [String],
            riskScore: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            }
        },
        
        behavioralAnalysis: {
            movement: {
                type: String,
                enum: ['stationary', 'walking', 'running', 'driving', 'unknown'],
                default: 'unknown'
            },
            direction: {
                type: String,
                enum: ['towards', 'away', 'lateral', 'unknown'],
                default: 'unknown'
            },
            speed: {
                type: Number,
                default: 0
            },
            suspicious: {
                type: Boolean,
                default: false
            },
            suspiciousFactors: [String]
        }
    },
    
    // Alert configuration
    alertLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    
    alertTriggers: [{
        type: {
            type: String,
            enum: ['object_detected', 'suspicious_behavior', 'unauthorized_access', 'threat_detected'],
            required: true
        },
        description: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        timestamp: { type: Date, default: Date.now }
    }],
    
    // Processing information
    processingInfo: {
        model: {
            type: String,
            default: 'yolov8'
        },
        version: {
            type: String,
            default: '1.0.0'
        },
        processingTime: {
            type: Number, // milliseconds
            default: 0
        },
        gpuAccelerated: {
            type: Boolean,
            default: false
        },
        confidenceThreshold: {
            type: Number,
            default: 0.5
        }
    },
    
    // Location and context
    location: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        accuracy: Number,
        address: String,
        zone: String
    },
    
    context: {
        patrolRoute: String,
        surveillanceMode: {
            type: String,
            enum: ['active', 'passive', 'patrol', 'alert'],
            default: 'passive'
        },
        weatherConditions: String,
        timeOfDay: String,
        dayOfWeek: String
    },
    
    // Verification and validation
    verification: {
        humanVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: String,
        verificationTimestamp: Date,
        verificationNotes: String,
        falsePositive: {
            type: Boolean,
            default: false
        },
        correctionApplied: {
            type: Boolean,
            default: false
        }
    },
    
    // Response actions
    actions: [{
        type: {
            type: String,
            enum: ['alert_sent', 'recording_started', 'patrol_redirected', 'security_notified', 'auto_response'],
            required: true
        },
        timestamp: { type: Date, default: Date.now },
        success: { type: Boolean, default: true },
        details: String
    }],
    
    // Follow-up tracking
    followUp: {
        required: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        assignedTo: String,
        dueDate: Date,
        notes: String
    },
    
    // Data quality
    dataQuality: {
        imageQuality: {
            type: Number,
            min: 0,
            max: 100,
            default: 80
        },
        detectionAccuracy: {
            type: Number,
            min: 0,
            max: 100,
            default: 85
        },
        processingReliability: {
            type: Number,
            min: 0,
            max: 100,
            default: 90
        }
    },
    
    // Metadata
    metadata: {
        source: {
            type: String,
            enum: ['camera', 'upload', 'api'],
            default: 'camera'
        },
        deviceId: String,
        sessionId: String,
        batchId: String,
        sequenceNumber: Number
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
    collection: 'ai_detections'
});

// Indexes for better performance
aiDetectionSchema.index({ timestamp: -1 });
aiDetectionSchema.index({ 'analysis.detectedObjects.type': 1, timestamp: -1 });
aiDetectionSchema.index({ alertLevel: 1, timestamp: -1 });
aiDetectionSchema.index({ 'analysis.threatAssessment.level': 1, timestamp: -1 });
aiDetectionSchema.index({ 'verification.humanVerified': 1, timestamp: -1 });
aiDetectionSchema.index({ 'verification.falsePositive': 1, timestamp: -1 });
aiDetectionSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
aiDetectionSchema.index({ 'metadata.deviceId': 1, timestamp: -1 });

// Virtual for detection count
aiDetectionSchema.virtual('detectionCount').get(function() {
    return this.analysis.detectedObjects.length;
});

// Virtual for primary object type
aiDetectionSchema.virtual('primaryObjectType').get(function() {
    if (this.analysis.detectedObjects.length === 0) return 'none';
    
    const highestConfidence = Math.max(...this.analysis.detectedObjects.map(obj => obj.confidence));
    const primaryObject = this.analysis.detectedObjects.find(obj => obj.confidence === highestConfidence);
    return primaryObject.type;
});

// Virtual for risk assessment
aiDetectionSchema.virtual('riskLevel').get(function() {
    const threatLevel = this.analysis.threatAssessment.level;
    const alertLevel = this.alertLevel;
    const suspicious = this.analysis.behavioralAnalysis.suspicious;
    
    if (threatLevel === 'critical' || alertLevel === 'critical') return 'critical';
    if (threatLevel === 'high' || alertLevel === 'high' || suspicious) return 'high';
    if (threatLevel === 'medium' || alertLevel === 'medium') return 'medium';
    return 'low';
});

// Virtual for processing efficiency
aiDetectionSchema.virtual('processingEfficiency').get(function() {
    const processingTime = this.processingInfo.processingTime;
    const objectCount = this.analysis.detectedObjects.length;
    
    if (processingTime === 0) return 0;
    return Math.round((objectCount / processingTime) * 1000); // objects per second
});

// Methods
aiDetectionSchema.methods.addAction = function(type, details = '') {
    this.actions.push({
        type,
        details,
        timestamp: new Date()
    });
    return this.save();
};

aiDetectionSchema.methods.verifyDetection = function(verifiedBy, notes = '') {
    this.verification.humanVerified = true;
    this.verification.verifiedBy = verifiedBy;
    this.verification.verificationTimestamp = new Date();
    this.verification.verificationNotes = notes;
    return this.save();
};

aiDetectionSchema.methods.markFalsePositive = function() {
    this.verification.falsePositive = true;
    this.verification.humanVerified = true;
    return this.save();
};

aiDetectionSchema.methods.addAlertTrigger = function(type, description, severity = 'medium') {
    this.alertTriggers.push({
        type,
        description,
        severity,
        timestamp: new Date()
    });
    return this.save();
};

aiDetectionSchema.methods.updateFollowUp = function(status, assignedTo = '', notes = '') {
    this.followUp.status = status;
    if (assignedTo) this.followUp.assignedTo = assignedTo;
    if (notes) this.followUp.notes = notes;
    return this.save();
};

// Static methods
aiDetectionSchema.statics.getDetectionsByType = function(objectType, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        'analysis.detectedObjects.type': objectType,
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

aiDetectionSchema.statics.getHighRiskDetections = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        $or: [
            { 'analysis.threatAssessment.level': { $in: ['high', 'critical'] } },
            { alertLevel: { $in: ['high', 'critical'] } },
            { 'analysis.behavioralAnalysis.suspicious': true }
        ],
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

aiDetectionSchema.statics.getDetectionStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        { $unwind: '$analysis.detectedObjects' },
        {
            $group: {
                _id: '$analysis.detectedObjects.type',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$analysis.detectedObjects.confidence' },
                maxConfidence: { $max: '$analysis.detectedObjects.confidence' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

aiDetectionSchema.statics.getAlertStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: '$alertLevel',
                count: { $sum: 1 },
                avgRiskScore: { $avg: '$analysis.threatAssessment.riskScore' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

aiDetectionSchema.statics.getFalsePositiveRate = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                falsePositives: { $sum: { $cond: ['$verification.falsePositive', 1, 0] } },
                verified: { $sum: { $cond: ['$verification.humanVerified', 1, 0] } }
            }
        },
        {
            $project: {
                total: 1,
                falsePositives: 1,
                verified: 1,
                falsePositiveRate: {
                    $cond: [
                        { $gt: ['$verified', 0] },
                        { $multiply: [{ $divide: ['$falsePositives', '$verified'] }, 100] },
                        0
                    ]
                }
            }
        }
    ]);
};

aiDetectionSchema.statics.getPerformanceMetrics = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                avgProcessingTime: { $avg: '$processingInfo.processingTime' },
                avgConfidence: { $avg: '$analysis.overallConfidence' },
                avgImageQuality: { $avg: '$dataQuality.imageQuality' },
                avgDetectionAccuracy: { $avg: '$dataQuality.detectionAccuracy' },
                totalDetections: { $sum: 1 },
                avgObjectsPerDetection: { $avg: { $size: '$analysis.detectedObjects' } }
            }
        }
    ]);
};

// Pre-save middleware
aiDetectionSchema.pre('save', function(next) {
    // Calculate overall confidence
    if (this.analysis.detectedObjects.length > 0) {
        this.analysis.overallConfidence = this.analysis.detectedObjects.reduce((sum, obj) => sum + obj.confidence, 0) / this.analysis.detectedObjects.length;
    }
    
    // Determine alert level based on analysis
    if (this.analysis.threatAssessment.level === 'critical' || this.analysis.behavioralAnalysis.suspicious) {
        this.alertLevel = 'critical';
    } else if (this.analysis.threatAssessment.level === 'high') {
        this.alertLevel = 'high';
    } else if (this.analysis.detectedObjects.some(obj => obj.type === 'person' && obj.confidence > 0.8)) {
        this.alertLevel = 'medium';
    } else {
        this.alertLevel = 'low';
    }
    
    next();
});

module.exports = mongoose.model('AIDetection', aiDetectionSchema);

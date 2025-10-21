/**
 * Yahmi Security Rover - Video Recording Model
 * MongoDB schema for video recordings and media management
 */

const mongoose = require('mongoose');

const videoRecordingSchema = new mongoose.Schema({
    // Recording identification
    recordingId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Recording metadata
    filename: {
        type: String,
        required: true
    },
    
    originalFilename: String,
    
    // File information
    fileInfo: {
        size: { type: Number, required: true }, // bytes
        duration: { type: Number, required: true }, // seconds
        format: { type: String, required: true }, // mp4, avi, mov, etc.
        codec: String,
        bitrate: Number,
        resolution: {
            width: { type: Number, required: true },
            height: { type: Number, required: true }
        },
        frameRate: { type: Number, default: 30 },
        quality: {
            type: String,
            enum: ['low', 'medium', 'high', 'ultra'],
            default: 'medium'
        }
    },
    
    // Recording details
    recording: {
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        duration: { type: Number, required: true }, // seconds
        triggeredBy: {
            type: String,
            enum: ['manual', 'motion', 'ai_detection', 'scheduled', 'emergency', 'patrol'],
            default: 'manual'
        },
        triggerData: mongoose.Schema.Types.Mixed
    },
    
    // Location and context
    location: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        accuracy: Number,
        address: String,
        zone: String,
        patrolRoute: String
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
        cameraModel: String,
        cameraSettings: {
            quality: Number,
            brightness: Number,
            contrast: Number,
            saturation: Number
        }
    },
    
    // AI analysis results
    aiAnalysis: {
        analyzed: { type: Boolean, default: false },
        analysisTime: Date,
        detectedObjects: [{
            type: String,
            confidence: Number,
            timestamp: Number, // seconds from start
            boundingBox: {
                x: Number,
                y: Number,
                width: Number,
                height: Number
            }
        }],
        sceneAnalysis: {
            environment: String,
            lighting: String,
            weather: String,
            timeOfDay: String
        },
        threatAssessment: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'low'
            },
            riskScore: { type: Number, min: 0, max: 100, default: 0 },
            factors: [String]
        },
        behavioralAnalysis: {
            suspicious: { type: Boolean, default: false },
            activities: [String],
            movement: String,
            interactions: [String]
        }
    },
    
    // Recording settings
    settings: {
        quality: {
            type: String,
            enum: ['low', 'medium', 'high', 'ultra'],
            default: 'medium'
        },
        resolution: {
            width: { type: Number, default: 640 },
            height: { type: Number, default: 480 }
        },
        frameRate: { type: Number, default: 30 },
        bitrate: Number,
        compression: {
            type: String,
            enum: ['h264', 'h265', 'mpeg4'],
            default: 'h264'
        },
        audio: {
            enabled: { type: Boolean, default: true },
            quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
            channels: { type: Number, default: 2 },
            sampleRate: { type: Number, default: 44100 }
        }
    },
    
    // Storage information
    storage: {
        path: { type: String, required: true },
        url: String,
        cloudStorage: {
            enabled: { type: Boolean, default: false },
            provider: String,
            bucket: String,
            key: String,
            region: String
        },
        localBackup: { type: Boolean, default: true },
        compressed: { type: Boolean, default: false },
        encrypted: { type: Boolean, default: false }
    },
    
    // Access control
    access: {
        public: { type: Boolean, default: false },
        restricted: { type: Boolean, default: false },
        allowedUsers: [String],
        allowedRoles: [String],
        password: String,
        expiresAt: Date
    },
    
    // Recording status
    status: {
        type: String,
        enum: ['recording', 'processing', 'ready', 'archived', 'deleted', 'error'],
        default: 'recording'
    },
    
    // Processing information
    processing: {
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        progress: { type: Number, min: 0, max: 100, default: 0 },
        startTime: Date,
        endTime: Date,
        duration: Number, // milliseconds
        tasks: [{
            name: String,
            status: String,
            progress: Number,
            startTime: Date,
            endTime: Date,
            error: String
        }]
    },
    
    // Thumbnails and previews
    thumbnails: [{
        timestamp: Number, // seconds from start
        filename: String,
        url: String,
        size: Number,
        width: Number,
        height: Number
    }],
    
    preview: {
        filename: String,
        url: String,
        duration: Number, // seconds
        size: Number
    },
    
    // Tags and categorization
    tags: [String],
    category: {
        type: String,
        enum: ['surveillance', 'patrol', 'incident', 'routine', 'test'],
        default: 'surveillance'
    },
    
    // User information
    createdBy: String,
    lastModifiedBy: String,
    
    // Viewing statistics
    views: {
        count: { type: Number, default: 0 },
        uniqueViewers: { type: Number, default: 0 },
        lastViewed: Date,
        viewHistory: [{
            userId: String,
            timestamp: { type: Date, default: Date.now },
            duration: Number // seconds watched
        }]
    },
    
    // Download statistics
    downloads: {
        count: { type: Number, default: 0 },
        lastDownloaded: Date,
        downloadHistory: [{
            userId: String,
            timestamp: { type: Date, default: Date.now },
            ipAddress: String
        }]
    },
    
    // Sharing information
    sharing: {
        enabled: { type: Boolean, default: false },
        shareToken: String,
        shareUrl: String,
        expiresAt: Date,
        password: String,
        allowedEmails: [String]
    },
    
    // Quality metrics
    quality: {
        videoQuality: { type: Number, min: 0, max: 100, default: 80 },
        audioQuality: { type: Number, min: 0, max: 100, default: 80 },
        stability: { type: Number, min: 0, max: 100, default: 90 },
        clarity: { type: Number, min: 0, max: 100, default: 85 }
    },
    
    // Error information
    errors: [{
        type: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        }
    }],
    
    // Metadata
    metadata: {
        source: {
            type: String,
            enum: ['camera', 'upload', 'stream'],
            default: 'camera'
        },
        sessionId: String,
        batchId: String,
        sequenceNumber: Number,
        environment: String,
        weather: String,
        lighting: String
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
    collection: 'video_recordings'
});

// Indexes for better performance
videoRecordingSchema.index({ recordingId: 1 });
videoRecordingSchema.index({ timestamp: -1 });
videoRecordingSchema.index({ 'recording.startTime': -1 });
videoRecordingSchema.index({ 'recording.endTime': -1 });
videoRecordingSchema.index({ status: 1, timestamp: -1 });
videoRecordingSchema.index({ 'deviceInfo.deviceType': 1, timestamp: -1 });
videoRecordingSchema.index({ 'recording.triggeredBy': 1, timestamp: -1 });
videoRecordingSchema.index({ category: 1, timestamp: -1 });
videoRecordingSchema.index({ tags: 1, timestamp: -1 });
videoRecordingSchema.index({ 'access.public': 1, timestamp: -1 });
videoRecordingSchema.index({ 'aiAnalysis.analyzed': 1, timestamp: -1 });

// Virtual for recording duration in human readable format
videoRecordingSchema.virtual('formattedDuration').get(function() {
    const duration = this.recording.duration;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
});

// Virtual for file size in human readable format
videoRecordingSchema.virtual('formattedSize').get(function() {
    const size = this.fileInfo.size;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024;
        unitIndex++;
    }
    
    return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
});

// Virtual for is accessible
videoRecordingSchema.virtual('isAccessible').get(function() {
    if (this.access.public) return true;
    if (this.access.expiresAt && this.access.expiresAt < new Date()) return false;
    return this.status === 'ready' || this.status === 'archived';
});

// Virtual for has AI analysis
videoRecordingSchema.virtual('hasAIAnalysis').get(function() {
    return this.aiAnalysis.analyzed && this.aiAnalysis.detectedObjects.length > 0;
});

// Virtual for threat level
videoRecordingSchema.virtual('threatLevel').get(function() {
    if (this.aiAnalysis.threatAssessment.level === 'critical') return 'critical';
    if (this.aiAnalysis.threatAssessment.level === 'high') return 'high';
    if (this.aiAnalysis.behavioralAnalysis.suspicious) return 'medium';
    return 'low';
});

// Methods
videoRecordingSchema.methods.addView = function(userId, duration = 0) {
    this.views.count += 1;
    this.views.lastViewed = new Date();
    
    if (userId) {
        this.views.viewHistory.push({
            userId,
            duration,
            timestamp: new Date()
        });
        
        // Keep only last 100 view records
        if (this.views.viewHistory.length > 100) {
            this.views.viewHistory = this.views.viewHistory.slice(-100);
        }
    }
    
    return this.save();
};

videoRecordingSchema.methods.addDownload = function(userId, ipAddress) {
    this.downloads.count += 1;
    this.downloads.lastDownloaded = new Date();
    
    this.downloads.downloadHistory.push({
        userId,
        ipAddress,
        timestamp: new Date()
    });
    
    // Keep only last 50 download records
    if (this.downloads.downloadHistory.length > 50) {
        this.downloads.downloadHistory = this.downloads.downloadHistory.slice(-50);
    }
    
    return this.save();
};

videoRecordingSchema.methods.addError = function(type, message, severity = 'medium') {
    this.errors.push({
        type,
        message,
        severity,
        timestamp: new Date()
    });
    return this.save();
};

videoRecordingSchema.methods.updateProcessingStatus = function(status, progress = null) {
    this.processing.status = status;
    if (progress !== null) {
        this.processing.progress = progress;
    }
    
    if (status === 'processing' && !this.processing.startTime) {
        this.processing.startTime = new Date();
    } else if (status === 'completed' || status === 'failed') {
        this.processing.endTime = new Date();
        if (this.processing.startTime) {
            this.processing.duration = this.processing.endTime.getTime() - this.processing.startTime.getTime();
        }
    }
    
    return this.save();
};

videoRecordingSchema.methods.addProcessingTask = function(name, status = 'pending') {
    this.processing.tasks.push({
        name,
        status,
        progress: 0,
        startTime: new Date()
    });
    return this.save();
};

videoRecordingSchema.methods.updateProcessingTask = function(name, status, progress = null, error = null) {
    const task = this.processing.tasks.find(t => t.name === name);
    if (task) {
        task.status = status;
        if (progress !== null) task.progress = progress;
        if (error) task.error = error;
        if (status === 'completed' || status === 'failed') {
            task.endTime = new Date();
        }
    }
    return this.save();
};

videoRecordingSchema.methods.addThumbnail = function(timestamp, filename, url, size, width, height) {
    this.thumbnails.push({
        timestamp,
        filename,
        url,
        size,
        width,
        height
    });
    return this.save();
};

videoRecordingSchema.methods.setSharing = function(enabled, expiresAt = null, password = null, allowedEmails = []) {
    this.sharing.enabled = enabled;
    if (enabled) {
        this.sharing.shareToken = this.constructor.generateShareToken();
        this.sharing.shareUrl = `/share/${this.sharing.shareToken}`;
        this.sharing.expiresAt = expiresAt;
        this.sharing.password = password;
        this.sharing.allowedEmails = allowedEmails;
    } else {
        this.sharing.shareToken = null;
        this.sharing.shareUrl = null;
        this.sharing.expiresAt = null;
        this.sharing.password = null;
        this.sharing.allowedEmails = [];
    }
    return this.save();
};

// Static methods
videoRecordingSchema.statics.generateRecordingId = function() {
    return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

videoRecordingSchema.statics.generateShareToken = function() {
    return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

videoRecordingSchema.statics.getRecordingsByDateRange = function(startDate, endDate) {
    return this.find({
        'recording.startTime': { $gte: startDate, $lte: endDate }
    }).sort({ 'recording.startTime': -1 });
};

videoRecordingSchema.statics.getRecordingsByTrigger = function(triggeredBy, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        'recording.triggeredBy': triggeredBy,
        'recording.startTime': { $gte: cutoffDate }
    }).sort({ 'recording.startTime': -1 });
};

videoRecordingSchema.statics.getRecordingsWithAI = function() {
    return this.find({
        'aiAnalysis.analyzed': true
    }).sort({ timestamp: -1 });
};

videoRecordingSchema.statics.getRecordingsByThreatLevel = function(level) {
    return this.find({
        'aiAnalysis.threatAssessment.level': level
    }).sort({ timestamp: -1 });
};

videoRecordingSchema.statics.getRecordingStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { 'recording.startTime': { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                totalDuration: { $sum: '$recording.duration' },
                totalSize: { $sum: '$fileInfo.size' },
                byTrigger: {
                    $push: {
                        trigger: '$recording.triggeredBy',
                        count: 1
                    }
                },
                byStatus: {
                    $push: {
                        status: '$status',
                        count: 1
                    }
                },
                withAI: { $sum: { $cond: ['$aiAnalysis.analyzed', 1, 0] } },
                withThreats: { $sum: { $cond: [{ $ne: ['$aiAnalysis.threatAssessment.level', 'low'] }, 1, 0] } }
            }
        }
    ]);
};

videoRecordingSchema.statics.getStorageStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalSize: { $sum: '$fileInfo.size' },
                totalRecordings: { $sum: 1 },
                avgSize: { $avg: '$fileInfo.size' },
                avgDuration: { $avg: '$recording.duration' },
                byQuality: {
                    $push: {
                        quality: '$fileInfo.quality',
                        count: 1
                    }
                }
            }
        }
    ]);
};

videoRecordingSchema.statics.cleanupOldRecordings = function(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.deleteMany({
        'recording.startTime': { $lt: cutoffDate },
        status: { $in: ['archived', 'deleted'] }
    });
};

// Pre-save middleware
videoRecordingSchema.pre('save', function(next) {
    // Generate recording ID if not present
    if (!this.recordingId) {
        this.recordingId = this.constructor.generateRecordingId();
    }
    
    // Calculate duration if not set
    if (this.recording.startTime && this.recording.endTime && !this.recording.duration) {
        this.recording.duration = Math.floor((this.recording.endTime.getTime() - this.recording.startTime.getTime()) / 1000);
    }
    
    // Set status based on processing
    if (this.processing.status === 'completed' && this.status === 'recording') {
        this.status = 'ready';
    }
    
    next();
});

module.exports = mongoose.model('VideoRecording', videoRecordingSchema);

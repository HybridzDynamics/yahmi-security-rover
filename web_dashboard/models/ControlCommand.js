/**
 * Yahmi Security Rover - Control Command Model
 * MongoDB schema for control commands and system instructions
 */

const mongoose = require('mongoose');

const controlCommandSchema = new mongoose.Schema({
    // Command identification
    commandId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Command type and action
    commandType: {
        type: String,
        enum: ['motor', 'camera', 'audio', 'ai', 'system', 'mode', 'emergency'],
        required: true
    },
    
    action: {
        type: String,
        required: true
    },
    
    // Command parameters
    parameters: {
        speed: { type: Number, min: -100, max: 100 },
        direction: { type: String, enum: ['forward', 'backward', 'left', 'right', 'stop'] },
        duration: { type: Number, min: 0 },
        value: mongoose.Schema.Types.Mixed,
        settings: mongoose.Schema.Types.Mixed
    },
    
    // Command source
    source: {
        type: String,
        enum: ['web_dashboard', 'mobile_app', 'api', 'scheduled', 'autonomous', 'emergency'],
        default: 'web_dashboard'
    },
    
    userId: {
        type: String,
        default: 'anonymous'
    },
    
    sessionId: {
        type: String
    },
    
    // Command execution
    status: {
        type: String,
        enum: ['pending', 'executing', 'completed', 'failed', 'cancelled', 'timeout'],
        default: 'pending'
    },
    
    executionInfo: {
        startTime: Date,
        endTime: Date,
        duration: Number, // milliseconds
        attempts: { type: Number, default: 0 },
        maxAttempts: { type: Number, default: 3 },
        timeout: { type: Number, default: 30000 } // 30 seconds
    },
    
    // Response data
    response: {
        success: { type: Boolean, default: false },
        message: String,
        data: mongoose.Schema.Types.Mixed,
        error: String,
        errorCode: String
    },
    
    // Device information
    deviceInfo: {
        deviceType: {
            type: String,
            enum: ['esp32', 'raspberry_pi'],
            default: 'esp32'
        },
        deviceId: String,
        firmwareVersion: String,
        ipAddress: String,
        macAddress: String
    },
    
    // Priority and scheduling
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical', 'emergency'],
        default: 'normal'
    },
    
    scheduledFor: Date,
    expiresAt: Date,
    
    // Command dependencies
    dependencies: [{
        commandId: String,
        status: String,
        required: { type: Boolean, default: true }
    }],
    
    // Rollback information
    rollback: {
        enabled: { type: Boolean, default: false },
        command: mongoose.Schema.Types.Mixed,
        executed: { type: Boolean, default: false }
    },
    
    // Safety checks
    safetyChecks: {
        batteryLevel: { type: Number, min: 0, max: 100 },
        obstacleDetected: { type: Boolean, default: false },
        emergencyStop: { type: Boolean, default: false },
        systemHealth: {
            type: String,
            enum: ['healthy', 'warning', 'critical'],
            default: 'healthy'
        }
    },
    
    // Command validation
    validation: {
        isValid: { type: Boolean, default: true },
        validationErrors: [String],
        safetyApproved: { type: Boolean, default: true },
        userAuthorized: { type: Boolean, default: true }
    },
    
    // Execution context
    context: {
        currentMode: {
            type: String,
            enum: ['manual', 'autonomous', 'patrol', 'surveillance'],
            default: 'manual'
        },
        location: {
            latitude: Number,
            longitude: Number,
            zone: String
        },
        environment: {
            lighting: String,
            weather: String,
            timeOfDay: String
        }
    },
    
    // Logging and debugging
    logs: [{
        level: {
            type: String,
            enum: ['debug', 'info', 'warn', 'error'],
            default: 'info'
        },
        message: String,
        timestamp: { type: Date, default: Date.now },
        data: mongoose.Schema.Types.Mixed
    }],
    
    // Performance metrics
    metrics: {
        networkLatency: Number,
        processingTime: Number,
        deviceResponseTime: Number,
        totalExecutionTime: Number
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
    collection: 'control_commands'
});

// Indexes for better performance
controlCommandSchema.index({ commandId: 1 });
controlCommandSchema.index({ timestamp: -1 });
controlCommandSchema.index({ commandType: 1, timestamp: -1 });
controlCommandSchema.index({ status: 1, timestamp: -1 });
controlCommandSchema.index({ userId: 1, timestamp: -1 });
controlCommandSchema.index({ 'deviceInfo.deviceType': 1, timestamp: -1 });
controlCommandSchema.index({ priority: 1, timestamp: -1 });
controlCommandSchema.index({ scheduledFor: 1 });

// Virtual for execution duration
controlCommandSchema.virtual('executionDuration').get(function() {
    if (this.executionInfo.startTime && this.executionInfo.endTime) {
        return this.executionInfo.endTime.getTime() - this.executionInfo.startTime.getTime();
    }
    return null;
});

// Virtual for command age
controlCommandSchema.virtual('commandAge').get(function() {
    return Date.now() - this.timestamp.getTime();
});

// Virtual for is expired
controlCommandSchema.virtual('isExpired').get(function() {
    if (this.expiresAt) {
        return Date.now() > this.expiresAt.getTime();
    }
    return false;
});

// Virtual for is ready to execute
controlCommandSchema.virtual('isReadyToExecute').get(function() {
    return this.status === 'pending' && 
           this.validation.isValid && 
           this.validation.safetyApproved && 
           this.validation.userAuthorized &&
           !this.isExpired;
});

// Methods
controlCommandSchema.methods.addLog = function(level, message, data = null) {
    this.logs.push({
        level,
        message,
        data,
        timestamp: new Date()
    });
    return this.save();
};

controlCommandSchema.methods.startExecution = function() {
    this.status = 'executing';
    this.executionInfo.startTime = new Date();
    this.executionInfo.attempts += 1;
    return this.save();
};

controlCommandSchema.methods.completeExecution = function(responseData = null) {
    this.status = 'completed';
    this.executionInfo.endTime = new Date();
    this.executionInfo.duration = this.executionDuration;
    this.response.success = true;
    if (responseData) {
        this.response.data = responseData;
    }
    return this.save();
};

controlCommandSchema.methods.failExecution = function(error, errorCode = null) {
    this.status = 'failed';
    this.executionInfo.endTime = new Date();
    this.executionInfo.duration = this.executionDuration;
    this.response.success = false;
    this.response.error = error;
    if (errorCode) {
        this.response.errorCode = errorCode;
    }
    return this.save();
};

controlCommandSchema.methods.cancelCommand = function(reason = '') {
    this.status = 'cancelled';
    this.executionInfo.endTime = new Date();
    this.response.message = reason;
    return this.save();
};

controlCommandSchema.methods.retryCommand = function() {
    if (this.executionInfo.attempts < this.executionInfo.maxAttempts) {
        this.status = 'pending';
        this.executionInfo.startTime = null;
        this.executionInfo.endTime = null;
        this.response.error = null;
        return this.save();
    }
    return this.failExecution('Max retry attempts exceeded');
};

controlCommandSchema.methods.addDependency = function(commandId, required = true) {
    this.dependencies.push({
        commandId,
        status: 'pending',
        required
    });
    return this.save();
};

controlCommandSchema.methods.updateDependency = function(commandId, status) {
    const dependency = this.dependencies.find(dep => dep.commandId === commandId);
    if (dependency) {
        dependency.status = status;
    }
    return this.save();
};

controlCommandSchema.methods.validateCommand = function() {
    const errors = [];
    
    // Check required fields
    if (!this.commandType) {
        errors.push('Command type is required');
    }
    if (!this.action) {
        errors.push('Action is required');
    }
    
    // Check parameter validity based on command type
    if (this.commandType === 'motor') {
        if (this.parameters.speed && (this.parameters.speed < -100 || this.parameters.speed > 100)) {
            errors.push('Motor speed must be between -100 and 100');
        }
    }
    
    // Check safety conditions
    if (this.safetyChecks.batteryLevel < 10) {
        errors.push('Battery level too low for command execution');
    }
    if (this.safetyChecks.emergencyStop) {
        errors.push('Emergency stop is active');
    }
    if (this.safetyChecks.systemHealth === 'critical') {
        errors.push('System health is critical');
    }
    
    this.validation.isValid = errors.length === 0;
    this.validation.validationErrors = errors;
    
    return this.validation.isValid;
};

// Static methods
controlCommandSchema.statics.generateCommandId = function() {
    return 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

controlCommandSchema.statics.getPendingCommands = function(deviceType = null) {
    const query = { status: 'pending' };
    if (deviceType) {
        query['deviceInfo.deviceType'] = deviceType;
    }
    return this.find(query).sort({ priority: -1, timestamp: 1 });
};

controlCommandSchema.statics.getCommandsByUser = function(userId, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        userId,
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

controlCommandSchema.statics.getCommandStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                executing: { $sum: { $cond: [{ $eq: ['$status', 'executing'] }, 1, 0] } },
                avgExecutionTime: { $avg: '$executionInfo.duration' }
            }
        }
    ]);
};

controlCommandSchema.statics.getCommandsByType = function(commandType, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { commandType, timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                successRate: {
                    $avg: { $cond: [{ $eq: ['$response.success', true] }, 1, 0] }
                },
                avgExecutionTime: { $avg: '$executionInfo.duration' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

controlCommandSchema.statics.getFailedCommands = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        status: 'failed',
        timestamp: { $gte: cutoffDate }
    }).sort({ timestamp: -1 });
};

controlCommandSchema.statics.cleanupOldCommands = function(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.deleteMany({
        timestamp: { $lt: cutoffDate },
        status: { $in: ['completed', 'failed', 'cancelled'] }
    });
};

// Pre-save middleware
controlCommandSchema.pre('save', function(next) {
    // Generate command ID if not present
    if (!this.commandId) {
        this.commandId = this.constructor.generateCommandId();
    }
    
    // Set expiration time if not set (default 1 hour)
    if (!this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    // Validate command before saving
    this.validateCommand();
    
    next();
});

module.exports = mongoose.model('ControlCommand', controlCommandSchema);

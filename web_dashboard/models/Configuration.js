/**
 * Yahmi Security Rover - Configuration Model
 * MongoDB schema for system configuration and settings
 */

const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
    // Configuration identification
    configId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Configuration type
    type: {
        type: String,
        enum: ['system', 'device', 'camera', 'ai', 'network', 'security', 'user'],
        required: true
    },
    
    // Configuration name
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    // Configuration description
    description: String,
    
    // Configuration version
    version: {
        type: String,
        default: '1.0.0'
    },
    
    // Device configuration
    deviceConfig: {
        deviceType: {
            type: String,
            enum: ['esp32', 'raspberry_pi'],
            default: 'esp32'
        },
        deviceId: String,
        firmwareVersion: String,
        hardwareVersion: String,
        ipAddress: String,
        port: { type: Number, default: 80 },
        macAddress: String
    },
    
    // Camera configuration
    cameraConfig: {
        enabled: { type: Boolean, default: true },
        quality: { type: Number, min: 0, max: 63, default: 12 },
        brightness: { type: Number, min: -2, max: 2, default: 0 },
        contrast: { type: Number, min: -2, max: 2, default: 0 },
        saturation: { type: Number, min: -2, max: 2, default: 0 },
        resolution: {
            width: { type: Number, default: 640 },
            height: { type: Number, default: 480 }
        },
        frameRate: { type: Number, default: 30 },
        rotation: { type: Number, default: 0 },
        flip: {
            horizontal: { type: Boolean, default: false },
            vertical: { type: Boolean, default: false }
        },
        nightVision: { type: Boolean, default: false },
        autoFocus: { type: Boolean, default: true },
        zoom: { type: Number, min: 1, max: 10, default: 1 }
    },
    
    // AI configuration
    aiConfig: {
        enabled: { type: Boolean, default: true },
        model: { type: String, default: 'yolov8' },
        confidence: { type: Number, min: 0, max: 1, default: 0.5 },
        sensitivity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        detectionTypes: [{
            type: String,
            enum: ['person', 'vehicle', 'animal', 'object', 'unknown']
        }],
        alertThreshold: { type: Number, min: 0, max: 100, default: 70 },
        processingInterval: { type: Number, default: 1000 }, // milliseconds
        maxDetections: { type: Number, default: 10 },
        trackingEnabled: { type: Boolean, default: true },
        behavioralAnalysis: { type: Boolean, default: true },
        threatAssessment: { type: Boolean, default: true }
    },
    
    // Motor configuration
    motorConfig: {
        maxSpeed: { type: Number, min: 0, max: 100, default: 100 },
        acceleration: { type: Number, min: 1, max: 10, default: 5 },
        deceleration: { type: Number, min: 1, max: 10, default: 5 },
        turnSpeed: { type: Number, min: 0, max: 100, default: 50 },
        reverseSpeed: { type: Number, min: 0, max: 100, default: 30 },
        safetyStop: { type: Boolean, default: true },
        obstacleAvoidance: { type: Boolean, default: true },
        smoothMovement: { type: Boolean, default: true }
    },
    
    // Sensor configuration
    sensorConfig: {
        irSensors: {
            enabled: { type: Boolean, default: true },
            sensitivity: { type: Number, min: 0, max: 100, default: 50 },
            threshold: { type: Number, min: 0, max: 1023, default: 512 },
            calibration: {
                left: { type: Number, default: 0 },
                center: { type: Number, default: 0 },
                right: { type: Number, default: 0 }
            }
        },
        ultrasonic: {
            enabled: { type: Boolean, default: true },
            maxDistance: { type: Number, default: 400 },
            minDistance: { type: Number, default: 2 },
            triggerDistance: { type: Number, default: 50 },
            accuracy: { type: Number, min: 0, max: 100, default: 95 }
        },
        accelerometer: {
            enabled: { type: Boolean, default: true },
            sensitivity: { type: Number, min: 1, max: 10, default: 5 },
            threshold: { type: Number, default: 0.5 }
        },
        gyroscope: {
            enabled: { type: Boolean, default: true },
            sensitivity: { type: Number, min: 1, max: 10, default: 5 },
            threshold: { type: Number, default: 0.5 }
        }
    },
    
    // Network configuration
    networkConfig: {
        wifi: {
            ssid: String,
            password: String,
            security: {
                type: String,
                enum: ['none', 'wep', 'wpa', 'wpa2', 'wpa3'],
                default: 'wpa2'
            },
            hidden: { type: Boolean, default: false }
        },
        ethernet: {
            enabled: { type: Boolean, default: false },
            ipAddress: String,
            subnet: String,
            gateway: String,
            dns: [String]
        },
        hotspot: {
            enabled: { type: Boolean, default: false },
            ssid: String,
            password: String,
            channel: { type: Number, min: 1, max: 11, default: 6 }
        },
        port: { type: Number, default: 80 },
        ssl: { type: Boolean, default: false },
        certificate: String,
        privateKey: String
    },
    
    // Security configuration
    securityConfig: {
        authentication: {
            enabled: { type: Boolean, default: true },
            method: {
                type: String,
                enum: ['basic', 'token', 'oauth', 'ldap'],
                default: 'token'
            },
            sessionTimeout: { type: Number, default: 3600 }, // seconds
            maxLoginAttempts: { type: Number, default: 5 },
            lockoutDuration: { type: Number, default: 1800 } // seconds
        },
        encryption: {
            enabled: { type: Boolean, default: true },
            algorithm: { type: String, default: 'AES-256' },
            keyRotation: { type: Number, default: 30 } // days
        },
        accessControl: {
            ipWhitelist: [String],
            ipBlacklist: [String],
            timeRestrictions: [{
                day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                startTime: String,
                endTime: String
            }],
            roleBasedAccess: { type: Boolean, default: true }
        },
        audit: {
            enabled: { type: Boolean, default: true },
            logLevel: {
                type: String,
                enum: ['debug', 'info', 'warn', 'error'],
                default: 'info'
            },
            retentionDays: { type: Number, default: 90 }
        }
    },
    
    // System configuration
    systemConfig: {
        battery: {
            lowThreshold: { type: Number, min: 0, max: 100, default: 20 },
            criticalThreshold: { type: Number, min: 0, max: 100, default: 10 },
            autoReturn: { type: Boolean, default: true },
            chargingStation: {
                enabled: { type: Boolean, default: false },
                location: {
                    latitude: Number,
                    longitude: Number
                }
            }
        },
        performance: {
            cpuLimit: { type: Number, min: 0, max: 100, default: 80 },
            memoryLimit: { type: Number, min: 0, max: 100, default: 80 },
            temperatureLimit: { type: Number, default: 60 },
            autoRestart: { type: Boolean, default: true },
            healthCheckInterval: { type: Number, default: 300 } // seconds
        },
        data: {
            retentionDays: { type: Number, default: 30 },
            compression: { type: Boolean, default: true },
            backup: {
                enabled: { type: Boolean, default: true },
                interval: { type: Number, default: 24 }, // hours
                location: String
            }
        }
    },
    
    // Patrol configuration
    patrolConfig: {
        enabled: { type: Boolean, default: false },
        routes: [{
            name: String,
            waypoints: [{
                latitude: Number,
                longitude: Number,
                order: Number
            }],
            speed: { type: Number, min: 0, max: 100, default: 50 },
            duration: { type: Number, default: 3600 }, // seconds
            repeat: { type: Boolean, default: true }
        }],
        schedule: [{
            routeId: String,
            startTime: String,
            endTime: String,
            days: [String],
            enabled: { type: Boolean, default: true }
        }],
        emergencyReturn: { type: Boolean, default: true },
        obstacleAvoidance: { type: Boolean, default: true }
    },
    
    // Surveillance configuration
    surveillanceConfig: {
        enabled: { type: Boolean, default: false },
        zones: [{
            name: String,
            coordinates: [{
                latitude: Number,
                longitude: Number
            }],
            sensitivity: { type: Number, min: 0, max: 100, default: 50 },
            alertTypes: [String],
            enabled: { type: Boolean, default: true }
        }],
        recording: {
            enabled: { type: Boolean, default: true },
            quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
            duration: { type: Number, default: 300 }, // seconds
            storage: {
                maxSize: { type: Number, default: 1000 }, // MB
                autoDelete: { type: Boolean, default: true }
            }
        },
        alerts: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
            webhook: { type: Boolean, default: false },
            webhookUrl: String
        }
    },
    
    // Configuration status
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'error'],
        default: 'active'
    },
    
    // Configuration validation
    validation: {
        isValid: { type: Boolean, default: true },
        errors: [String],
        warnings: [String],
        lastValidated: Date
    },
    
    // Configuration metadata
    metadata: {
        createdBy: String,
        lastModifiedBy: String,
        tags: [String],
        category: String,
        environment: {
            type: String,
            enum: ['development', 'staging', 'production'],
            default: 'production'
        }
    },
    
    // Configuration history
    history: [{
        version: String,
        changes: String,
        modifiedBy: String,
        timestamp: { type: Date, default: Date.now }
    }],
    
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
    collection: 'configurations'
});

// Indexes for better performance
configurationSchema.index({ configId: 1 });
configurationSchema.index({ type: 1, timestamp: -1 });
configurationSchema.index({ status: 1, timestamp: -1 });
configurationSchema.index({ 'deviceConfig.deviceType': 1, timestamp: -1 });
configurationSchema.index({ 'metadata.environment': 1, timestamp: -1 });

// Virtual for configuration name
configurationSchema.virtual('displayName').get(function() {
    return this.name || `${this.type} Configuration`;
});

// Virtual for is active
configurationSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

// Virtual for has errors
configurationSchema.virtual('hasErrors').get(function() {
    return this.validation.errors && this.validation.errors.length > 0;
});

// Virtual for has warnings
configurationSchema.virtual('hasWarnings').get(function() {
    return this.validation.warnings && this.validation.warnings.length > 0;
});

// Methods
configurationSchema.methods.validateConfiguration = function() {
    const errors = [];
    const warnings = [];
    
    // Validate device configuration
    if (this.deviceConfig) {
        if (!this.deviceConfig.deviceType) {
            errors.push('Device type is required');
        }
        if (this.deviceConfig.ipAddress && !this.isValidIP(this.deviceConfig.ipAddress)) {
            errors.push('Invalid IP address format');
        }
    }
    
    // Validate camera configuration
    if (this.cameraConfig) {
        if (this.cameraConfig.quality < 0 || this.cameraConfig.quality > 63) {
            errors.push('Camera quality must be between 0 and 63');
        }
        if (this.cameraConfig.brightness < -2 || this.cameraConfig.brightness > 2) {
            errors.push('Camera brightness must be between -2 and 2');
        }
    }
    
    // Validate AI configuration
    if (this.aiConfig) {
        if (this.aiConfig.confidence < 0 || this.aiConfig.confidence > 1) {
            errors.push('AI confidence must be between 0 and 1');
        }
        if (this.aiConfig.detectionTypes && this.aiConfig.detectionTypes.length === 0) {
            warnings.push('No detection types configured');
        }
    }
    
    // Validate network configuration
    if (this.networkConfig && this.networkConfig.wifi) {
        if (!this.networkConfig.wifi.ssid) {
            errors.push('WiFi SSID is required');
        }
        if (this.networkConfig.wifi.security !== 'none' && !this.networkConfig.wifi.password) {
            errors.push('WiFi password is required for secured networks');
        }
    }
    
    // Update validation results
    this.validation.isValid = errors.length === 0;
    this.validation.errors = errors;
    this.validation.warnings = warnings;
    this.validation.lastValidated = new Date();
    
    return this.validation.isValid;
};

configurationSchema.methods.isValidIP = function(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
};

configurationSchema.methods.addHistoryEntry = function(version, changes, modifiedBy) {
    this.history.push({
        version,
        changes,
        modifiedBy,
        timestamp: new Date()
    });
    
    // Keep only last 50 history entries
    if (this.history.length > 50) {
        this.history = this.history.slice(-50);
    }
    
    return this.save();
};

configurationSchema.methods.clone = function(newName, createdBy) {
    const clonedConfig = this.toObject();
    delete clonedConfig._id;
    delete clonedConfig.configId;
    delete clonedConfig.createdAt;
    delete clonedConfig.updatedAt;
    delete clonedConfig.timestamp;
    
    clonedConfig.name = newName;
    clonedConfig.metadata.createdBy = createdBy;
    clonedConfig.metadata.lastModifiedBy = createdBy;
    clonedConfig.status = 'pending';
    clonedConfig.validation = {
        isValid: false,
        errors: [],
        warnings: [],
        lastValidated: null
    };
    clonedConfig.history = [];
    
    return clonedConfig;
};

configurationSchema.methods.export = function() {
    return {
        configId: this.configId,
        type: this.type,
        name: this.name,
        version: this.version,
        deviceConfig: this.deviceConfig,
        cameraConfig: this.cameraConfig,
        aiConfig: this.aiConfig,
        motorConfig: this.motorConfig,
        sensorConfig: this.sensorConfig,
        networkConfig: this.networkConfig,
        securityConfig: this.securityConfig,
        systemConfig: this.systemConfig,
        patrolConfig: this.patrolConfig,
        surveillanceConfig: this.surveillanceConfig,
        metadata: this.metadata,
        timestamp: this.timestamp
    };
};

// Static methods
configurationSchema.statics.generateConfigId = function() {
    return 'cfg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

configurationSchema.statics.getActiveConfigurations = function() {
    return this.find({ status: 'active' }).sort({ timestamp: -1 });
};

configurationSchema.statics.getConfigurationsByType = function(type) {
    return this.find({ type, status: 'active' }).sort({ timestamp: -1 });
};

configurationSchema.statics.getDeviceConfiguration = function(deviceType) {
    return this.findOne({
        'deviceConfig.deviceType': deviceType,
        status: 'active'
    }).sort({ timestamp: -1 });
};

configurationSchema.statics.validateAllConfigurations = function() {
    return this.find({ status: 'active' }).then(configs => {
        const results = [];
        configs.forEach(config => {
            const isValid = config.validateConfiguration();
            results.push({
                configId: config.configId,
                name: config.name,
                isValid,
                errors: config.validation.errors,
                warnings: config.validation.warnings
            });
        });
        return results;
    });
};

configurationSchema.statics.getConfigurationStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                byType: {
                    $push: {
                        type: '$type',
                        count: 1
                    }
                },
                withErrors: { $sum: { $cond: [{ $gt: [{ $size: '$validation.errors' }, 0] }, 1, 0] } },
                withWarnings: { $sum: { $cond: [{ $gt: [{ $size: '$validation.warnings' }, 0] }, 1, 0] } }
            }
        }
    ]);
};

// Pre-save middleware
configurationSchema.pre('save', function(next) {
    // Generate config ID if not present
    if (!this.configId) {
        this.configId = this.constructor.generateConfigId();
    }
    
    // Validate configuration before saving
    this.validateConfiguration();
    
    next();
});

module.exports = mongoose.model('Configuration', configurationSchema);

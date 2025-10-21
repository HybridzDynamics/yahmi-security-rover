/**
 * Yahmi Security Rover - Sensor Data Model
 * MongoDB schema for sensor readings and measurements
 */

const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    // IR Sensor data
    irSensors: {
        left: {
            type: Number,
            min: 0,
            max: 1023,
            default: 0
        },
        center: {
            type: Number,
            min: 0,
            max: 1023,
            default: 0
        },
        right: {
            type: Number,
            min: 0,
            max: 1023,
            default: 0
        }
    },
    
    // Ultrasonic sensor data
    ultrasonicDistance: {
        type: Number,
        min: 0,
        max: 400,
        default: 0
    },
    ultrasonicAccuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 95
    },
    
    // Accelerometer data
    accelerometer: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
    },
    
    // Gyroscope data
    gyroscope: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
    },
    
    // Environmental sensors
    temperature: {
        type: Number,
        default: 25
    },
    humidity: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    pressure: {
        type: Number,
        default: 1013.25
    },
    lightLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    
    // Motion detection
    motionDetected: {
        type: Boolean,
        default: false
    },
    motionIntensity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    motionDirection: {
        type: String,
        enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'unknown'],
        default: 'unknown'
    },
    
    // Obstacle detection
    obstacleDetected: {
        type: Boolean,
        default: false
    },
    obstacleDistance: {
        type: Number,
        min: 0,
        max: 400,
        default: 0
    },
    obstacleDirection: {
        type: String,
        enum: ['front', 'back', 'left', 'right', 'front-left', 'front-right', 'back-left', 'back-right', 'unknown'],
        default: 'unknown'
    },
    
    // Motor data
    motorData: {
        leftMotorSpeed: {
            type: Number,
            min: -100,
            max: 100,
            default: 0
        },
        rightMotorSpeed: {
            type: Number,
            min: -100,
            max: 100,
            default: 0
        },
        leftMotorDirection: {
            type: String,
            enum: ['forward', 'backward', 'stop'],
            default: 'stop'
        },
        rightMotorDirection: {
            type: String,
            enum: ['forward', 'backward', 'stop'],
            default: 'stop'
        },
        leftMotorCurrent: {
            type: Number,
            default: 0
        },
        rightMotorCurrent: {
            type: Number,
            default: 0
        }
    },
    
    // Position and orientation
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
    },
    orientation: {
        roll: { type: Number, default: 0 },
        pitch: { type: Number, default: 0 },
        yaw: { type: Number, default: 0 }
    },
    
    // GPS data (if available)
    gps: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        accuracy: Number,
        speed: Number,
        heading: Number,
        satellites: Number,
        fix: {
            type: String,
            enum: ['none', '2d', '3d'],
            default: 'none'
        }
    },
    
    // Audio sensors
    audioLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    audioFrequency: {
        type: Number,
        default: 0
    },
    soundDetected: {
        type: Boolean,
        default: false
    },
    
    // Vibration sensors
    vibration: {
        intensity: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        frequency: {
            type: Number,
            default: 0
        },
        detected: {
            type: Boolean,
            default: false
        }
    },
    
    // Sensor health status
    sensorHealth: {
        ir: { type: Boolean, default: true },
        ultrasonic: { type: Boolean, default: true },
        accelerometer: { type: Boolean, default: true },
        gyroscope: { type: Boolean, default: true },
        temperature: { type: Boolean, default: true },
        humidity: { type: Boolean, default: true },
        pressure: { type: Boolean, default: true },
        light: { type: Boolean, default: true },
        audio: { type: Boolean, default: true },
        vibration: { type: Boolean, default: true },
        gps: { type: Boolean, default: false }
    },
    
    // Calibration data
    calibration: {
        irOffset: {
            left: { type: Number, default: 0 },
            center: { type: Number, default: 0 },
            right: { type: Number, default: 0 }
        },
        ultrasonicOffset: { type: Number, default: 0 },
        accelerometerOffset: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            z: { type: Number, default: 0 }
        },
        gyroscopeOffset: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            z: { type: Number, default: 0 }
        }
    },
    
    // Data quality indicators
    dataQuality: {
        irAccuracy: { type: Number, min: 0, max: 100, default: 95 },
        ultrasonicAccuracy: { type: Number, min: 0, max: 100, default: 95 },
        accelerometerAccuracy: { type: Number, min: 0, max: 100, default: 90 },
        gyroscopeAccuracy: { type: Number, min: 0, max: 100, default: 90 },
        overallQuality: { type: Number, min: 0, max: 100, default: 90 }
    },
    
    // Anomaly detection
    anomalies: [{
        type: {
            type: String,
            enum: ['sensor_failure', 'unusual_reading', 'calibration_drift', 'noise', 'interference'],
            required: true
        },
        sensor: {
            type: String,
            required: true
        },
        value: Number,
        expectedValue: Number,
        deviation: Number,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        timestamp: { type: Date, default: Date.now }
    }],
    
    // Processing flags
    processed: {
        type: Boolean,
        default: false
    },
    aiAnalyzed: {
        type: Boolean,
        default: false
    },
    alertGenerated: {
        type: Boolean,
        default: false
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
    collection: 'sensor_data'
});

// Indexes for better performance
sensorDataSchema.index({ timestamp: -1 });
sensorDataSchema.index({ 'irSensors.left': 1, timestamp: -1 });
sensorDataSchema.index({ 'irSensors.center': 1, timestamp: -1 });
sensorDataSchema.index({ 'irSensors.right': 1, timestamp: -1 });
sensorDataSchema.index({ ultrasonicDistance: 1, timestamp: -1 });
sensorDataSchema.index({ motionDetected: 1, timestamp: -1 });
sensorDataSchema.index({ obstacleDetected: 1, timestamp: -1 });
sensorDataSchema.index({ 'gps.latitude': 1, 'gps.longitude': 1 });
sensorDataSchema.index({ processed: 1, timestamp: -1 });

// Virtual for obstacle proximity
sensorDataSchema.virtual('obstacleProximity').get(function() {
    if (!this.obstacleDetected) return 'none';
    if (this.obstacleDistance < 50) return 'very_close';
    if (this.obstacleDistance < 100) return 'close';
    if (this.obstacleDistance < 200) return 'moderate';
    return 'far';
});

// Virtual for motion intensity level
sensorDataSchema.virtual('motionLevel').get(function() {
    if (this.motionIntensity < 20) return 'low';
    if (this.motionIntensity < 50) return 'medium';
    if (this.motionIntensity < 80) return 'high';
    return 'very_high';
});

// Virtual for overall sensor health
sensorDataSchema.virtual('overallSensorHealth').get(function() {
    const healthValues = Object.values(this.sensorHealth);
    const healthyCount = healthValues.filter(h => h === true).length;
    const totalCount = healthValues.length;
    const healthPercentage = (healthyCount / totalCount) * 100;
    
    if (healthPercentage >= 90) return 'excellent';
    if (healthPercentage >= 75) return 'good';
    if (healthPercentage >= 50) return 'fair';
    return 'poor';
});

// Methods
sensorDataSchema.methods.addAnomaly = function(type, sensor, value, expectedValue, severity = 'medium') {
    const deviation = Math.abs(value - expectedValue);
    this.anomalies.push({
        type,
        sensor,
        value,
        expectedValue,
        deviation,
        severity,
        timestamp: new Date()
    });
    return this.save();
};

sensorDataSchema.methods.clearAnomalies = function() {
    this.anomalies = [];
    return this.save();
};

sensorDataSchema.methods.updateDataQuality = function() {
    const irAvg = (this.dataQuality.irAccuracy + this.dataQuality.ultrasonicAccuracy) / 2;
    const motionAvg = (this.dataQuality.accelerometerAccuracy + this.dataQuality.gyroscopeAccuracy) / 2;
    this.dataQuality.overallQuality = (irAvg + motionAvg) / 2;
    return this.save();
};

sensorDataSchema.methods.detectObstacle = function() {
    const threshold = 100; // cm
    this.obstacleDetected = this.ultrasonicDistance < threshold && this.ultrasonicDistance > 0;
    if (this.obstacleDetected) {
        this.obstacleDistance = this.ultrasonicDistance;
        // Determine direction based on IR sensors
        const leftIR = this.irSensors.left;
        const centerIR = this.irSensors.center;
        const rightIR = this.irSensors.right;
        
        if (leftIR > centerIR && leftIR > rightIR) {
            this.obstacleDirection = 'front-left';
        } else if (rightIR > centerIR && rightIR > leftIR) {
            this.obstacleDirection = 'front-right';
        } else if (centerIR > leftIR && centerIR > rightIR) {
            this.obstacleDirection = 'front';
        } else {
            this.obstacleDirection = 'unknown';
        }
    }
    return this.save();
};

sensorDataSchema.methods.detectMotion = function() {
    const threshold = 0.5; // Adjust based on accelerometer sensitivity
    const totalAcceleration = Math.sqrt(
        Math.pow(this.accelerometer.x, 2) + 
        Math.pow(this.accelerometer.y, 2) + 
        Math.pow(this.accelerometer.z, 2)
    );
    
    this.motionDetected = totalAcceleration > threshold;
    this.motionIntensity = Math.min(totalAcceleration * 20, 100); // Scale to 0-100
    
    if (this.motionDetected) {
        // Determine motion direction based on accelerometer values
        if (Math.abs(this.accelerometer.x) > Math.abs(this.accelerometer.y)) {
            this.motionDirection = this.accelerometer.x > 0 ? 'east' : 'west';
        } else {
            this.motionDirection = this.accelerometer.y > 0 ? 'north' : 'south';
        }
    }
    return this.save();
};

// Static methods
sensorDataSchema.statics.getLatestReading = function() {
    return this.findOne().sort({ timestamp: -1 });
};

sensorDataSchema.statics.getSensorHistory = function(sensorType, hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ timestamp: { $gte: cutoffDate } }).sort({ timestamp: -1 });
};

sensorDataSchema.statics.getObstacleHistory = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ 
        obstacleDetected: true, 
        timestamp: { $gte: cutoffDate } 
    }).sort({ timestamp: -1 });
};

sensorDataSchema.statics.getMotionHistory = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ 
        motionDetected: true, 
        timestamp: { $gte: cutoffDate } 
    }).sort({ timestamp: -1 });
};

sensorDataSchema.statics.getSensorStats = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        {
            $group: {
                _id: null,
                avgIRLeft: { $avg: "$irSensors.left" },
                avgIRCenter: { $avg: "$irSensors.center" },
                avgIRRight: { $avg: "$irSensors.right" },
                avgUltrasonicDistance: { $avg: "$ultrasonicDistance" },
                avgTemperature: { $avg: "$temperature" },
                avgHumidity: { $avg: "$humidity" },
                avgLightLevel: { $avg: "$lightLevel" },
                avgAudioLevel: { $avg: "$audioLevel" },
                maxMotionIntensity: { $max: "$motionIntensity" },
                obstacleCount: { $sum: { $cond: ["$obstacleDetected", 1, 0] } },
                motionCount: { $sum: { $cond: ["$motionDetected", 1, 0] } },
                totalReadings: { $sum: 1 }
            }
        }
    ]);
};

sensorDataSchema.statics.getAnomalyReport = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        { $unwind: "$anomalies" },
        {
            $group: {
                _id: {
                    type: "$anomalies.type",
                    sensor: "$anomalies.sensor",
                    severity: "$anomalies.severity"
                },
                count: { $sum: 1 },
                avgDeviation: { $avg: "$anomalies.deviation" },
                maxDeviation: { $max: "$anomalies.deviation" }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// Pre-save middleware
sensorDataSchema.pre('save', function(next) {
    // Auto-detect obstacles and motion
    this.detectObstacle();
    this.detectMotion();
    
    // Update data quality
    this.updateDataQuality();
    
    next();
});

module.exports = mongoose.model('SensorData', sensorDataSchema);

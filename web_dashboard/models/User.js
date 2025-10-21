/**
 * Yahmi Security Rover - User Model
 * MongoDB schema for user authentication and management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // Basic user information
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    
    // Personal information
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    
    // User role and permissions
    role: {
        type: String,
        enum: ['admin', 'operator', 'viewer', 'guest'],
        default: 'viewer'
    },
    
    permissions: {
        systemControl: { type: Boolean, default: false },
        cameraControl: { type: Boolean, default: false },
        aiManagement: { type: Boolean, default: false },
        userManagement: { type: Boolean, default: false },
        systemSettings: { type: Boolean, default: false },
        dataExport: { type: Boolean, default: false },
        emergencyControl: { type: Boolean, default: false }
    },
    
    // User status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'pending'
    },
    
    // Authentication
    emailVerified: {
        type: Boolean,
        default: false
    },
    
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Security settings
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    
    twoFactorSecret: String,
    
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    
    // User preferences
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        },
        dashboard: {
            layout: { type: String, default: 'default' },
            widgets: [String],
            refreshInterval: { type: Number, default: 5000 }
        }
    },
    
    // User activity
    activity: {
        lastActive: Date,
        totalSessions: { type: Number, default: 0 },
        totalLoginTime: { type: Number, default: 0 }, // in minutes
        commandsExecuted: { type: Number, default: 0 },
        lastCommand: Date
    },
    
    // User profile
    profile: {
        avatar: String,
        bio: String,
        phone: String,
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        organization: String,
        department: String,
        position: String
    },
    
    // API access
    apiAccess: {
        enabled: { type: Boolean, default: false },
        apiKey: String,
        apiKeyExpires: Date,
        rateLimit: { type: Number, default: 1000 }, // requests per hour
        allowedIPs: [String]
    },
    
    // User sessions
    sessions: [{
        sessionId: String,
        ipAddress: String,
        userAgent: String,
        createdAt: { type: Date, default: Date.now },
        lastActivity: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    
    // Audit trail
    auditLog: [{
        action: String,
        description: String,
        ipAddress: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now }
    }],
    
    // User groups
    groups: [{
        groupId: String,
        groupName: String,
        role: String,
        joinedAt: { type: Date, default: Date.now }
    }],
    
    // Device access
    deviceAccess: [{
        deviceId: String,
        deviceType: String,
        permissions: [String],
        grantedAt: { type: Date, default: Date.now },
        expiresAt: Date
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'apiAccess.apiKey': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for is admin
userSchema.virtual('isAdmin').get(function() {
    return this.role === 'admin';
});

// Virtual for can control system
userSchema.virtual('canControlSystem').get(function() {
    return this.permissions.systemControl || this.role === 'admin';
});

// Virtual for session count
userSchema.virtual('activeSessionCount').get(function() {
    return this.sessions.filter(session => session.isActive).length;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    // Hash password if it's modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Update timestamps
    this.updatedAt = new Date();
    
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { 
            userId: this._id, 
            username: this.username, 
            role: this.role 
        },
        process.env.JWT_SECRET || 'yahmi_security_rover_secret',
        { expiresIn: '24h' }
    );
    return token;
};

userSchema.methods.generateApiKey = function() {
    const apiKey = jwt.sign(
        { 
            userId: this._id, 
            type: 'api_key' 
        },
        process.env.JWT_SECRET || 'yahmi_security_rover_secret',
        { expiresIn: '365d' }
    );
    this.apiAccess.apiKey = apiKey;
    this.apiAccess.apiKeyExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    return apiKey;
};

userSchema.methods.incrementLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

userSchema.methods.addSession = function(sessionId, ipAddress, userAgent) {
    this.sessions.push({
        sessionId,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true
    });
    return this.save();
};

userSchema.methods.removeSession = function(sessionId) {
    this.sessions = this.sessions.filter(session => session.sessionId !== sessionId);
    return this.save();
};

userSchema.methods.updateSessionActivity = function(sessionId) {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
        session.lastActivity = new Date();
    }
    return this.save();
};

userSchema.methods.addAuditLog = function(action, description, ipAddress, userAgent) {
    this.auditLog.push({
        action,
        description,
        ipAddress,
        userAgent,
        timestamp: new Date()
    });
    
    // Keep only last 100 audit log entries
    if (this.auditLog.length > 100) {
        this.auditLog = this.auditLog.slice(-100);
    }
    
    return this.save();
};

userSchema.methods.updateActivity = function() {
    this.activity.lastActive = new Date();
    return this.save();
};

userSchema.methods.incrementCommands = function() {
    this.activity.commandsExecuted += 1;
    this.activity.lastCommand = new Date();
    return this.save();
};

userSchema.methods.hasPermission = function(permission) {
    if (this.role === 'admin') return true;
    return this.permissions[permission] || false;
};

userSchema.methods.canAccessDevice = function(deviceId) {
    if (this.role === 'admin') return true;
    return this.deviceAccess.some(access => 
        access.deviceId === deviceId && 
        (!access.expiresAt || access.expiresAt > new Date())
    );
};

userSchema.methods.getDevicePermissions = function(deviceId) {
    const access = this.deviceAccess.find(a => a.deviceId === deviceId);
    return access ? access.permissions : [];
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByApiKey = function(apiKey) {
    return this.findOne({ 'apiAccess.apiKey': apiKey });
};

userSchema.statics.getActiveUsers = function() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.find({
        'activity.lastActive': { $gte: oneHourAgo },
        status: 'active'
    });
};

userSchema.statics.getUserStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
                operators: { $sum: { $cond: [{ $eq: ['$role', 'operator'] }, 1, 0] } },
                viewers: { $sum: { $cond: [{ $eq: ['$role', 'viewer'] }, 1, 0] } },
                verified: { $sum: { $cond: ['$emailVerified', 1, 0] } },
                twoFactorEnabled: { $sum: { $cond: ['$twoFactorEnabled', 1, 0] } }
            }
        }
    ]);
};

userSchema.statics.getUserActivity = function(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        { $match: { 'activity.lastActive': { $gte: cutoffDate } } },
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                avgSessions: { $avg: '$activity.totalSessions' },
                avgLoginTime: { $avg: '$activity.totalLoginTime' },
                totalCommands: { $sum: '$activity.commandsExecuted' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

userSchema.statics.cleanupInactiveUsers = function(days = 90) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.updateMany(
        {
            'activity.lastActive': { $lt: cutoffDate },
            status: { $ne: 'admin' }
        },
        { status: 'inactive' }
    );
};

userSchema.statics.cleanupExpiredSessions = function() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.updateMany(
        {},
        {
            $pull: {
                sessions: {
                    lastActivity: { $lt: oneDayAgo }
                }
            }
        }
    );
};

module.exports = mongoose.model('User', userSchema);

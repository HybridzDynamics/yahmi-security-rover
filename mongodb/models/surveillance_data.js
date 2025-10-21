// MongoDB Models for Surveillance Car System

const mongoose = require('mongoose');

// System Status Schema
const systemStatusSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  mode: { type: String, enum: ['manual', 'autonomous'], required: true },
  batteryLevel: { type: Number, min: 0, max: 100, required: true },
  batteryVoltage: { type: Number, required: true },
  obstacleDetected: { type: Boolean, default: false },
  isRunning: { type: Boolean, default: true },
  uptime: { type: Number, required: true },
  freeHeap: { type: Number, required: true },
  cpuFreq: { type: Number, required: true },
  wifiSSID: { type: String },
  ipAddress: { type: String },
  wifiSignal: { type: Number },
  storageUsage: { type: Number, min: 0, max: 100 },
  connectedClients: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  irSensors: {
    left: { type: Number, required: true },
    center: { type: Number, required: true },
    right: { type: Number, required: true }
  },
  ultrasonicDistance: { type: Number, required: true },
  batteryVoltage: { type: Number, required: true },
  batteryPercentage: { type: Number, min: 0, max: 100, required: true },
  leftMotorSpeed: { type: Number, min: -255, max: 255, default: 0 },
  rightMotorSpeed: { type: Number, min: -255, max: 255, default: 0 },
  motorDirection: { type: String, enum: ['forward', 'backward', 'left', 'right', 'stop'], default: 'stop' },
  obstacleDetected: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Video Capture Schema
const videoCaptureSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  duration: { type: Number }, // in seconds
  resolution: { type: String, default: '640x480' },
  quality: { type: Number, min: 0, max: 63, default: 12 },
  metadata: {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number },
    temperature: { type: Number },
    humidity: { type: Number }
  },
  tags: [{ type: String }],
  isProcessed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Audio Capture Schema
const audioCaptureSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  duration: { type: Number, required: true }, // in seconds
  sampleRate: { type: Number, default: 16000 },
  channels: { type: Number, default: 1 },
  bitDepth: { type: Number, default: 16 },
  audioType: { type: String, enum: ['capture', 'alert', 'siren', 'system'], default: 'capture' },
  metadata: {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number }
  },
  isProcessed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Control Command Schema
const controlCommandSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  command: { type: String, required: true },
  action: { type: String },
  value: { type: mongoose.Schema.Types.Mixed },
  source: { type: String, enum: ['web', 'mobile', 'api'], required: true },
  clientId: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
  executionTime: { type: Number } // in milliseconds
}, {
  timestamps: true
});

// System Event Schema
const systemEventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  eventType: { 
    type: String, 
    enum: ['startup', 'shutdown', 'error', 'warning', 'info', 'alert'], 
    required: true 
  },
  message: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  component: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: String }
}, {
  timestamps: true
});

// Configuration Schema
const configurationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], required: true },
  description: { type: String },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastModified: { type: Date, default: Date.now },
  modifiedBy: { type: String }
}, {
  timestamps: true
});

// User Session Schema
const userSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String },
  userAgent: { type: String },
  ipAddress: { type: String },
  connectedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  deviceType: { type: String, enum: ['web', 'mobile', 'api'] },
  permissions: [{ type: String }]
}, {
  timestamps: true
});

// Create indexes for better performance
systemStatusSchema.index({ timestamp: -1 });
systemStatusSchema.index({ mode: 1 });
systemStatusSchema.index({ batteryLevel: 1 });

sensorDataSchema.index({ timestamp: -1 });
sensorDataSchema.index({ obstacleDetected: 1 });

videoCaptureSchema.index({ timestamp: -1 });
videoCaptureSchema.index({ isProcessed: 1 });
videoCaptureSchema.index({ tags: 1 });

audioCaptureSchema.index({ timestamp: -1 });
audioCaptureSchema.index({ audioType: 1 });
audioCaptureSchema.index({ isProcessed: 1 });

controlCommandSchema.index({ timestamp: -1 });
controlCommandSchema.index({ command: 1 });
controlCommandSchema.index({ source: 1 });

systemEventSchema.index({ timestamp: -1 });
systemEventSchema.index({ eventType: 1 });
systemEventSchema.index({ severity: 1 });
systemEventSchema.index({ resolved: 1 });

configurationSchema.index({ name: 1 });
configurationSchema.index({ category: 1 });
configurationSchema.index({ isActive: 1 });

userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ isActive: 1 });
userSessionSchema.index({ lastActivity: -1 });

// Export models
module.exports = {
  SystemStatus: mongoose.model('SystemStatus', systemStatusSchema),
  SensorData: mongoose.model('SensorData', sensorDataSchema),
  VideoCapture: mongoose.model('VideoCapture', videoCaptureSchema),
  AudioCapture: mongoose.model('AudioCapture', audioCaptureSchema),
  ControlCommand: mongoose.model('ControlCommand', controlCommandSchema),
  SystemEvent: mongoose.model('SystemEvent', systemEventSchema),
  Configuration: mongoose.model('Configuration', configurationSchema),
  UserSession: mongoose.model('UserSession', userSessionSchema)
};

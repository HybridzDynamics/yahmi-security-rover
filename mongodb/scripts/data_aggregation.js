// MongoDB Data Aggregation Scripts for Surveillance Car System

const mongoose = require('mongoose');
const models = require('../models/surveillance_data');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mohammadarsh1986_db_user:ly4TFtz4pLN6fC1v@yahmi.dycfiig.mongodb.net/?retryWrites=true&w=majority&appName=yahmi');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Aggregate system status data by time periods
const getSystemStatusAggregation = async (startDate, endDate, groupBy = 'hour') => {
  const groupFormat = {
    'hour': '%Y-%m-%d %H:00:00',
    'day': '%Y-%m-%d',
    'week': '%Y-%U',
    'month': '%Y-%m'
  };

  return await models.SystemStatus.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupFormat[groupBy] || groupFormat.hour,
            date: '$timestamp'
          }
        },
        avgBatteryLevel: { $avg: '$batteryLevel' },
        avgBatteryVoltage: { $avg: '$batteryVoltage' },
        avgFreeHeap: { $avg: '$freeHeap' },
        avgWifiSignal: { $avg: '$wifiSignal' },
        avgStorageUsage: { $avg: '$storageUsage' },
        totalUptime: { $sum: '$uptime' },
        modeCounts: {
          $push: '$mode'
        },
        obstacleCount: {
          $sum: { $cond: ['$obstacleDetected', 1, 0] }
        },
        recordCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Aggregate sensor data for analysis
const getSensorDataAggregation = async (startDate, endDate) => {
  return await models.SensorData.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        avgUltrasonicDistance: { $avg: '$ultrasonicDistance' },
        minUltrasonicDistance: { $min: '$ultrasonicDistance' },
        maxUltrasonicDistance: { $max: '$ultrasonicDistance' },
        avgBatteryVoltage: { $avg: '$batteryVoltage' },
        avgLeftMotorSpeed: { $avg: '$leftMotorSpeed' },
        avgRightMotorSpeed: { $avg: '$rightMotorSpeed' },
        obstacleCount: {
          $sum: { $cond: ['$obstacleDetected', 1, 0] }
        },
        totalRecords: { $sum: 1 },
        directionCounts: {
          $push: '$motorDirection'
        }
      }
    }
  ]);
};

// Get video capture statistics
const getVideoCaptureStats = async (startDate, endDate) => {
  return await models.VideoCapture.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCaptures: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        avgFileSize: { $avg: '$fileSize' },
        avgDuration: { $avg: '$duration' },
        processedCount: {
          $sum: { $cond: ['$isProcessed', 1, 0] }
        },
        unprocessedCount: {
          $sum: { $cond: ['$isProcessed', 0, 1] }
        },
        qualityDistribution: {
          $push: '$quality'
        }
      }
    }
  ]);
};

// Get control command statistics
const getControlCommandStats = async (startDate, endDate) => {
  return await models.ControlCommand.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$command',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        errorCount: {
          $sum: { $cond: ['$success', 0, 1] }
        },
        avgExecutionTime: { $avg: '$executionTime' },
        sources: { $addToSet: '$source' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Get system events by severity
const getSystemEventsBySeverity = async (startDate, endDate) => {
  return await models.SystemEvent.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
        resolvedCount: {
          $sum: { $cond: ['$resolved', 1, 0] }
        },
        unresolvedCount: {
          $sum: { $cond: ['$resolved', 0, 1] }
        },
        events: {
          $push: {
            type: '$eventType',
            message: '$message',
            component: '$component',
            timestamp: '$timestamp',
            resolved: '$resolved'
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Get battery usage trends
const getBatteryUsageTrends = async (days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await models.SystemStatus.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        avgBatteryLevel: { $avg: '$batteryLevel' },
        minBatteryLevel: { $min: '$batteryLevel' },
        maxBatteryLevel: { $max: '$batteryLevel' },
        avgBatteryVoltage: { $avg: '$batteryVoltage' },
        recordCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Get obstacle detection patterns
const getObstacleDetectionPatterns = async (startDate, endDate) => {
  return await models.SensorData.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        obstacleDetected: true
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          dayOfWeek: { $dayOfWeek: '$timestamp' }
        },
        obstacleCount: { $sum: 1 },
        avgDistance: { $avg: '$ultrasonicDistance' },
        avgIrLeft: { $avg: '$irSensors.left' },
        avgIrCenter: { $avg: '$irSensors.center' },
        avgIrRight: { $avg: '$irSensors.right' }
      }
    },
    {
      $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 }
    }
  ]);
};

// Get user activity patterns
const getUserActivityPatterns = async (startDate, endDate) => {
  return await models.UserSession.aggregate([
    {
      $match: {
        connectedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$connectedAt' },
          deviceType: '$deviceType'
        },
        sessionCount: { $sum: 1 },
        avgSessionDuration: {
          $avg: {
            $subtract: ['$lastActivity', '$connectedAt']
          }
        },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { '_id.hour': 1 }
    }
  ]);
};

// Clean up old data
const cleanupOldData = async (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const collections = [
    'systemstatuses',
    'sensordatas',
    'videocaptures',
    'audiocaptures',
    'controlcommands',
    'systemevents',
    'usersessions'
  ];

  const results = {};

  for (const collection of collections) {
    try {
      const result = await mongoose.connection.db.collection(collection).deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      results[collection] = result.deletedCount;
    } catch (error) {
      console.error(`Error cleaning up ${collection}:`, error);
      results[collection] = 0;
    }
  }

  return results;
};

// Export functions
module.exports = {
  connectDB,
  getSystemStatusAggregation,
  getSensorDataAggregation,
  getVideoCaptureStats,
  getControlCommandStats,
  getSystemEventsBySeverity,
  getBatteryUsageTrends,
  getObstacleDetectionPatterns,
  getUserActivityPatterns,
  cleanupOldData
};

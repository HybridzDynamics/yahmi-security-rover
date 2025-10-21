/*
 * Ultrasonic Sensor Module - Header File
 * 
 * This module handles HC-SR04 ultrasonic sensor operations for distance measurement.
 * Provides accurate distance readings and obstacle detection capabilities.
 */

#ifndef ULTRASONIC_SENSOR_H
#define ULTRASONIC_SENSOR_H

#include <Arduino.h>

class UltrasonicSensor {
private:
  int triggerPin;
  int echoPin;
  float distance;
  bool obstacleDetected;
  unsigned long lastUpdate;
  int updateInterval;
  
  // Distance thresholds
  float obstacleThreshold;
  float maxDistance;
  
  // Filtering
  float lastReadings[5];
  int readingIndex;
  bool isStable;
  
public:
  // Constructor
  UltrasonicSensor();
  
  // Initialization
  void begin(int trigPin, int echoPin, float obstacleThresh = 20.0, float maxDist = 400.0);
  
  // Main update function - call in main loop
  void update();
  
  // Getters
  float getDistance() const;
  bool isObstacleDetected() const;
  bool isStable() const;
  float getMaxDistance() const;
  float getObstacleThreshold() const;
  
  // Configuration
  void setObstacleThreshold(float threshold);
  void setMaxDistance(float maxDist);
  
  // Utility functions
  float getFilteredDistance(); // Get filtered/averaged distance
  bool isValidReading(); // Check if reading is valid
  void resetFilter(); // Reset distance filter
  
private:
  // Internal functions
  float measureDistance();
  void updateFilter(float newReading);
  bool isReadingValid(float reading);
};

#endif // ULTRASONIC_SENSOR_H

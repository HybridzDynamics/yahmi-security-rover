/*
 * IR Sensor Module - Header File
 * 
 * This module handles IR sensor operations for obstacle detection.
 * Uses analog readings to detect obstacles and provides threshold-based detection.
 */

#ifndef IR_SENSOR_H
#define IR_SENSOR_H

#include <Arduino.h>

class IRSensor {
private:
  int pin;
  int threshold;
  bool obstacleDetected;
  int rawValue;
  unsigned long lastUpdate;
  int updateInterval;
  
  // Calibration values
  int minValue;
  int maxValue;
  bool isCalibrated;
  
public:
  // Constructor
  IRSensor();
  
  // Initialization
  void begin(int sensorPin, int obstacleThreshold = 500);
  
  // Main update function - call in main loop
  void update();
  
  // Getters
  bool isObstacleDetected() const;
  int getRawValue() const;
  int getThreshold() const;
  bool isCalibrated() const;
  
  // Configuration
  void setThreshold(int newThreshold);
  void calibrate();
  void resetCalibration();
  
  // Utility functions
  float getDistance(); // Estimated distance based on analog value
  bool isStable(); // Check if reading is stable
};

#endif // IR_SENSOR_H

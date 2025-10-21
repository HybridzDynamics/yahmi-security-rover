/*
 * IR Sensor Module - Implementation
 * 
 * This module handles IR sensor operations for obstacle detection.
 * Provides analog reading, threshold-based detection, and calibration.
 */

#include "ir_sensor.h"

IRSensor::IRSensor() {
  pin = -1;
  threshold = 500;
  obstacleDetected = false;
  rawValue = 0;
  lastUpdate = 0;
  updateInterval = 50; // Update every 50ms
  minValue = 4095;
  maxValue = 0;
  isCalibrated = false;
}

void IRSensor::begin(int sensorPin, int obstacleThreshold) {
  pin = sensorPin;
  threshold = obstacleThreshold;
  pinMode(pin, INPUT);
  
  Serial.print("IR Sensor initialized on pin ");
  Serial.println(pin);
  
  // Start calibration
  calibrate();
}

void IRSensor::update() {
  if (pin == -1) return;
  
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate < updateInterval) return;
  
  // Read analog value
  rawValue = analogRead(pin);
  
  // Update calibration values
  if (!isCalibrated) {
    if (rawValue < minValue) minValue = rawValue;
    if (rawValue > maxValue) maxValue = rawValue;
    
    // Auto-calibrate after 100 readings
    static int calibrationCount = 0;
    calibrationCount++;
    if (calibrationCount >= 100) {
      isCalibrated = true;
      Serial.print("IR Sensor auto-calibrated. Range: ");
      Serial.print(minValue);
      Serial.print(" - ");
      Serial.println(maxValue);
    }
  }
  
  // Detect obstacle based on threshold
  obstacleDetected = (rawValue > threshold);
  
  lastUpdate = currentTime;
}

bool IRSensor::isObstacleDetected() const {
  return obstacleDetected;
}

int IRSensor::getRawValue() const {
  return rawValue;
}

int IRSensor::getThreshold() const {
  return threshold;
}

bool IRSensor::isCalibrated() const {
  return isCalibrated;
}

void IRSensor::setThreshold(int newThreshold) {
  threshold = newThreshold;
  Serial.print("IR Sensor threshold set to: ");
  Serial.println(threshold);
}

void IRSensor::calibrate() {
  minValue = 4095;
  maxValue = 0;
  isCalibrated = false;
  
  Serial.println("IR Sensor calibration started...");
  Serial.println("Move sensor through full range of motion");
  
  // Take 200 readings for calibration
  for (int i = 0; i < 200; i++) {
    int value = analogRead(pin);
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;
    delay(10);
  }
  
  // Set threshold to 80% of range
  threshold = minValue + (maxValue - minValue) * 0.8;
  isCalibrated = true;
  
  Serial.print("IR Sensor calibrated. Range: ");
  Serial.print(minValue);
  Serial.print(" - ");
  Serial.print(maxValue);
  Serial.print(", Threshold: ");
  Serial.println(threshold);
}

void IRSensor::resetCalibration() {
  isCalibrated = false;
  minValue = 4095;
  maxValue = 0;
  threshold = 500; // Default threshold
}

float IRSensor::getDistance() {
  if (!isCalibrated || maxValue == minValue) return -1.0;
  
  // Convert analog value to distance estimate (0-100cm)
  float normalizedValue = (float)(rawValue - minValue) / (maxValue - minValue);
  float distance = 100.0 * (1.0 - normalizedValue);
  
  return constrain(distance, 0.0, 100.0);
}

bool IRSensor::isStable() {
  // Check if reading is stable (not fluctuating rapidly)
  static int lastValues[5] = {0};
  static int index = 0;
  
  lastValues[index] = rawValue;
  index = (index + 1) % 5;
  
  // Calculate variance
  int sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += lastValues[i];
  }
  float average = sum / 5.0;
  
  float variance = 0;
  for (int i = 0; i < 5; i++) {
    variance += pow(lastValues[i] - average, 2);
  }
  variance /= 5.0;
  
  return variance < 100; // Stable if variance is low
}

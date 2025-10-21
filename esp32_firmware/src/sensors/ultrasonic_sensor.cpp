/*
 * Ultrasonic Sensor Module - Implementation
 * 
 * This module handles HC-SR04 ultrasonic sensor operations for distance measurement.
 * Provides accurate distance readings with filtering and obstacle detection.
 */

#include "ultrasonic_sensor.h"

UltrasonicSensor::UltrasonicSensor() {
  triggerPin = -1;
  echoPin = -1;
  distance = 0.0;
  obstacleDetected = false;
  lastUpdate = 0;
  updateInterval = 100; // Update every 100ms
  obstacleThreshold = 20.0;
  maxDistance = 400.0;
  
  // Initialize filter
  for (int i = 0; i < 5; i++) {
    lastReadings[i] = 0.0;
  }
  readingIndex = 0;
  isStable = false;
}

void UltrasonicSensor::begin(int trigPin, int echoPin, float obstacleThresh, float maxDist) {
  triggerPin = trigPin;
  echoPin = echoPin;
  obstacleThreshold = obstacleThresh;
  maxDistance = maxDist;
  
  pinMode(triggerPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Initialize filter with current reading
  float initialReading = measureDistance();
  for (int i = 0; i < 5; i++) {
    lastReadings[i] = initialReading;
  }
  
  Serial.print("Ultrasonic sensor initialized on pins ");
  Serial.print(triggerPin);
  Serial.print(" (trigger), ");
  Serial.print(echoPin);
  Serial.println(" (echo)");
}

void UltrasonicSensor::update() {
  if (triggerPin == -1 || echoPin == -1) return;
  
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate < updateInterval) return;
  
  // Measure distance
  float newDistance = measureDistance();
  
  // Update filter if reading is valid
  if (isReadingValid(newDistance)) {
    updateFilter(newDistance);
    distance = getFilteredDistance();
    
    // Check for obstacle
    obstacleDetected = (distance < obstacleThreshold && distance > 0);
    
    // Check stability
    isStable = checkStability();
  }
  
  lastUpdate = currentTime;
}

float UltrasonicSensor::getDistance() const {
  return distance;
}

bool UltrasonicSensor::isObstacleDetected() const {
  return obstacleDetected;
}

bool UltrasonicSensor::isStable() const {
  return isStable;
}

float UltrasonicSensor::getMaxDistance() const {
  return maxDistance;
}

float UltrasonicSensor::getObstacleThreshold() const {
  return obstacleThreshold;
}

void UltrasonicSensor::setObstacleThreshold(float threshold) {
  obstacleThreshold = threshold;
  Serial.print("Ultrasonic obstacle threshold set to: ");
  Serial.print(threshold);
  Serial.println(" cm");
}

void UltrasonicSensor::setMaxDistance(float maxDist) {
  maxDistance = maxDist;
  Serial.print("Ultrasonic max distance set to: ");
  Serial.print(maxDist);
  Serial.println(" cm");
}

float UltrasonicSensor::getFilteredDistance() {
  float sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < 5; i++) {
    if (lastReadings[i] > 0) {
      sum += lastReadings[i];
      validReadings++;
    }
  }
  
  return (validReadings > 0) ? (sum / validReadings) : 0.0;
}

bool UltrasonicSensor::isValidReading() {
  return distance > 0 && distance <= maxDistance;
}

void UltrasonicSensor::resetFilter() {
  for (int i = 0; i < 5; i++) {
    lastReadings[i] = 0.0;
  }
  readingIndex = 0;
  isStable = false;
}

float UltrasonicSensor::measureDistance() {
  // Clear trigger pin
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  
  // Send 10us pulse
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);
  
  // Read echo pin
  unsigned long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return -1; // No echo received
  }
  
  // Calculate distance (speed of sound = 343 m/s = 0.0343 cm/us)
  // Distance = (duration * speed) / 2 (divide by 2 for round trip)
  float distance = (duration * 0.0343) / 2.0;
  
  return distance;
}

void UltrasonicSensor::updateFilter(float newReading) {
  lastReadings[readingIndex] = newReading;
  readingIndex = (readingIndex + 1) % 5;
}

bool UltrasonicSensor::isReadingValid(float reading) {
  return reading > 0 && reading <= maxDistance;
}

bool UltrasonicSensor::checkStability() {
  if (lastReadings[0] == 0) return false;
  
  float sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += lastReadings[i];
  }
  float average = sum / 5.0;
  
  float variance = 0;
  for (int i = 0; i < 5; i++) {
    variance += pow(lastReadings[i] - average, 2);
  }
  variance /= 5.0;
  
  return variance < 25; // Stable if variance is less than 25
}

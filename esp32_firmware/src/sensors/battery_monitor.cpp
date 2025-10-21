/*
 * Battery Monitor Module - Implementation
 * 
 * This module handles battery voltage monitoring and percentage calculation.
 * Provides accurate battery level reporting with filtering and calibration.
 */

#include "battery_monitor.h"

BatteryMonitor::BatteryMonitor() {
  pin = -1;
  voltage = 0.0;
  percentage = 0;
  lowBattery = false;
  lastUpdate = 0;
  updateInterval = 1000; // Update every 1 second
  
  // Default calibration values
  maxVoltage = 4.2;
  minVoltage = 3.0;
  voltageDivider = 2.0;
  adcResolution = 4095;
  referenceVoltage = 3.3;
  
  // Initialize filter
  for (int i = 0; i < 10; i++) {
    lastReadings[i] = 0.0;
  }
  readingIndex = 0;
}

void BatteryMonitor::begin(int batteryPin, float maxV, float minV, float divider) {
  pin = batteryPin;
  maxVoltage = maxV;
  minVoltage = minV;
  voltageDivider = divider;
  
  pinMode(pin, INPUT);
  
  // Initialize filter with current reading
  float initialVoltage = readVoltage();
  for (int i = 0; i < 10; i++) {
    lastReadings[i] = initialVoltage;
  }
  
  Serial.print("Battery monitor initialized on pin ");
  Serial.print(pin);
  Serial.print(" (Max: ");
  Serial.print(maxVoltage);
  Serial.print("V, Min: ");
  Serial.print(minVoltage);
  Serial.print("V, Divider: ");
  Serial.print(voltageDivider);
  Serial.println(")");
}

void BatteryMonitor::update() {
  if (pin == -1) return;
  
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate < updateInterval) return;
  
  // Read voltage
  float newVoltage = readVoltage();
  
  // Update filter if reading is valid
  if (isVoltageValid(newVoltage)) {
    updateFilter(newVoltage);
    voltage = getFilteredVoltage();
    
    // Calculate percentage
    percentage = calculatePercentage(voltage);
    
    // Check for low battery
    lowBattery = (percentage < 20);
  }
  
  lastUpdate = currentTime;
}

float BatteryMonitor::getVoltage() const {
  return voltage;
}

int BatteryMonitor::getPercentage() const {
  return percentage;
}

bool BatteryMonitor::isLowBattery() const {
  return lowBattery;
}

bool BatteryMonitor::isCriticalBattery() const {
  return percentage < 10;
}

void BatteryMonitor::setVoltageRange(float maxV, float minV) {
  maxVoltage = maxV;
  minVoltage = minV;
  Serial.print("Battery voltage range set to: ");
  Serial.print(minVoltage);
  Serial.print("V - ");
  Serial.print(maxVoltage);
  Serial.println("V");
}

void BatteryMonitor::setVoltageDivider(float divider) {
  voltageDivider = divider;
  Serial.print("Voltage divider ratio set to: ");
  Serial.println(divider);
}

void BatteryMonitor::calibrate() {
  Serial.println("Battery calibration started...");
  Serial.println("Connect fully charged battery and press any key");
  
  // Wait for user input (simplified - in real implementation, use button)
  delay(2000);
  
  float chargedVoltage = readVoltage();
  maxVoltage = chargedVoltage * voltageDivider;
  
  Serial.print("Calibrated max voltage: ");
  Serial.print(maxVoltage);
  Serial.println("V");
  
  // Reset filter with new calibration
  resetFilter();
}

float BatteryMonitor::getFilteredVoltage() {
  float sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < 10; i++) {
    if (lastReadings[i] > 0) {
      sum += lastReadings[i];
      validReadings++;
    }
  }
  
  return (validReadings > 0) ? (sum / validReadings) : 0.0;
}

void BatteryMonitor::resetFilter() {
  for (int i = 0; i < 10; i++) {
    lastReadings[i] = 0.0;
  }
  readingIndex = 0;
}

String BatteryMonitor::getBatteryStatus() {
  String status = "Battery: ";
  status += String(percentage);
  status += "% (";
  status += String(voltage, 2);
  status += "V)";
  
  if (isCriticalBattery()) {
    status += " - CRITICAL!";
  } else if (lowBattery) {
    status += " - LOW!";
  }
  
  return status;
}

float BatteryMonitor::readVoltage() {
  int adcValue = analogRead(pin);
  
  // Convert ADC value to voltage
  float adcVoltage = (adcValue * referenceVoltage) / adcResolution;
  
  // Apply voltage divider correction
  float batteryVoltage = adcVoltage * voltageDivider;
  
  return batteryVoltage;
}

int BatteryMonitor::calculatePercentage(float voltage) {
  if (voltage <= minVoltage) return 0;
  if (voltage >= maxVoltage) return 100;
  
  // Linear interpolation between min and max voltage
  float percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100.0;
  
  return constrain((int)percentage, 0, 100);
}

void BatteryMonitor::updateFilter(float newVoltage) {
  lastReadings[readingIndex] = newVoltage;
  readingIndex = (readingIndex + 1) % 10;
}

bool BatteryMonitor::isVoltageValid(float voltage) {
  // Check if voltage is within reasonable range
  return voltage > 0 && voltage < (maxVoltage * 1.2); // Allow 20% tolerance
}

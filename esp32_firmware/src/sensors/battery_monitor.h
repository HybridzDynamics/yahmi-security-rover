/*
 * Battery Monitor Module - Header File
 * 
 * This module handles battery voltage monitoring and percentage calculation.
 * Provides low battery warnings and accurate battery level reporting.
 */

#ifndef BATTERY_MONITOR_H
#define BATTERY_MONITOR_H

#include <Arduino.h>

class BatteryMonitor {
private:
  int pin;
  float voltage;
  int percentage;
  bool lowBattery;
  unsigned long lastUpdate;
  int updateInterval;
  
  // Calibration values
  float maxVoltage;      // Maximum battery voltage (4.2V for Li-Po)
  float minVoltage;      // Minimum battery voltage (3.0V for Li-Po)
  float voltageDivider;  // Voltage divider ratio (e.g., 2.0 for 1:2 divider)
  int adcResolution;     // ADC resolution (12-bit = 4095)
  float referenceVoltage; // ADC reference voltage (3.3V)
  
  // Filtering
  float lastReadings[10];
  int readingIndex;
  
public:
  // Constructor
  BatteryMonitor();
  
  // Initialization
  void begin(int batteryPin, float maxV = 4.2, float minV = 3.0, float divider = 2.0);
  
  // Main update function - call in main loop
  void update();
  
  // Getters
  float getVoltage() const;
  int getPercentage() const;
  bool isLowBattery() const;
  bool isCriticalBattery() const;
  
  // Configuration
  void setVoltageRange(float maxV, float minV);
  void setVoltageDivider(float divider);
  void calibrate();
  
  // Utility functions
  float getFilteredVoltage(); // Get filtered voltage reading
  void resetFilter(); // Reset voltage filter
  String getBatteryStatus(); // Get formatted battery status string
  
private:
  // Internal functions
  float readVoltage();
  int calculatePercentage(float voltage);
  void updateFilter(float newVoltage);
  bool isVoltageValid(float voltage);
};

#endif // BATTERY_MONITOR_H

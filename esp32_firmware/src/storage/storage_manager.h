/*
 * Storage Manager Module - Header File
 * 
 * This module handles local storage using SD card and SPIFFS.
 * Provides file management, data logging, and storage operations.
 */

#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include <Arduino.h>
#include <SD.h>
#include <SPIFFS.h>

class StorageManager {
private:
  // Storage configuration
  int sdCSPin;
  bool sdAvailable;
  bool spiffsAvailable;
  
  // File paths
  String dataPath;
  String imagePath;
  String audioPath;
  String logPath;
  
  // Logging
  bool loggingEnabled;
  String currentLogFile;
  unsigned long lastLogTime;
  int logInterval;
  
  // Storage statistics
  unsigned long totalSpace;
  unsigned long usedSpace;
  unsigned long freeSpace;
  
public:
  // Constructor
  StorageManager();
  
  // Initialization
  bool begin(int csPin);
  void end();
  
  // Storage status
  bool isSDAvailable() const;
  bool isSPIFFSAvailable() const;
  bool isStorageAvailable() const;
  
  // File operations
  bool writeFile(String filename, String content);
  bool writeFile(String filename, uint8_t* data, size_t length);
  String readFile(String filename);
  bool deleteFile(String filename);
  bool fileExists(String filename);
  size_t getFileSize(String filename);
  
  // Directory operations
  bool createDirectory(String path);
  bool deleteDirectory(String path);
  bool directoryExists(String path);
  
  // Data logging
  void enableLogging(bool enable, int intervalMs = 1000);
  void logData(String data);
  void logSensorData(float* values, int count);
  void logSystemEvent(String event);
  
  // Storage management
  void updateStorageInfo();
  unsigned long getTotalSpace() const;
  unsigned long getUsedSpace() const;
  unsigned long getFreeSpace() const;
  float getUsagePercentage() const;
  
  // Utility functions
  String generateFilename(String prefix, String extension);
  String getTimestamp();
  void cleanupOldFiles(int maxAgeDays = 7);
  String getStatus();
  
private:
  // Internal functions
  bool initializeSD();
  bool initializeSPIFFS();
  String getStoragePath(String filename);
  bool writeToSD(String filename, String content);
  bool writeToSPIFFS(String filename, String content);
  String readFromSD(String filename);
  String readFromSPIFFS(String filename);
  void updateLogFile();
};

// Storage types
enum StorageType {
  STORAGE_SD = 0,
  STORAGE_SPIFFS = 1,
  STORAGE_AUTO = 2
};

// File types
enum FileType {
  FILE_IMAGE = 0,
  FILE_AUDIO = 1,
  FILE_LOG = 2,
  FILE_DATA = 3
};

#endif // STORAGE_MANAGER_H

/*
 * Storage Manager Module - Implementation
 * 
 * This module handles local storage using SD card and SPIFFS.
 * Provides file management, data logging, and storage operations.
 */

#include "storage_manager.h"

StorageManager::StorageManager() {
  sdCSPin = -1;
  sdAvailable = false;
  spiffsAvailable = false;
  dataPath = "/data/";
  imagePath = "/images/";
  audioPath = "/audio/";
  logPath = "/logs/";
  loggingEnabled = false;
  currentLogFile = "";
  lastLogTime = 0;
  logInterval = 1000;
  totalSpace = 0;
  usedSpace = 0;
  freeSpace = 0;
}

bool StorageManager::begin(int csPin) {
  sdCSPin = csPin;
  
  // Initialize SPIFFS first (built-in flash storage)
  spiffsAvailable = initializeSPIFFS();
  
  // Initialize SD card
  sdAvailable = initializeSD();
  
  if (spiffsAvailable) {
    Serial.println("SPIFFS initialized successfully");
  }
  
  if (sdAvailable) {
    Serial.println("SD card initialized successfully");
  }
  
  if (!spiffsAvailable && !sdAvailable) {
    Serial.println("No storage available");
    return false;
  }
  
  // Create necessary directories
  createDirectory(dataPath);
  createDirectory(imagePath);
  createDirectory(audioPath);
  createDirectory(logPath);
  
  // Update storage information
  updateStorageInfo();
  
  Serial.println("Storage manager initialized");
  return true;
}

void StorageManager::end() {
  if (sdAvailable) {
    SD.end();
    sdAvailable = false;
  }
  
  if (spiffsAvailable) {
    SPIFFS.end();
    spiffsAvailable = false;
  }
  
  Serial.println("Storage manager deinitialized");
}

bool StorageManager::isSDAvailable() const {
  return sdAvailable;
}

bool StorageManager::isSPIFFSAvailable() const {
  return spiffsAvailable;
}

bool StorageManager::isStorageAvailable() const {
  return sdAvailable || spiffsAvailable;
}

bool StorageManager::writeFile(String filename, String content) {
  if (!isStorageAvailable()) {
    Serial.println("No storage available");
    return false;
  }
  
  // Try SD card first, then SPIFFS
  if (sdAvailable) {
    return writeToSD(filename, content);
  } else if (spiffsAvailable) {
    return writeToSPIFFS(filename, content);
  }
  
  return false;
}

bool StorageManager::writeFile(String filename, uint8_t* data, size_t length) {
  if (!isStorageAvailable()) {
    Serial.println("No storage available");
    return false;
  }
  
  String fullPath = getStoragePath(filename);
  
  if (sdAvailable) {
    File file = SD.open(fullPath, FILE_WRITE);
    if (file) {
      size_t written = file.write(data, length);
      file.close();
      return written == length;
    }
  } else if (spiffsAvailable) {
    File file = SPIFFS.open(fullPath, "w");
    if (file) {
      size_t written = file.write(data, length);
      file.close();
      return written == length;
    }
  }
  
  return false;
}

String StorageManager::readFile(String filename) {
  if (!isStorageAvailable()) {
    return "";
  }
  
  if (sdAvailable) {
    return readFromSD(filename);
  } else if (spiffsAvailable) {
    return readFromSPIFFS(filename);
  }
  
  return "";
}

bool StorageManager::deleteFile(String filename) {
  if (!isStorageAvailable()) {
    return false;
  }
  
  String fullPath = getStoragePath(filename);
  
  if (sdAvailable) {
    return SD.remove(fullPath);
  } else if (spiffsAvailable) {
    return SPIFFS.remove(fullPath);
  }
  
  return false;
}

bool StorageManager::fileExists(String filename) {
  if (!isStorageAvailable()) {
    return false;
  }
  
  String fullPath = getStoragePath(filename);
  
  if (sdAvailable) {
    return SD.exists(fullPath);
  } else if (spiffsAvailable) {
    return SPIFFS.exists(fullPath);
  }
  
  return false;
}

size_t StorageManager::getFileSize(String filename) {
  if (!isStorageAvailable()) {
    return 0;
  }
  
  String fullPath = getStoragePath(filename);
  
  if (sdAvailable) {
    File file = SD.open(fullPath, FILE_READ);
    if (file) {
      size_t size = file.size();
      file.close();
      return size;
    }
  } else if (spiffsAvailable) {
    File file = SPIFFS.open(fullPath, "r");
    if (file) {
      size_t size = file.size();
      file.close();
      return size;
    }
  }
  
  return 0;
}

bool StorageManager::createDirectory(String path) {
  if (!isStorageAvailable()) {
    return false;
  }
  
  if (sdAvailable) {
    return SD.mkdir(path);
  } else if (spiffsAvailable) {
    // SPIFFS doesn't support directories, but we can create empty files as markers
    String markerFile = path + ".dir";
    File file = SPIFFS.open(markerFile, "w");
    if (file) {
      file.close();
      return true;
    }
  }
  
  return false;
}

bool StorageManager::deleteDirectory(String path) {
  if (!isStorageAvailable()) {
    return false;
  }
  
  if (sdAvailable) {
    return SD.rmdir(path);
  } else if (spiffsAvailable) {
    // SPIFFS doesn't support directories, but we can remove the marker file
    String markerFile = path + ".dir";
    return SPIFFS.remove(markerFile);
  }
  
  return false;
}

bool StorageManager::directoryExists(String path) {
  if (!isStorageAvailable()) {
    return false;
  }
  
  if (sdAvailable) {
    return SD.exists(path);
  } else if (spiffsAvailable) {
    String markerFile = path + ".dir";
    return SPIFFS.exists(markerFile);
  }
  
  return false;
}

void StorageManager::enableLogging(bool enable, int intervalMs) {
  loggingEnabled = enable;
  logInterval = intervalMs;
  
  if (enable) {
    currentLogFile = generateFilename("log", "txt");
    Serial.print("Logging enabled - file: ");
    Serial.println(currentLogFile);
  } else {
    currentLogFile = "";
    Serial.println("Logging disabled");
  }
}

void StorageManager::logData(String data) {
  if (!loggingEnabled) return;
  
  String timestamp = getTimestamp();
  String logEntry = timestamp + ": " + data + "\n";
  
  writeFile(currentLogFile, logEntry);
  lastLogTime = millis();
}

void StorageManager::logSensorData(float* values, int count) {
  if (!loggingEnabled) return;
  
  String data = "Sensors: ";
  for (int i = 0; i < count; i++) {
    data += String(values[i], 2);
    if (i < count - 1) data += ", ";
  }
  
  logData(data);
}

void StorageManager::logSystemEvent(String event) {
  if (!loggingEnabled) return;
  
  String data = "EVENT: " + event;
  logData(data);
}

void StorageManager::updateStorageInfo() {
  if (sdAvailable) {
    totalSpace = SD.totalBytes();
    usedSpace = SD.usedBytes();
    freeSpace = totalSpace - usedSpace;
  } else if (spiffsAvailable) {
    totalSpace = SPIFFS.totalBytes();
    usedSpace = SPIFFS.usedBytes();
    freeSpace = totalSpace - usedSpace;
  }
}

unsigned long StorageManager::getTotalSpace() const {
  return totalSpace;
}

unsigned long StorageManager::getUsedSpace() const {
  return usedSpace;
}

unsigned long StorageManager::getFreeSpace() const {
  return freeSpace;
}

float StorageManager::getUsagePercentage() const {
  if (totalSpace == 0) return 0.0;
  return (float)usedSpace / totalSpace * 100.0;
}

String StorageManager::generateFilename(String prefix, String extension) {
  String filename = prefix + "_" + String(millis()) + "." + extension;
  return filename;
}

String StorageManager::getTimestamp() {
  unsigned long time = millis();
  unsigned long seconds = time / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;
  
  String timestamp = String(hours) + ":" + 
                   String(minutes) + ":" + 
                   String(seconds);
  
  return timestamp;
}

void StorageManager::cleanupOldFiles(int maxAgeDays) {
  // This would implement file cleanup based on age
  // For now, just log the action
  logData("Cleanup: Removing files older than " + String(maxAgeDays) + " days");
}

String StorageManager::getStatus() {
  String status = "Storage: ";
  status += sdAvailable ? "SD" : "SPIFFS";
  status += " (";
  status += String(getUsagePercentage(), 1);
  status += "% used)";
  
  return status;
}

bool StorageManager::initializeSD() {
  if (sdCSPin == -1) return false;
  
  if (!SD.begin(sdCSPin)) {
    Serial.println("SD card initialization failed");
    return false;
  }
  
  return true;
}

bool StorageManager::initializeSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS initialization failed");
    return false;
  }
  
  return true;
}

String StorageManager::getStoragePath(String filename) {
  // Determine appropriate path based on file type
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
    return imagePath + filename;
  } else if (filename.endsWith(".wav") || filename.endsWith(".mp3")) {
    return audioPath + filename;
  } else if (filename.endsWith(".log") || filename.endsWith(".txt")) {
    return logPath + filename;
  } else {
    return dataPath + filename;
  }
}

bool StorageManager::writeToSD(String filename, String content) {
  String fullPath = getStoragePath(filename);
  File file = SD.open(fullPath, FILE_WRITE);
  if (file) {
    size_t written = file.print(content);
    file.close();
    return written == content.length();
  }
  return false;
}

bool StorageManager::writeToSPIFFS(String filename, String content) {
  String fullPath = getStoragePath(filename);
  File file = SPIFFS.open(fullPath, "w");
  if (file) {
    size_t written = file.print(content);
    file.close();
    return written == content.length();
  }
  return false;
}

String StorageManager::readFromSD(String filename) {
  String fullPath = getStoragePath(filename);
  File file = SD.open(fullPath, FILE_READ);
  if (file) {
    String content = file.readString();
    file.close();
    return content;
  }
  return "";
}

String StorageManager::readFromSPIFFS(String filename) {
  String fullPath = getStoragePath(filename);
  File file = SPIFFS.open(fullPath, "r");
  if (file) {
    String content = file.readString();
    file.close();
    return content;
  }
  return "";
}

void StorageManager::updateLogFile() {
  if (!loggingEnabled) return;
  
  if (millis() - lastLogTime >= logInterval) {
    // Create new log file if needed
    if (currentLogFile == "") {
      currentLogFile = generateFilename("log", "txt");
    }
  }
}

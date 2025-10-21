/*
 * WiFi Manager Module - Header File
 * 
 * This module handles WiFi connection management and network operations.
 * Provides connection status, IP address management, and network utilities.
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>

class WiFiManager {
private:
  // Connection state
  bool isConnected;
  String ssid;
  String password;
  IPAddress localIP;
  IPAddress gateway;
  IPAddress subnet;
  IPAddress dns;
  
  // Connection management
  unsigned long lastConnectionAttempt;
  int connectionTimeout;
  int maxRetries;
  int retryCount;
  
  // Network monitoring
  unsigned long lastStatusCheck;
  int statusCheckInterval;
  int signalStrength;
  int connectionQuality;
  
  // Access Point mode
  bool apMode;
  String apSSID;
  String apPassword;
  IPAddress apIP;
  
public:
  // Constructor
  WiFiManager();
  
  // Initialization
  bool begin(String ssid, String password);
  bool beginAP(String apSSID, String apPassword = "");
  void end();
  
  // Connection management
  bool connect();
  void disconnect();
  bool reconnect();
  bool isConnected() const;
  
  // Network information
  String getSSID() const;
  IPAddress getLocalIP() const;
  IPAddress getGateway() const;
  IPAddress getSubnet() const;
  IPAddress getDNS() const;
  int getSignalStrength() const;
  int getConnectionQuality() const;
  
  // Network operations
  bool ping(String host, int timeout = 5000);
  bool isInternetAvailable();
  String getMACAddress();
  String getHostname();
  
  // Access Point operations
  bool isAPMode() const;
  String getAPSSID() const;
  IPAddress getAPIP() const;
  int getConnectedClients() const;
  
  // Utility functions
  void update(); // Call in main loop
  String getStatus();
  void setConnectionTimeout(int timeout);
  void setMaxRetries(int retries);
  void setStatusCheckInterval(int interval);
  
private:
  // Internal functions
  bool attemptConnection();
  void updateConnectionStatus();
  void updateSignalStrength();
  int calculateConnectionQuality();
  void handleConnectionFailure();
  void handleConnectionSuccess();
};

// Connection quality levels
enum ConnectionQuality {
  QUALITY_EXCELLENT = 0,
  QUALITY_GOOD = 1,
  QUALITY_FAIR = 2,
  QUALITY_POOR = 3,
  QUALITY_VERY_POOR = 4
};

#endif // WIFI_MANAGER_H

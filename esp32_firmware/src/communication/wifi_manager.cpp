/*
 * WiFi Manager Module - Implementation
 * 
 * This module handles WiFi connection management and network operations.
 * Provides connection status, IP address management, and network utilities.
 */

#include "wifi_manager.h"

WiFiManager::WiFiManager() {
  isConnected = false;
  ssid = "";
  password = "";
  localIP = IPAddress(0, 0, 0, 0);
  gateway = IPAddress(0, 0, 0, 0);
  subnet = IPAddress(0, 0, 0, 0);
  dns = IPAddress(0, 0, 0, 0);
  lastConnectionAttempt = 0;
  connectionTimeout = 10000; // 10 seconds
  maxRetries = 5;
  retryCount = 0;
  lastStatusCheck = 0;
  statusCheckInterval = 5000; // 5 seconds
  signalStrength = 0;
  connectionQuality = QUALITY_VERY_POOR;
  apMode = false;
  apSSID = "SurveillanceCar";
  apPassword = "12345678";
  apIP = IPAddress(192, 168, 4, 1);
}

bool WiFiManager::begin(String ssid, String password) {
  this->ssid = ssid;
  this->password = password;
  apMode = false;
  
  // Set WiFi mode to station
  WiFi.mode(WIFI_STA);
  
  // Set hostname
  WiFi.setHostname("SurveillanceCar");
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  return connect();
}

bool WiFiManager::beginAP(String apSSID, String apPassword) {
  this->apSSID = apSSID;
  this->apPassword = apPassword;
  apMode = true;
  
  // Set WiFi mode to access point
  WiFi.mode(WIFI_AP);
  
  // Configure access point
  if (apPassword.length() >= 8) {
    WiFi.softAP(apSSID.c_str(), apPassword.c_str());
  } else {
    WiFi.softAP(apSSID.c_str());
  }
  
  // Configure IP address
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  
  isConnected = true;
  localIP = apIP;
  
  Serial.print("Access Point started: ");
  Serial.print(apSSID);
  Serial.print(" (IP: ");
  Serial.print(apIP);
  Serial.println(")");
  
  return true;
}

void WiFiManager::end() {
  if (apMode) {
    WiFi.softAPdisconnect(true);
  } else {
    WiFi.disconnect();
  }
  
  isConnected = false;
  Serial.println("WiFi disconnected");
}

bool WiFiManager::connect() {
  if (apMode) {
    return true; // Already connected in AP mode
  }
  
  if (ssid.length() == 0) {
    Serial.println("No SSID configured");
    return false;
  }
  
  // Check if already connected
  if (WiFi.status() == WL_CONNECTED) {
    isConnected = true;
    localIP = WiFi.localIP();
    gateway = WiFi.gatewayIP();
    subnet = WiFi.subnetMask();
    dns = WiFi.dnsIP();
    return true;
  }
  
  // Attempt connection
  return attemptConnection();
}

void WiFiManager::disconnect() {
  WiFi.disconnect();
  isConnected = false;
  localIP = IPAddress(0, 0, 0, 0);
  Serial.println("WiFi disconnected");
}

bool WiFiManager::reconnect() {
  if (apMode) {
    return true;
  }
  
  disconnect();
  delay(1000);
  return connect();
}

bool WiFiManager::isConnected() const {
  return isConnected;
}

String WiFiManager::getSSID() const {
  return ssid;
}

IPAddress WiFiManager::getLocalIP() const {
  return localIP;
}

IPAddress WiFiManager::getGateway() const {
  return gateway;
}

IPAddress WiFiManager::getSubnet() const {
  return subnet;
}

IPAddress WiFiManager::getDNS() const {
  return dns;
}

int WiFiManager::getSignalStrength() const {
  return signalStrength;
}

int WiFiManager::getConnectionQuality() const {
  return connectionQuality;
}

bool WiFiManager::ping(String host, int timeout) {
  if (!isConnected) return false;
  
  // Simple ping implementation using HTTP request
  HTTPClient http;
  http.begin("http://" + host);
  http.setTimeout(timeout);
  
  int responseCode = http.GET();
  http.end();
  
  return responseCode > 0;
}

bool WiFiManager::isInternetAvailable() {
  return ping("google.com", 5000);
}

String WiFiManager::getMACAddress() {
  return WiFi.macAddress();
}

String WiFiManager::getHostname() {
  return WiFi.getHostname();
}

bool WiFiManager::isAPMode() const {
  return apMode;
}

String WiFiManager::getAPSSID() const {
  return apSSID;
}

IPAddress WiFiManager::getAPIP() const {
  return apIP;
}

int WiFiManager::getConnectedClients() const {
  if (!apMode) return 0;
  return WiFi.softAPgetStationNum();
}

void WiFiManager::update() {
  if (apMode) {
    // Update AP status
    isConnected = true;
    localIP = apIP;
  } else {
    // Update connection status
    updateConnectionStatus();
    
    // Check signal strength periodically
    if (millis() - lastStatusCheck >= statusCheckInterval) {
      updateSignalStrength();
      lastStatusCheck = millis();
    }
    
    // Handle connection failures
    if (!isConnected && WiFi.status() != WL_CONNECTED) {
      handleConnectionFailure();
    }
  }
}

String WiFiManager::getStatus() {
  String status = "WiFi: ";
  status += apMode ? "AP Mode" : "Station Mode";
  status += " (";
  status += isConnected ? "Connected" : "Disconnected";
  status += ")";
  
  if (isConnected) {
    status += " - IP: ";
    status += localIP.toString();
    status += " (Signal: ";
    status += signalStrength;
    status += "dBm)";
  }
  
  return status;
}

void WiFiManager::setConnectionTimeout(int timeout) {
  connectionTimeout = timeout;
  Serial.print("Connection timeout set to: ");
  Serial.print(timeout);
  Serial.println(" ms");
}

void WiFiManager::setMaxRetries(int retries) {
  maxRetries = retries;
  Serial.print("Max retries set to: ");
  Serial.println(retries);
}

void WiFiManager::setStatusCheckInterval(int interval) {
  statusCheckInterval = interval;
  Serial.print("Status check interval set to: ");
  Serial.print(interval);
  Serial.println(" ms");
}

bool WiFiManager::attemptConnection() {
  if (millis() - lastConnectionAttempt < connectionTimeout) {
    return false; // Still attempting
  }
  
  lastConnectionAttempt = millis();
  
  if (retryCount >= maxRetries) {
    Serial.println("Max retries reached, giving up");
    return false;
  }
  
  retryCount++;
  Serial.print("Connection attempt ");
  Serial.print(retryCount);
  Serial.print("/");
  Serial.println(maxRetries);
  
  // Start connection
  WiFi.begin(ssid.c_str(), password.c_str());
  
  // Wait for connection
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < connectionTimeout) {
    delay(100);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    handleConnectionSuccess();
    return true;
  } else {
    handleConnectionFailure();
    return false;
  }
}

void WiFiManager::updateConnectionStatus() {
  bool wasConnected = isConnected;
  isConnected = (WiFi.status() == WL_CONNECTED);
  
  if (isConnected && !wasConnected) {
    // Just connected
    handleConnectionSuccess();
  } else if (!isConnected && wasConnected) {
    // Just disconnected
    Serial.println("WiFi connection lost");
  }
}

void WiFiManager::updateSignalStrength() {
  if (isConnected) {
    signalStrength = WiFi.RSSI();
    connectionQuality = calculateConnectionQuality();
  } else {
    signalStrength = 0;
    connectionQuality = QUALITY_VERY_POOR;
  }
}

int WiFiManager::calculateConnectionQuality() {
  if (signalStrength >= -30) return QUALITY_EXCELLENT;
  if (signalStrength >= -50) return QUALITY_GOOD;
  if (signalStrength >= -70) return QUALITY_FAIR;
  if (signalStrength >= -80) return QUALITY_POOR;
  return QUALITY_VERY_POOR;
}

void WiFiManager::handleConnectionFailure() {
  if (retryCount < maxRetries) {
    Serial.println("Connection failed, retrying...");
    delay(1000);
    attemptConnection();
  } else {
    Serial.println("Connection failed after max retries");
  }
}

void WiFiManager::handleConnectionSuccess() {
  isConnected = true;
  localIP = WiFi.localIP();
  gateway = WiFi.gatewayIP();
  subnet = WiFi.subnetMask();
  dns = WiFi.dnsIP();
  retryCount = 0;
  
  Serial.print("WiFi connected! IP address: ");
  Serial.println(localIP);
  Serial.print("Signal strength: ");
  Serial.print(signalStrength);
  Serial.println(" dBm");
}

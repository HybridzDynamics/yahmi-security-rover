/*
 * REST API Module - Implementation
 * 
 * This module handles HTTP REST API endpoints for system control and data retrieval.
 * Provides RESTful interface for web dashboard and mobile app communication.
 */

#include "rest_api.h"

RESTApi::RESTApi() {
  server = nullptr;
  port = 80;
  isRunning = false;
  endpointCount = 0;
  currentResponse = "";
  responseCode = 200;
  contentType = "application/json";
  currentPath = "";
  currentMethod = HTTP_GET;
  queryString = "";
  totalRequests = 0;
  totalBytes = 0;
  errorCount = 0;
}

void RESTApi::begin(int port) {
  this->port = port;
  
  if (server != nullptr) {
    delete server;
  }
  
  server = new WebServer(port);
  
  // Setup default endpoints
  setupDefaultEndpoints();
  
  // Setup CORS and error handling
  server->onNotFound([this]() { this->handleNotFound(); });
  
  Serial.print("REST API initialized on port ");
  Serial.println(port);
}

void RESTApi::end() {
  if (server != nullptr) {
    server->stop();
    delete server;
    server = nullptr;
  }
  
  isRunning = false;
  Serial.println("REST API stopped");
}

void RESTApi::start() {
  if (server == nullptr) {
    Serial.println("REST API not initialized");
    return;
  }
  
  server->begin();
  isRunning = true;
  
  Serial.print("REST API server started on port ");
  Serial.println(port);
}

void RESTApi::stop() {
  if (server != nullptr) {
    server->stop();
  }
  
  isRunning = false;
  Serial.println("REST API server stopped");
}

bool RESTApi::isRunning() const {
  return isRunning;
}

void RESTApi::addEndpoint(String path, HTTPMethod method, RequestHandler handler) {
  if (endpointCount >= 20) {
    Serial.println("Too many endpoints, cannot add more");
    return;
  }
  
  endpoints[endpointCount].path = path;
  endpoints[endpointCount].method = method;
  endpoints[endpointCount].handler = handler;
  endpointCount++;
  
  Serial.print("Endpoint added: ");
  Serial.print(getMethodString(method));
  Serial.print(" ");
  Serial.println(path);
}

void RESTApi::addGET(String path, RequestHandler handler) {
  addEndpoint(path, HTTP_GET, handler);
}

void RESTApi::addPOST(String path, RequestHandler handler) {
  addEndpoint(path, HTTP_POST, handler);
}

void RESTApi::addPUT(String path, RequestHandler handler) {
  addEndpoint(path, HTTP_PUT, handler);
}

void RESTApi::addDELETE(String path, RequestHandler handler) {
  addEndpoint(path, HTTP_DELETE, handler);
}

void RESTApi::handleRequests() {
  if (!isRunning || server == nullptr) return;
  
  server->handleClient();
}

void RESTApi::handleNotFound() {
  String message = "{\"error\":\"Not Found\",\"message\":\"The requested resource was not found\"}";
  sendResponse(message, NOT_FOUND);
  errorCount++;
}

void RESTApi::handleCORS() {
  server->sendHeader("Access-Control-Allow-Origin", "*");
  server->sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  server->sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  server->send(200, "text/plain", "");
}

void RESTApi::sendResponse(String response, int code, String contentType) {
  if (server == nullptr) return;
  
  currentResponse = response;
  responseCode = code;
  this->contentType = contentType;
  
  // Handle CORS
  server->sendHeader("Access-Control-Allow-Origin", "*");
  server->sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  server->sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  server->send(code, contentType, response);
  
  // Update statistics
  totalRequests++;
  totalBytes += response.length();
  
  // Log request
  logRequest(currentPath, currentMethod, code);
}

void RESTApi::sendError(String message, int code) {
  DynamicJsonDocument doc(512);
  doc["error"] = true;
  doc["message"] = message;
  doc["code"] = code;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  sendResponse(response, code);
}

void RESTApi::sendSuccess(String message) {
  DynamicJsonDocument doc(512);
  doc["success"] = true;
  doc["message"] = message;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  sendResponse(response, OK);
}

void RESTApi::sendJSON(JsonDocument& doc, int code) {
  String response;
  serializeJson(doc, response);
  sendResponse(response, code);
}

String RESTApi::getParameter(String name) {
  if (server == nullptr) return "";
  return server->arg(name);
}

String RESTApi::getHeader(String name) {
  if (server == nullptr) return "";
  return server->header(name);
}

String RESTApi::getBody() {
  if (server == nullptr) return "";
  return server->arg("plain");
}

bool RESTApi::hasParameter(String name) {
  if (server == nullptr) return false;
  return server->hasArg(name);
}

bool RESTApi::hasHeader(String name) {
  if (server == nullptr) return false;
  return server->hasHeader(name);
}

void RESTApi::update() {
  handleRequests();
}

String RESTApi::getStatus() {
  String status = "REST API: ";
  status += isRunning ? "Running" : "Stopped";
  status += " (Requests: ";
  status += totalRequests;
  status += ", Errors: ";
  status += errorCount;
  status += ")";
  
  return status;
}

void RESTApi::enableCORS(bool enable) {
  // CORS is always enabled in this implementation
  Serial.print("CORS ");
  Serial.println(enable ? "enabled" : "disabled");
}

void RESTApi::setupDefaultEndpoints() {
  // Root endpoint
  addGET("/", [this]() { this->handleRoot(); });
  
  // System status
  addGET("/api/status", [this]() { this->handleStatus(); });
  
  // Control endpoints
  addPOST("/api/control", [this]() { this->handleControl(); });
  addGET("/api/control", [this]() { this->handleControl(); });
  
  // Configuration
  addGET("/api/config", [this]() { this->handleConfig(); });
  addPOST("/api/config", [this]() { this->handleConfig(); });
  
  // Data endpoints
  addGET("/api/data", [this]() { this->handleData(); });
  addGET("/api/data/sensors", [this]() { this->handleData(); });
  addGET("/api/data/battery", [this]() { this->handleData(); });
  
  // Media endpoints
  addGET("/api/video", [this]() { this->handleVideo(); });
  addGET("/api/audio", [this]() { this->handleAudio(); });
  
  // Storage endpoints
  addGET("/api/storage", [this]() { this->handleStorage(); });
  addGET("/api/logs", [this]() { this->handleLogs(); });
  
  // System endpoints
  addGET("/api/system", [this]() { this->handleSystem(); });
  addPOST("/api/system/restart", [this]() { this->handleSystem(); });
  
  // CORS preflight
  addGET("/api/*", [this]() { this->handleCORS(); });
  addPOST("/api/*", [this]() { this->handleCORS(); });
  addPUT("/api/*", [this]() { this->handleCORS(); });
  addDELETE("/api/*", [this]() { this->handleCORS(); });
}

void RESTApi::handleRoot() {
  currentPath = "/";
  currentMethod = HTTP_GET;
  
  String html = "<!DOCTYPE html><html><head><title>Surveillance Car API</title></head>";
  html += "<body><h1>Surveillance Car REST API</h1>";
  html += "<p>Available endpoints:</p>";
  html += "<ul>";
  html += "<li>GET /api/status - System status</li>";
  html += "<li>POST /api/control - Control commands</li>";
  html += "<li>GET /api/config - Configuration</li>";
  html += "<li>GET /api/data - Sensor data</li>";
  html += "<li>GET /api/video - Video stream</li>";
  html += "<li>GET /api/audio - Audio stream</li>";
  html += "<li>GET /api/storage - Storage info</li>";
  html += "<li>GET /api/logs - System logs</li>";
  html += "<li>GET /api/system - System info</li>";
  html += "</ul>";
  html += "</body></html>";
  
  sendResponse(html, OK, "text/html");
}

void RESTApi::handleStatus() {
  currentPath = "/api/status";
  currentMethod = HTTP_GET;
  
  DynamicJsonDocument doc(1024);
  doc["system"] = "Surveillance Car";
  doc["version"] = "1.0.0";
  doc["uptime"] = millis();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifi"] = WiFi.SSID();
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["connectedClients"] = 0; // Will be updated by WebSocket server
  doc["timestamp"] = millis();
  
  sendJSON(doc);
}

void RESTApi::handleControl() {
  currentPath = "/api/control";
  currentMethod = server->method();
  
  if (currentMethod == HTTP_GET) {
    // Return current control status
    DynamicJsonDocument doc(512);
    doc["mode"] = "manual"; // Will be updated by system state
    doc["motors"] = "stopped";
    doc["camera"] = "active";
    doc["audio"] = "active";
    sendJSON(doc);
  } else if (currentMethod == HTTP_POST) {
    // Handle control commands
    String command = getParameter("command");
    String value = getParameter("value");
    
    if (command.length() == 0) {
      sendError("Missing command parameter", BAD_REQUEST);
      return;
    }
    
    // Process command (this would integrate with the main system)
    DynamicJsonDocument doc(512);
    doc["command"] = command;
    doc["value"] = value;
    doc["status"] = "processed";
    doc["timestamp"] = millis();
    
    sendJSON(doc);
  }
}

void RESTApi::handleConfig() {
  currentPath = "/api/config";
  currentMethod = server->method();
  
  if (currentMethod == HTTP_GET) {
    // Return current configuration
    DynamicJsonDocument doc(1024);
    doc["wifi"]["ssid"] = WiFi.SSID();
    doc["wifi"]["ip"] = WiFi.localIP().toString();
    doc["camera"]["quality"] = 12;
    doc["camera"]["brightness"] = 0;
    doc["motors"]["maxSpeed"] = 255;
    doc["sensors"]["irThreshold"] = 500;
    doc["battery"]["warningLevel"] = 20;
    sendJSON(doc);
  } else if (currentMethod == HTTP_POST) {
    // Update configuration
    String config = getBody();
    if (config.length() == 0) {
      sendError("Missing configuration data", BAD_REQUEST);
      return;
    }
    
    // Parse and apply configuration (this would integrate with the main system)
    sendSuccess("Configuration updated");
  }
}

void RESTApi::handleData() {
  currentPath = "/api/data";
  currentMethod = HTTP_GET;
  
  DynamicJsonDocument doc(1024);
  doc["sensors"]["ir"] = "[0, 0, 0]"; // Will be updated with real sensor data
  doc["sensors"]["ultrasonic"] = 0.0;
  doc["battery"]["voltage"] = 0.0;
  doc["battery"]["percentage"] = 0;
  doc["motors"]["leftSpeed"] = 0;
  doc["motors"]["rightSpeed"] = 0;
  doc["timestamp"] = millis();
  
  sendJSON(doc);
}

void RESTApi::handleVideo() {
  currentPath = "/api/video";
  currentMethod = HTTP_GET;
  
  // This would return video stream information
  DynamicJsonDocument doc(512);
  doc["streaming"] = true;
  doc["format"] = "MJPEG";
  doc["resolution"] = "640x480";
  doc["quality"] = 12;
  doc["url"] = "/stream";
  sendJSON(doc);
}

void RESTApi::handleAudio() {
  currentPath = "/api/audio";
  currentMethod = HTTP_GET;
  
  // This would return audio stream information
  DynamicJsonDocument doc(512);
  doc["streaming"] = true;
  doc["format"] = "WAV";
  doc["sampleRate"] = 16000;
  doc["channels"] = 1;
  doc["url"] = "/audio";
  sendJSON(doc);
}

void RESTApi::handleStorage() {
  currentPath = "/api/storage";
  currentMethod = HTTP_GET;
  
  DynamicJsonDocument doc(512);
  doc["type"] = "SD Card";
  doc["totalSpace"] = 0;
  doc["usedSpace"] = 0;
  doc["freeSpace"] = 0;
  doc["usagePercentage"] = 0.0;
  sendJSON(doc);
}

void RESTApi::handleLogs() {
  currentPath = "/api/logs";
  currentMethod = HTTP_GET;
  
  DynamicJsonDocument doc(512);
  doc["logs"] = "[]"; // Will be populated with actual logs
  doc["count"] = 0;
  doc["lastUpdate"] = millis();
  sendJSON(doc);
}

void RESTApi::handleSystem() {
  currentPath = "/api/system";
  currentMethod = server->method();
  
  if (currentMethod == HTTP_GET) {
    DynamicJsonDocument doc(1024);
    doc["uptime"] = millis();
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["cpuFreq"] = ESP.getCpuFreqMHz();
    doc["flashSize"] = ESP.getFlashChipSize();
    doc["chipModel"] = ESP.getChipModel();
    doc["chipRevision"] = ESP.getChipRevision();
    sendJSON(doc);
  } else if (currentMethod == HTTP_POST) {
    String action = getParameter("action");
    if (action == "restart") {
      sendSuccess("System restarting...");
      delay(1000);
      ESP.restart();
    } else {
      sendError("Unknown action", BAD_REQUEST);
    }
  }
}

String RESTApi::getMethodString(HTTPMethod method) {
  switch (method) {
    case HTTP_GET: return "GET";
    case HTTP_POST: return "POST";
    case HTTP_PUT: return "PUT";
    case HTTP_DELETE: return "DELETE";
    case HTTP_PATCH: return "PATCH";
    case HTTP_OPTIONS: return "OPTIONS";
    default: return "UNKNOWN";
  }
}

void RESTApi::logRequest(String path, HTTPMethod method, int responseCode) {
  Serial.print(getMethodString(method));
  Serial.print(" ");
  Serial.print(path);
  Serial.print(" - ");
  Serial.println(responseCode);
}

void RESTApi::updateStatistics() {
  // Statistics are updated in sendResponse
}

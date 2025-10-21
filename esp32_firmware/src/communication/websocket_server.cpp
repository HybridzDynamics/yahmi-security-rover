/*
 * WebSocket Server Module - Implementation
 * 
 * This module handles WebSocket communication for real-time data exchange.
 * Provides client management, message handling, and broadcasting capabilities.
 */

#include "websocket_server.h"

WebSocketServer::WebSocketServer() {
  server = nullptr;
  port = 81;
  isRunning = false;
  connectedClients = 0;
  messageHandler = nullptr;
  broadcastEnabled = false;
  lastBroadcast = 0;
  broadcastInterval = 1000;
  totalMessages = 0;
  totalBytes = 0;
  connectionCount = 0;
  
  // Initialize client info
  for (int i = 0; i < MAX_CLIENTS; i++) {
    clients[i].connected = false;
    clients[i].lastPing = 0;
    clients[i].lastMessage = "";
    clients[i].messageCount = 0;
  }
}

void WebSocketServer::begin(int port) {
  this->port = port;
  
  if (server != nullptr) {
    delete server;
  }
  
  server = new WebSocketsServer(port);
  
  // Set event handler
  server->onEvent([this](uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    this->onWebSocketEvent(num, type, payload, length);
  });
  
  Serial.print("WebSocket server initialized on port ");
  Serial.println(port);
}

void WebSocketServer::end() {
  if (server != nullptr) {
    server->close();
    delete server;
    server = nullptr;
  }
  
  isRunning = false;
  connectedClients = 0;
  Serial.println("WebSocket server stopped");
}

void WebSocketServer::start() {
  if (server == nullptr) {
    Serial.println("WebSocket server not initialized");
    return;
  }
  
  server->begin();
  isRunning = true;
  
  Serial.print("WebSocket server started on port ");
  Serial.println(port);
}

void WebSocketServer::stop() {
  if (server != nullptr) {
    server->close();
  }
  
  isRunning = false;
  Serial.println("WebSocket server stopped");
}

bool WebSocketServer::isRunning() const {
  return isRunning;
}

int WebSocketServer::getConnectedClients() const {
  return connectedClients;
}

bool WebSocketServer::isClientConnected(int clientId) const {
  if (clientId < 0 || clientId >= MAX_CLIENTS) return false;
  return clients[clientId].connected;
}

void WebSocketServer::disconnectClient(int clientId) {
  if (clientId < 0 || clientId >= MAX_CLIENTS) return;
  
  if (clients[clientId].connected) {
    server->disconnect(clientId);
    clients[clientId].connected = false;
    connectedClients--;
    Serial.print("Client ");
    Serial.print(clientId);
    Serial.println(" disconnected");
  }
}

void WebSocketServer::disconnectAllClients() {
  for (int i = 0; i < MAX_CLIENTS; i++) {
    if (clients[i].connected) {
      disconnectClient(i);
    }
  }
}

void WebSocketServer::setMessageHandler(MessageHandler handler) {
  messageHandler = handler;
  Serial.println("Message handler set");
}

void WebSocketServer::sendMessage(int clientId, String message) {
  if (clientId < 0 || clientId >= MAX_CLIENTS || !clients[clientId].connected) {
    return;
  }
  
  server->sendTXT(clientId, message);
  totalMessages++;
  totalBytes += message.length();
}

void WebSocketServer::sendMessage(int clientId, JsonDocument& doc) {
  String message;
  serializeJson(doc, message);
  sendMessage(clientId, message);
}

void WebSocketServer::broadcast(String message) {
  if (!isRunning) return;
  
  server->broadcastTXT(message);
  totalMessages += connectedClients;
  totalBytes += message.length() * connectedClients;
}

void WebSocketServer::broadcast(JsonDocument& doc) {
  String message;
  serializeJson(doc, message);
  broadcast(message);
}

void WebSocketServer::enableBroadcasting(bool enable, int intervalMs) {
  broadcastEnabled = enable;
  broadcastInterval = intervalMs;
  
  Serial.print("Broadcasting ");
  Serial.print(enable ? "enabled" : "disabled");
  if (enable) {
    Serial.print(" (interval: ");
    Serial.print(intervalMs);
    Serial.print("ms)");
  }
  Serial.println();
}

void WebSocketServer::setBroadcastInterval(int intervalMs) {
  broadcastInterval = intervalMs;
  Serial.print("Broadcast interval set to: ");
  Serial.print(intervalMs);
  Serial.println(" ms");
}

unsigned long WebSocketServer::getTotalMessages() const {
  return totalMessages;
}

unsigned long WebSocketServer::getTotalBytes() const {
  return totalBytes;
}

unsigned long WebSocketServer::getConnectionCount() const {
  return connectionCount;
}

void WebSocketServer::update() {
  if (!isRunning) return;
  
  // Handle WebSocket events
  server->loop();
  
  // Check for client timeouts
  checkClientTimeouts();
  
  // Handle broadcasting
  if (broadcastEnabled && millis() - lastBroadcast >= broadcastInterval) {
    broadcastStatus();
    lastBroadcast = millis();
  }
}

void WebSocketServer::handleClients() {
  update();
}

String WebSocketServer::getStatus() {
  String status = "WebSocket: ";
  status += isRunning ? "Running" : "Stopped";
  status += " (Clients: ";
  status += connectedClients;
  status += "/";
  status += MAX_CLIENTS;
  status += ")";
  
  return status;
}

void WebSocketServer::onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      handleClientDisconnect(num);
      break;
      
    case WStype_CONNECTED:
      handleClientConnect(num);
      break;
      
    case WStype_TEXT:
      handleClientMessage(num, payload, length);
      break;
      
    case WStype_BIN:
      // Handle binary data if needed
      break;
      
    case WStype_ERROR:
      Serial.print("WebSocket error for client ");
      Serial.println(num);
      break;
      
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      // Handle fragmented messages if needed
      break;
      
    case WStype_PING:
    case WStype_PONG:
      // Handle ping/pong for keep-alive
      if (num < MAX_CLIENTS) {
        clients[num].lastPing = millis();
      }
      break;
  }
}

void WebSocketServer::handleClientConnect(uint8_t num) {
  if (num >= MAX_CLIENTS) {
    Serial.println("Too many clients, rejecting connection");
    server->disconnect(num);
    return;
  }
  
  clients[num].connected = true;
  clients[num].lastPing = millis();
  clients[num].lastMessage = "";
  clients[num].messageCount = 0;
  connectedClients++;
  connectionCount++;
  
  Serial.print("Client ");
  Serial.print(num);
  Serial.println(" connected");
  
  // Send welcome message
  DynamicJsonDocument doc(512);
  doc["type"] = "welcome";
  doc["clientId"] = num;
  doc["timestamp"] = millis();
  sendMessage(num, doc);
}

void WebSocketServer::handleClientDisconnect(uint8_t num) {
  if (num >= MAX_CLIENTS) return;
  
  clients[num].connected = false;
  clients[num].lastPing = 0;
  clients[num].lastMessage = "";
  clients[num].messageCount = 0;
  connectedClients--;
  
  Serial.print("Client ");
  Serial.print(num);
  Serial.println(" disconnected");
}

void WebSocketServer::handleClientMessage(uint8_t num, uint8_t* payload, size_t length) {
  if (num >= MAX_CLIENTS || !clients[num].connected) return;
  
  String message = String((char*)payload);
  updateClientInfo(num, message);
  
  // Call message handler if set
  if (messageHandler != nullptr) {
    messageHandler(message);
  }
  
  // Echo message back to client for testing
  sendMessage(num, "Echo: " + message);
}

void WebSocketServer::updateClientInfo(uint8_t num, String message) {
  if (num >= MAX_CLIENTS) return;
  
  clients[num].lastMessage = message;
  clients[num].messageCount++;
  clients[num].lastPing = millis();
}

void WebSocketServer::checkClientTimeouts() {
  unsigned long currentTime = millis();
  const unsigned long timeout = 30000; // 30 seconds
  
  for (int i = 0; i < MAX_CLIENTS; i++) {
    if (clients[i].connected && currentTime - clients[i].lastPing > timeout) {
      Serial.print("Client ");
      Serial.print(i);
      Serial.println(" timed out");
      disconnectClient(i);
    }
  }
}

void WebSocketServer::broadcastStatus() {
  DynamicJsonDocument doc(1024);
  doc["type"] = "status";
  doc["timestamp"] = millis();
  doc["connectedClients"] = connectedClients;
  doc["totalMessages"] = totalMessages;
  doc["totalBytes"] = totalBytes;
  
  broadcast(doc);
}

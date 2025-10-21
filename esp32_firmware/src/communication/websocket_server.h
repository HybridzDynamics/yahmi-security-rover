/*
 * WebSocket Server Module - Header File
 * 
 * This module handles WebSocket communication for real-time data exchange.
 * Provides client management, message handling, and broadcasting capabilities.
 */

#ifndef WEBSOCKET_SERVER_H
#define WEBSOCKET_SERVER_H

#include <Arduino.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

class WebSocketServer {
private:
  // WebSocket server
  WebSocketsServer* server;
  int port;
  bool isRunning;
  
  // Client management
  struct ClientInfo {
    bool connected;
    unsigned long lastPing;
    String lastMessage;
    int messageCount;
  };
  
  ClientInfo clients[MAX_CLIENTS];
  int connectedClients;
  
  // Message handling
  typedef void (*MessageHandler)(String message);
  MessageHandler messageHandler;
  
  // Broadcasting
  bool broadcastEnabled;
  unsigned long lastBroadcast;
  int broadcastInterval;
  
  // Statistics
  unsigned long totalMessages;
  unsigned long totalBytes;
  unsigned long connectionCount;
  
public:
  // Constructor
  WebSocketServer();
  
  // Initialization
  void begin(int port = 81);
  void end();
  
  // Server control
  void start();
  void stop();
  bool isRunning() const;
  
  // Client management
  int getConnectedClients() const;
  bool isClientConnected(int clientId) const;
  void disconnectClient(int clientId);
  void disconnectAllClients();
  
  // Message handling
  void setMessageHandler(MessageHandler handler);
  void sendMessage(int clientId, String message);
  void sendMessage(int clientId, JsonDocument& doc);
  void broadcast(String message);
  void broadcast(JsonDocument& doc);
  
  // Broadcasting control
  void enableBroadcasting(bool enable, int intervalMs = 1000);
  void setBroadcastInterval(int intervalMs);
  
  // Statistics
  unsigned long getTotalMessages() const;
  unsigned long getTotalBytes() const;
  unsigned long getConnectionCount() const;
  
  // Utility functions
  void update(); // Call in main loop
  void handleClients();
  String getStatus();
  
private:
  // Internal functions
  void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);
  void handleClientConnect(uint8_t num);
  void handleClientDisconnect(uint8_t num);
  void handleClientMessage(uint8_t num, uint8_t* payload, size_t length);
  void updateClientInfo(uint8_t num, String message);
  void checkClientTimeouts();
  void broadcastStatus();
};

// WebSocket event types
enum WebSocketEventType {
  WS_EVENT_CONNECT = 0,
  WS_EVENT_DISCONNECT = 1,
  WS_EVENT_MESSAGE = 2,
  WS_EVENT_PING = 3,
  WS_EVENT_PONG = 4,
  WS_EVENT_ERROR = 5
};

// Message types
enum MessageType {
  MSG_STATUS = 0,
  MSG_CONTROL = 1,
  MSG_SENSOR_DATA = 2,
  MSG_VIDEO_FRAME = 3,
  MSG_AUDIO_DATA = 4,
  MSG_ALERT = 5,
  MSG_CONFIG = 6
};

#endif // WEBSOCKET_SERVER_H

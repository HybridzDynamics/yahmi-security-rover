/*
 * REST API Module - Header File
 * 
 * This module handles HTTP REST API endpoints for system control and data retrieval.
 * Provides RESTful interface for web dashboard and mobile app communication.
 */

#ifndef REST_API_H
#define REST_API_H

#include <Arduino.h>
#include <WebServer.h>
#include <ArduinoJson.h>

class RESTApi {
private:
  // Web server
  WebServer* server;
  int port;
  bool isRunning;
  
  // Request handling
  typedef void (*RequestHandler)();
  struct Endpoint {
    String path;
    HTTPMethod method;
    RequestHandler handler;
  };
  
  Endpoint endpoints[20];
  int endpointCount;
  
  // Response management
  String currentResponse;
  int responseCode;
  String contentType;
  
  // Request data
  String currentPath;
  HTTPMethod currentMethod;
  String queryString;
  
  // Statistics
  unsigned long totalRequests;
  unsigned long totalBytes;
  unsigned long errorCount;
  
public:
  // Constructor
  RESTApi();
  
  // Initialization
  void begin(int port = 80);
  void end();
  
  // Server control
  void start();
  void stop();
  bool isRunning() const;
  
  // Endpoint management
  void addEndpoint(String path, HTTPMethod method, RequestHandler handler);
  void addGET(String path, RequestHandler handler);
  void addPOST(String path, RequestHandler handler);
  void addPUT(String path, RequestHandler handler);
  void addDELETE(String path, RequestHandler handler);
  
  // Request handling
  void handleRequests();
  void handleNotFound();
  void handleCORS();
  
  // Response management
  void sendResponse(String response, int code = 200, String contentType = "application/json");
  void sendError(String message, int code = 400);
  void sendSuccess(String message = "Success");
  void sendJSON(JsonDocument& doc, int code = 200);
  
  // Request data access
  String getParameter(String name);
  String getHeader(String name);
  String getBody();
  bool hasParameter(String name);
  bool hasHeader(String name);
  
  // Utility functions
  void update(); // Call in main loop
  String getStatus();
  void enableCORS(bool enable);
  
private:
  // Internal functions
  void setupDefaultEndpoints();
  void handleRoot();
  void handleStatus();
  void handleControl();
  void handleConfig();
  void handleData();
  void handleVideo();
  void handleAudio();
  void handleStorage();
  void handleLogs();
  void handleSystem();
  
  // Helper functions
  String getMethodString(HTTPMethod method);
  void logRequest(String path, HTTPMethod method, int responseCode);
  void updateStatistics();
};

// HTTP methods
enum HTTPMethod {
  HTTP_GET = 0,
  HTTP_POST = 1,
  HTTP_PUT = 2,
  HTTP_DELETE = 3,
  HTTP_PATCH = 4,
  HTTP_OPTIONS = 5
};

// Response codes
enum ResponseCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503
};

#endif // REST_API_H

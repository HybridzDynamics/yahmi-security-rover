/*
 * Smart Surveillance Car - Main Header File
 * 
 * This file contains all the necessary includes, definitions, and forward declarations
 * for the Smart Surveillance Car system.
 */

#ifndef MAIN_H
#define MAIN_H

// Arduino and ESP32 includes
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <SD.h>
#include <esp_camera.h>
#include <esp_timer.h>
#include <driver/i2s.h>
#include <HTTPClient.h>

// Forward declarations
class WiFiManager;
class WebSocketServer;
class RESTApi;
class CameraStream;
class AudioManager;
class StorageManager;
class MotorController;
class BatteryMonitor;
class IRSensor;
class UltrasonicSensor;
class AutonomousMode;
class ManualMode;

// System modes
enum SystemMode {
  MODE_MANUAL = 0,
  MODE_AUTONOMOUS = 1
};

// Audio system sounds
enum SystemSound {
  SOUND_POWER_ON = 0,
  SOUND_POWER_OFF = 1,
  SOUND_ALERT = 2,
  SOUND_SIREN = 3
};

// Motor directions
enum MotorDirection {
  MOTOR_FORWARD = 0,
  MOTOR_BACKWARD = 1,
  MOTOR_LEFT = 2,
  MOTOR_RIGHT = 3,
  MOTOR_STOP = 4
};

// System state structure
struct SystemState {
  SystemMode currentMode;
  bool isRunning;
  int batteryLevel;
  bool obstacleDetected;
  unsigned long lastUpdate;
  String wifiSSID;
  IPAddress localIP;
  bool cameraActive;
  bool audioActive;
  bool storageAvailable;
};

// Global function declarations
void initializeHardware();
void updateSensors();
void sendStatusUpdate();
void onWebSocketMessage(String message);
void handleGetStatus();
void handleSetMode();
void handleMotorControl();

// Global variables (extern declarations)
extern SystemState systemState;
extern WiFiManager wifiManager;
extern WebSocketServer wsServer;
extern RESTApi restApi;
extern CameraStream camera;
extern AudioManager audioManager;
extern StorageManager storage;
extern MotorController motors;
extern BatteryMonitor battery;
extern IRSensor irSensors[3];
extern UltrasonicSensor ultrasonic;
extern AutonomousMode autoMode;
extern ManualMode manualMode;

// Configuration constants
#define MAX_CLIENTS 4
#define WEBSOCKET_PORT 81
#define HTTP_PORT 80
#define JSON_BUFFER_SIZE 1024
#define SENSOR_UPDATE_INTERVAL 100
#define BATTERY_UPDATE_INTERVAL 5000
#define STATUS_UPDATE_INTERVAL 1000

// Pin definitions (will be defined in main .ino file)
extern const int IR_PINS[3];
extern const int ULTRASONIC_TRIG;
extern const int ULTRASONIC_ECHO;
extern const int MOTOR_IN1;
extern const int MOTOR_IN2;
extern const int MOTOR_IN3;
extern const int MOTOR_IN4;
extern const int MOTOR_ENA;
extern const int MOTOR_ENB;
extern const int SPEAKER_PIN;
extern const int MIC_PIN;
extern const int BATTERY_PIN;
extern const int SD_CS;

#endif // MAIN_H

/*
 * Manual Mode Module - Header File
 * 
 * This module handles manual control via web dashboard and mobile app.
 * Provides motor control, camera control, and system management.
 */

#ifndef MANUAL_MODE_H
#define MANUAL_MODE_H

#include <Arduino.h>
#include "motor_controller.h"
#include "camera_stream.h"
#include "audio_manager.h"

class ManualMode {
private:
  // Component references
  MotorController* motors;
  CameraStream* camera;
  AudioManager* audio;
  
  // Control state
  bool isActive;
  bool isPaused;
  unsigned long lastCommand;
  int commandTimeout;
  
  // Motor control
  int currentSpeed;
  MotorDirection currentDirection;
  bool motorsEnabled;
  
  // Camera control
  bool cameraEnabled;
  bool autoCapture;
  int captureInterval;
  unsigned long lastCapture;
  
  // Audio control
  bool audioEnabled;
  bool micEnabled;
  bool speakerEnabled;
  
  // Safety features
  bool safetyEnabled;
  unsigned long lastSafetyCheck;
  int safetyCheckInterval;
  
  // Command processing
  struct Command {
    String type;
    String action;
    int value;
    unsigned long timestamp;
  };
  
  Command lastCommand;
  CommandQueue commandQueue[10];
  int queueHead;
  int queueTail;
  int queueSize;
  
public:
  // Constructor
  ManualMode();
  
  // Initialization
  void begin(MotorController* motors, CameraStream* camera, AudioManager* audio);
  void end();
  
  // Mode control
  void start();
  void stop();
  void pause();
  void resume();
  bool isActive() const;
  bool isPaused() const;
  
  // Command handling
  void handleCommand(String command, int value);
  void handleCommand(String command, String action, int value);
  void processCommands();
  void clearCommands();
  
  // Motor control
  void setMotorSpeed(int speed);
  void setMotorDirection(MotorDirection direction);
  void enableMotors(bool enable);
  
  // Camera control
  void enableCamera(bool enable);
  void setAutoCapture(bool enable, int interval = 5000);
  void captureImage();
  void startVideoStream();
  void stopVideoStream();
  
  // Audio control
  void enableAudio(bool enable);
  void enableMicrophone(bool enable);
  void enableSpeaker(bool enable);
  void playSound(SystemSound sound);
  
  // Safety features
  void enableSafety(bool enable);
  void setCommandTimeout(int timeout);
  void checkSafety();
  
  // Configuration
  void setMaxSpeed(int speed);
  void setDefaultSpeed(int speed);
  
  // Main update function
  void update();
  
  // Utility functions
  String getStatus();
  void reset();
  
private:
  // Internal functions
  void processMotorCommand(String action, int value);
  void processCameraCommand(String action, int value);
  void processAudioCommand(String action, int value);
  void processSystemCommand(String action, int value);
  void addCommand(Command command);
  Command getNextCommand();
  bool hasCommands();
  void executeCommand(Command command);
  void logCommand(String command, String action, int value);
};

// Command types
enum CommandType {
  CMD_MOTOR = 0,
  CMD_CAMERA = 1,
  CMD_AUDIO = 2,
  CMD_SYSTEM = 3
};

// Motor commands
enum MotorCommand {
  MOTOR_FORWARD = 0,
  MOTOR_BACKWARD = 1,
  MOTOR_LEFT = 2,
  MOTOR_RIGHT = 3,
  MOTOR_STOP = 4,
  MOTOR_SPEED = 5
};

// Camera commands
enum CameraCommand {
  CAMERA_START = 0,
  CAMERA_STOP = 1,
  CAMERA_CAPTURE = 2,
  CAMERA_QUALITY = 3,
  CAMERA_BRIGHTNESS = 4,
  CAMERA_CONTRAST = 5
};

// Audio commands
enum AudioCommand {
  AUDIO_PLAY = 0,
  AUDIO_STOP = 1,
  AUDIO_VOLUME = 2,
  AUDIO_MIC_START = 3,
  AUDIO_MIC_STOP = 4
};

// System commands
enum SystemCommand {
  SYSTEM_RESTART = 0,
  SYSTEM_STATUS = 1,
  SYSTEM_CONFIG = 2,
  SYSTEM_LOG = 3
};

#endif // MANUAL_MODE_H

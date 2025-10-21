/*
 * Autonomous Mode Module - Header File
 * 
 * This module handles autonomous navigation and obstacle avoidance.
 * Provides line following, obstacle detection, and path planning.
 */

#ifndef AUTONOMOUS_MODE_H
#define AUTONOMOUS_MODE_H

#include <Arduino.h>
#include "ir_sensor.h"
#include "ultrasonic_sensor.h"
#include "motor_controller.h"
#include "camera_stream.h"
#include "audio_manager.h"

class AutonomousMode {
private:
  // Sensor references
  IRSensor* irSensors;
  UltrasonicSensor* ultrasonic;
  MotorController* motors;
  CameraStream* camera;
  AudioManager* audio;
  
  // Navigation state
  bool isActive;
  bool isPaused;
  unsigned long lastUpdate;
  int updateInterval;
  
  // Obstacle avoidance
  bool obstacleDetected;
  float obstacleDistance;
  int obstacleDirection; // -1 = left, 0 = center, 1 = right
  unsigned long obstacleStartTime;
  int obstacleTimeout;
  
  // Line following
  bool lineFollowingEnabled;
  int linePosition; // -2 to 2 (left to right)
  int lastLinePosition;
  int lineFollowingSpeed;
  
  // Path planning
  enum NavigationState {
    NAV_FORWARD = 0,
    NAV_TURN_LEFT = 1,
    NAV_TURN_RIGHT = 2,
    NAV_BACKWARD = 3,
    NAV_STOP = 4,
    NAV_AVOID_LEFT = 5,
    NAV_AVOID_RIGHT = 6
  };
  
  NavigationState currentState;
  NavigationState lastState;
  unsigned long stateStartTime;
  int stateTimeout;
  
  // Speed control
  int baseSpeed;
  int turnSpeed;
  int avoidSpeed;
  int reverseSpeed;
  
  // Safety features
  bool safetyEnabled;
  unsigned long lastSafetyCheck;
  int safetyCheckInterval;
  int maxObstacleTime;
  
public:
  // Constructor
  AutonomousMode();
  
  // Initialization
  void begin(IRSensor* irSensors, UltrasonicSensor* ultrasonic, 
             MotorController* motors, CameraStream* camera, AudioManager* audio);
  void end();
  
  // Mode control
  void start();
  void stop();
  void pause();
  void resume();
  bool isActive() const;
  bool isPaused() const;
  
  // Navigation control
  void setLineFollowing(bool enable);
  void setObstacleAvoidance(bool enable);
  void setSafetyEnabled(bool enable);
  
  // Speed configuration
  void setBaseSpeed(int speed);
  void setTurnSpeed(int speed);
  void setAvoidSpeed(int speed);
  void setReverseSpeed(int speed);
  
  // Main update function
  void update();
  
  // Navigation functions
  void navigate();
  void avoidObstacles();
  void followLine();
  void planPath();
  
  // State management
  void setState(NavigationState state);
  void updateState();
  NavigationState getCurrentState() const;
  
  // Utility functions
  String getStatus();
  void reset();
  
private:
  // Internal functions
  void updateSensors();
  void processObstacles();
  void processLineFollowing();
  void executeState();
  void checkSafety();
  void handleObstacle();
  void handleLineLoss();
  bool isStateTimeout();
  void logNavigationEvent(String event);
};

// Navigation states
enum NavigationState {
  NAV_FORWARD = 0,
  NAV_TURN_LEFT = 1,
  NAV_TURN_RIGHT = 2,
  NAV_BACKWARD = 3,
  NAV_STOP = 4,
  NAV_AVOID_LEFT = 5,
  NAV_AVOID_RIGHT = 6
};

#endif // AUTONOMOUS_MODE_H

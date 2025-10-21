/*
 * Autonomous Mode Module - Implementation
 * 
 * This module handles autonomous navigation and obstacle avoidance.
 * Provides line following, obstacle detection, and path planning.
 */

#include "autonomous_mode.h"

AutonomousMode::AutonomousMode() {
  irSensors = nullptr;
  ultrasonic = nullptr;
  motors = nullptr;
  camera = nullptr;
  audio = nullptr;
  isActive = false;
  isPaused = false;
  lastUpdate = 0;
  updateInterval = 100; // 100ms update interval
  obstacleDetected = false;
  obstacleDistance = 0.0;
  obstacleDirection = 0;
  obstacleStartTime = 0;
  obstacleTimeout = 5000; // 5 seconds
  lineFollowingEnabled = true;
  linePosition = 0;
  lastLinePosition = 0;
  lineFollowingSpeed = 150;
  currentState = NAV_FORWARD;
  lastState = NAV_FORWARD;
  stateStartTime = 0;
  stateTimeout = 3000; // 3 seconds
  baseSpeed = 150;
  turnSpeed = 120;
  avoidSpeed = 100;
  reverseSpeed = 100;
  safetyEnabled = true;
  lastSafetyCheck = 0;
  safetyCheckInterval = 500; // 500ms
  maxObstacleTime = 10000; // 10 seconds
}

void AutonomousMode::begin(IRSensor* irSensors, UltrasonicSensor* ultrasonic, 
                          MotorController* motors, CameraStream* camera, AudioManager* audio) {
  this->irSensors = irSensors;
  this->ultrasonic = ultrasonic;
  this->motors = motors;
  this->camera = camera;
  this->audio = audio;
  
  Serial.println("Autonomous mode initialized");
}

void AutonomousMode::end() {
  stop();
  Serial.println("Autonomous mode deinitialized");
}

void AutonomousMode::start() {
  if (isActive) return;
  
  isActive = true;
  isPaused = false;
  currentState = NAV_FORWARD;
  stateStartTime = millis();
  lastUpdate = millis();
  
  // Play start sound
  if (audio) {
    audio->playSystemSound(SOUND_ALERT);
  }
  
  Serial.println("Autonomous mode started");
  logNavigationEvent("Mode started");
}

void AutonomousMode::stop() {
  if (!isActive) return;
  
  isActive = false;
  isPaused = false;
  currentState = NAV_STOP;
  
  // Stop motors
  if (motors) {
    motors->stop();
  }
  
  // Play stop sound
  if (audio) {
    audio->playSystemSound(SOUND_POWER_OFF);
  }
  
  Serial.println("Autonomous mode stopped");
  logNavigationEvent("Mode stopped");
}

void AutonomousMode::pause() {
  if (!isActive || isPaused) return;
  
  isPaused = true;
  currentState = NAV_STOP;
  
  // Stop motors
  if (motors) {
    motors->stop();
  }
  
  Serial.println("Autonomous mode paused");
  logNavigationEvent("Mode paused");
}

void AutonomousMode::resume() {
  if (!isActive || !isPaused) return;
  
  isPaused = false;
  currentState = NAV_FORWARD;
  stateStartTime = millis();
  
  Serial.println("Autonomous mode resumed");
  logNavigationEvent("Mode resumed");
}

bool AutonomousMode::isActive() const {
  return isActive;
}

bool AutonomousMode::isPaused() const {
  return isPaused;
}

void AutonomousMode::setLineFollowing(bool enable) {
  lineFollowingEnabled = enable;
  Serial.print("Line following ");
  Serial.println(enable ? "enabled" : "disabled");
}

void AutonomousMode::setObstacleAvoidance(bool enable) {
  // This would enable/disable obstacle avoidance
  Serial.print("Obstacle avoidance ");
  Serial.println(enable ? "enabled" : "disabled");
}

void AutonomousMode::setSafetyEnabled(bool enable) {
  safetyEnabled = enable;
  Serial.print("Safety features ");
  Serial.println(enable ? "enabled" : "disabled");
}

void AutonomousMode::setBaseSpeed(int speed) {
  baseSpeed = constrain(speed, 0, 255);
  Serial.print("Base speed set to: ");
  Serial.println(baseSpeed);
}

void AutonomousMode::setTurnSpeed(int speed) {
  turnSpeed = constrain(speed, 0, 255);
  Serial.print("Turn speed set to: ");
  Serial.println(turnSpeed);
}

void AutonomousMode::setAvoidSpeed(int speed) {
  avoidSpeed = constrain(speed, 0, 255);
  Serial.print("Avoid speed set to: ");
  Serial.println(avoidSpeed);
}

void AutonomousMode::setReverseSpeed(int speed) {
  reverseSpeed = constrain(speed, 0, 255);
  Serial.print("Reverse speed set to: ");
  Serial.println(reverseSpeed);
}

void AutonomousMode::update() {
  if (!isActive || isPaused) return;
  
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate < updateInterval) return;
  
  // Update sensors
  updateSensors();
  
  // Check safety
  if (safetyEnabled) {
    checkSafety();
  }
  
  // Main navigation logic
  navigate();
  
  // Update state
  updateState();
  
  lastUpdate = currentTime;
}

void AutonomousMode::navigate() {
  // Process obstacles first (highest priority)
  processObstacles();
  
  // Process line following if enabled
  if (lineFollowingEnabled) {
    processLineFollowing();
  }
  
  // Execute current navigation state
  executeState();
}

void AutonomousMode::avoidObstacles() {
  if (!obstacleDetected) return;
  
  // Determine obstacle direction
  bool leftObstacle = irSensors[0].isObstacleDetected();
  bool centerObstacle = irSensors[1].isObstacleDetected();
  bool rightObstacle = irSensors[2].isObstacleDetected();
  
  if (centerObstacle) {
    // Obstacle directly ahead
    if (obstacleDistance < 15.0) {
      // Very close obstacle, reverse first
      setState(NAV_BACKWARD);
    } else {
      // Choose direction based on side sensors
      if (!leftObstacle && rightObstacle) {
        setState(NAV_AVOID_LEFT);
      } else if (leftObstacle && !rightObstacle) {
        setState(NAV_AVOID_RIGHT);
      } else {
        // Both sides blocked, reverse and try again
        setState(NAV_BACKWARD);
      }
    }
  } else if (leftObstacle) {
    setState(NAV_AVOID_RIGHT);
  } else if (rightObstacle) {
    setState(NAV_AVOID_LEFT);
  }
}

void AutonomousMode::followLine() {
  if (!lineFollowingEnabled) return;
  
  // Read line position from IR sensors
  bool leftLine = irSensors[0].isObstacleDetected();
  bool centerLine = irSensors[1].isObstacleDetected();
  bool rightLine = irSensors[2].isObstacleDetected();
  
  // Calculate line position (-2 to 2)
  if (leftLine && centerLine && rightLine) {
    linePosition = 0; // On line
  } else if (leftLine && centerLine) {
    linePosition = -1; // Slightly left
  } else if (centerLine && rightLine) {
    linePosition = 1; // Slightly right
  } else if (leftLine) {
    linePosition = -2; // Far left
  } else if (rightLine) {
    linePosition = 2; // Far right
  } else {
    // No line detected
    if (lastLinePosition < 0) {
      linePosition = -2; // Assume left
    } else {
      linePosition = 2; // Assume right
    }
  }
  
  lastLinePosition = linePosition;
  
  // Adjust motors based on line position
  if (linePosition == 0) {
    // On line, go straight
    setState(NAV_FORWARD);
  } else if (linePosition < 0) {
    // Line to the left, turn left
    setState(NAV_TURN_LEFT);
  } else {
    // Line to the right, turn right
    setState(NAV_TURN_RIGHT);
  }
}

void AutonomousMode::planPath() {
  // Simple path planning - avoid obstacles and follow line
  if (obstacleDetected) {
    avoidObstacles();
  } else if (lineFollowingEnabled) {
    followLine();
  } else {
    // No line following, just go forward
    setState(NAV_FORWARD);
  }
}

void AutonomousMode::setState(NavigationState state) {
  if (state == currentState) return;
  
  lastState = currentState;
  currentState = state;
  stateStartTime = millis();
  
  // Log state change
  String stateNames[] = {"FORWARD", "TURN_LEFT", "TURN_RIGHT", "BACKWARD", 
                        "STOP", "AVOID_LEFT", "AVOID_RIGHT"};
  logNavigationEvent("State: " + stateNames[state]);
}

void AutonomousMode::updateState() {
  // Check for state timeout
  if (isStateTimeout()) {
    // State has been active too long, try to recover
    if (currentState == NAV_BACKWARD) {
      setState(NAV_FORWARD);
    } else if (currentState == NAV_AVOID_LEFT || currentState == NAV_AVOID_RIGHT) {
      setState(NAV_FORWARD);
    }
  }
}

NavigationState AutonomousMode::getCurrentState() const {
  return currentState;
}

String AutonomousMode::getStatus() {
  String status = "Autonomous: ";
  status += isActive ? (isPaused ? "Paused" : "Active") : "Inactive";
  status += " (State: ";
  
  String stateNames[] = {"FORWARD", "TURN_LEFT", "TURN_RIGHT", "BACKWARD", 
                        "STOP", "AVOID_LEFT", "AVOID_RIGHT"};
  status += stateNames[currentState];
  status += ")";
  
  return status;
}

void AutonomousMode::reset() {
  stop();
  currentState = NAV_FORWARD;
  lastState = NAV_FORWARD;
  stateStartTime = 0;
  obstacleDetected = false;
  obstacleDistance = 0.0;
  obstacleDirection = 0;
  linePosition = 0;
  lastLinePosition = 0;
  
  Serial.println("Autonomous mode reset");
}

void AutonomousMode::updateSensors() {
  if (!irSensors || !ultrasonic) return;
  
  // Update IR sensors
  for (int i = 0; i < 3; i++) {
    irSensors[i].update();
  }
  
  // Update ultrasonic sensor
  ultrasonic->update();
  
  // Check for obstacles
  bool leftObstacle = irSensors[0].isObstacleDetected();
  bool centerObstacle = irSensors[1].isObstacleDetected();
  bool rightObstacle = irSensors[2].isObstacleDetected();
  float distance = ultrasonic->getDistance();
  
  obstacleDetected = leftObstacle || centerObstacle || rightObstacle || (distance < 20.0);
  obstacleDistance = distance;
  
  if (obstacleDetected) {
    if (obstacleStartTime == 0) {
      obstacleStartTime = millis();
    }
  } else {
    obstacleStartTime = 0;
  }
}

void AutonomousMode::processObstacles() {
  if (obstacleDetected) {
    avoidObstacles();
  }
}

void AutonomousMode::processLineFollowing() {
  if (!obstacleDetected) {
    followLine();
  }
}

void AutonomousMode::executeState() {
  if (!motors) return;
  
  switch (currentState) {
    case NAV_FORWARD:
      motors->moveForward(baseSpeed);
      break;
      
    case NAV_TURN_LEFT:
      motors->turnLeft(turnSpeed);
      break;
      
    case NAV_TURN_RIGHT:
      motors->turnRight(turnSpeed);
      break;
      
    case NAV_BACKWARD:
      motors->moveBackward(reverseSpeed);
      break;
      
    case NAV_STOP:
      motors->stop();
      break;
      
    case NAV_AVOID_LEFT:
      motors->turnLeft(avoidSpeed);
      break;
      
    case NAV_AVOID_RIGHT:
      motors->turnRight(avoidSpeed);
      break;
  }
}

void AutonomousMode::checkSafety() {
  unsigned long currentTime = millis();
  if (currentTime - lastSafetyCheck < safetyCheckInterval) return;
  
  // Check for prolonged obstacle detection
  if (obstacleDetected && obstacleStartTime > 0) {
    if (currentTime - obstacleStartTime > maxObstacleTime) {
      // Obstacle detected for too long, stop and alert
      setState(NAV_STOP);
      if (audio) {
        audio->playSystemSound(SOUND_SIREN);
      }
      logNavigationEvent("Safety stop - prolonged obstacle");
    }
  }
  
  lastSafetyCheck = currentTime;
}

void AutonomousMode::handleObstacle() {
  // Handle obstacle detection
  logNavigationEvent("Obstacle detected at " + String(obstacleDistance) + "cm");
}

void AutonomousMode::handleLineLoss() {
  // Handle line loss
  logNavigationEvent("Line lost");
}

bool AutonomousMode::isStateTimeout() {
  return (millis() - stateStartTime) > stateTimeout;
}

void AutonomousMode::logNavigationEvent(String event) {
  Serial.print("Navigation: ");
  Serial.println(event);
}

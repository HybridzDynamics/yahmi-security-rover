/*
 * Manual Mode Module - Implementation
 * 
 * This module handles manual control via web dashboard and mobile app.
 * Provides motor control, camera control, and system management.
 */

#include "manual_mode.h"

ManualMode::ManualMode() {
  motors = nullptr;
  camera = nullptr;
  audio = nullptr;
  isActive = false;
  isPaused = false;
  lastCommand = 0;
  commandTimeout = 5000; // 5 seconds
  currentSpeed = 150;
  currentDirection = MOTOR_STOP;
  motorsEnabled = true;
  cameraEnabled = true;
  autoCapture = false;
  captureInterval = 5000;
  lastCapture = 0;
  audioEnabled = true;
  micEnabled = false;
  speakerEnabled = true;
  safetyEnabled = true;
  lastSafetyCheck = 0;
  safetyCheckInterval = 1000;
  queueHead = 0;
  queueTail = 0;
  queueSize = 0;
}

void ManualMode::begin(MotorController* motors, CameraStream* camera, AudioManager* audio) {
  this->motors = motors;
  this->camera = camera;
  this->audio = audio;
  
  Serial.println("Manual mode initialized");
}

void ManualMode::end() {
  stop();
  Serial.println("Manual mode deinitialized");
}

void ManualMode::start() {
  if (isActive) return;
  
  isActive = true;
  isPaused = false;
  lastCommand = millis();
  
  // Enable components
  if (motors) {
    motors->enableSafety(true);
  }
  
  if (camera) {
    camera->startStream();
  }
  
  if (audio) {
    audio->enableSystemSounds(true);
  }
  
  Serial.println("Manual mode started");
  logCommand("system", "start", 0);
}

void ManualMode::stop() {
  if (!isActive) return;
  
  isActive = false;
  isPaused = false;
  
  // Stop motors
  if (motors) {
    motors->stop();
  }
  
  // Stop camera stream
  if (camera) {
    camera->stopStream();
  }
  
  // Stop audio
  if (audio) {
    audio->stop();
  }
  
  // Clear command queue
  clearCommands();
  
  Serial.println("Manual mode stopped");
  logCommand("system", "stop", 0);
}

void ManualMode::pause() {
  if (!isActive || isPaused) return;
  
  isPaused = true;
  
  // Stop motors
  if (motors) {
    motors->stop();
  }
  
  Serial.println("Manual mode paused");
  logCommand("system", "pause", 0);
}

void ManualMode::resume() {
  if (!isActive || !isPaused) return;
  
  isPaused = false;
  lastCommand = millis();
  
  Serial.println("Manual mode resumed");
  logCommand("system", "resume", 0);
}

bool ManualMode::isActive() const {
  return isActive;
}

bool ManualMode::isPaused() const {
  return isPaused;
}

void ManualMode::handleCommand(String command, int value) {
  if (!isActive) return;
  
  Command cmd;
  cmd.type = command;
  cmd.action = "";
  cmd.value = value;
  cmd.timestamp = millis();
  
  addCommand(cmd);
  lastCommand = millis();
}

void ManualMode::handleCommand(String command, String action, int value) {
  if (!isActive) return;
  
  Command cmd;
  cmd.type = command;
  cmd.action = action;
  cmd.value = value;
  cmd.timestamp = millis();
  
  addCommand(cmd);
  lastCommand = millis();
}

void ManualMode::processCommands() {
  while (hasCommands()) {
    Command cmd = getNextCommand();
    executeCommand(cmd);
  }
}

void ManualMode::clearCommands() {
  queueHead = 0;
  queueTail = 0;
  queueSize = 0;
  Serial.println("Command queue cleared");
}

void ManualMode::setMotorSpeed(int speed) {
  currentSpeed = constrain(speed, 0, 255);
  if (motors) {
    motors->setMaxSpeed(currentSpeed);
  }
  Serial.print("Motor speed set to: ");
  Serial.println(currentSpeed);
}

void ManualMode::setMotorDirection(MotorDirection direction) {
  currentDirection = direction;
  if (motors) {
    motors->setDirection(direction, currentSpeed);
  }
  Serial.print("Motor direction set to: ");
  Serial.println(direction);
}

void ManualMode::enableMotors(bool enable) {
  motorsEnabled = enable;
  if (!enable && motors) {
    motors->stop();
  }
  Serial.print("Motors ");
  Serial.println(enable ? "enabled" : "disabled");
}

void ManualMode::enableCamera(bool enable) {
  cameraEnabled = enable;
  if (camera) {
    if (enable) {
      camera->startStream();
    } else {
      camera->stopStream();
    }
  }
  Serial.print("Camera ");
  Serial.println(enable ? "enabled" : "disabled");
}

void ManualMode::setAutoCapture(bool enable, int interval) {
  autoCapture = enable;
  captureInterval = interval;
  if (camera) {
    camera->setAutoCapture(enable, interval);
  }
  Serial.print("Auto capture ");
  Serial.print(enable ? "enabled" : "disabled");
  if (enable) {
    Serial.print(" (interval: ");
    Serial.print(interval);
    Serial.print("ms)");
  }
  Serial.println();
}

void ManualMode::captureImage() {
  if (camera && cameraEnabled) {
    camera->captureImage();
    lastCapture = millis();
    Serial.println("Image captured");
  }
}

void ManualMode::startVideoStream() {
  if (camera && cameraEnabled) {
    camera->startStream();
    Serial.println("Video stream started");
  }
}

void ManualMode::stopVideoStream() {
  if (camera) {
    camera->stopStream();
    Serial.println("Video stream stopped");
  }
}

void ManualMode::enableAudio(bool enable) {
  audioEnabled = enable;
  if (audio) {
    if (enable) {
      audio->enableSystemSounds(true);
    } else {
      audio->stop();
    }
  }
  Serial.print("Audio ");
  Serial.println(enable ? "enabled" : "disabled");
}

void ManualMode::enableMicrophone(bool enable) {
  micEnabled = enable;
  if (audio) {
    if (enable) {
      audio->startCapture();
    } else {
      audio->stopCapture();
    }
  }
  Serial.print("Microphone ");
  Serial.println(enable ? "enabled" : "disabled");
}

void ManualMode::enableSpeaker(bool enable) {
  speakerEnabled = enable;
  if (audio) {
    if (enable) {
      audio->enableSystemSounds(true);
    } else {
      audio->stop();
    }
  }
  Serial.print("Speaker ");
  Serial.println(enable ? "enabled" : "disabled");
}

void ManualMode::playSound(SystemSound sound) {
  if (audio && speakerEnabled) {
    audio->playSystemSound(sound);
    Serial.print("Playing sound: ");
    Serial.println(sound);
  }
}

void ManualMode::enableSafety(bool enable) {
  safetyEnabled = enable;
  if (motors) {
    motors->enableSafety(enable);
  }
  Serial.print("Safety features ");
  Serial.println(enable ? "enabled" : "disabled");
}

void ManualMode::setCommandTimeout(int timeout) {
  commandTimeout = timeout;
  Serial.print("Command timeout set to: ");
  Serial.print(timeout);
  Serial.println(" ms");
}

void ManualMode::checkSafety() {
  if (!safetyEnabled) return;
  
  unsigned long currentTime = millis();
  if (currentTime - lastSafetyCheck < safetyCheckInterval) return;
  
  // Check for command timeout
  if (currentTime - lastCommand > commandTimeout) {
    // No commands received for too long, stop motors
    if (motors && motorsEnabled) {
      motors->stop();
      Serial.println("Safety stop - command timeout");
    }
  }
  
  lastSafetyCheck = currentTime;
}

void ManualMode::setMaxSpeed(int speed) {
  if (motors) {
    motors->setMaxSpeed(speed);
  }
  Serial.print("Max speed set to: ");
  Serial.println(speed);
}

void ManualMode::setDefaultSpeed(int speed) {
  currentSpeed = constrain(speed, 0, 255);
  Serial.print("Default speed set to: ");
  Serial.println(currentSpeed);
}

void ManualMode::update() {
  if (!isActive) return;
  
  // Process commands
  processCommands();
  
  // Check safety
  if (safetyEnabled) {
    checkSafety();
  }
  
  // Handle auto capture
  if (autoCapture && camera && cameraEnabled) {
    if (millis() - lastCapture >= captureInterval) {
      captureImage();
    }
  }
}

String ManualMode::getStatus() {
  String status = "Manual: ";
  status += isActive ? (isPaused ? "Paused" : "Active") : "Inactive";
  status += " (Motors: ";
  status += motorsEnabled ? "ON" : "OFF";
  status += ", Camera: ";
  status += cameraEnabled ? "ON" : "OFF";
  status += ", Audio: ";
  status += audioEnabled ? "ON" : "OFF";
  status += ")";
  
  return status;
}

void ManualMode::reset() {
  stop();
  currentSpeed = 150;
  currentDirection = MOTOR_STOP;
  motorsEnabled = true;
  cameraEnabled = true;
  audioEnabled = true;
  micEnabled = false;
  speakerEnabled = true;
  autoCapture = false;
  lastCommand = 0;
  
  Serial.println("Manual mode reset");
}

void ManualMode::processMotorCommand(String action, int value) {
  if (!motors || !motorsEnabled) return;
  
  if (action == "forward") {
    motors->moveForward(value > 0 ? value : currentSpeed);
    currentDirection = MOTOR_FORWARD;
  } else if (action == "backward") {
    motors->moveBackward(value > 0 ? value : currentSpeed);
    currentDirection = MOTOR_BACKWARD;
  } else if (action == "left") {
    motors->turnLeft(value > 0 ? value : currentSpeed);
    currentDirection = MOTOR_LEFT;
  } else if (action == "right") {
    motors->turnRight(value > 0 ? value : currentSpeed);
    currentDirection = MOTOR_RIGHT;
  } else if (action == "stop") {
    motors->stop();
    currentDirection = MOTOR_STOP;
  } else if (action == "speed") {
    setMotorSpeed(value);
  }
  
  logCommand("motor", action, value);
}

void ManualMode::processCameraCommand(String action, int value) {
  if (!camera || !cameraEnabled) return;
  
  if (action == "start") {
    camera->startStream();
  } else if (action == "stop") {
    camera->stopStream();
  } else if (action == "capture") {
    captureImage();
  } else if (action == "quality") {
    camera->setJpegQuality(value);
  } else if (action == "brightness") {
    camera->setBrightness(value);
  } else if (action == "contrast") {
    camera->setContrast(value);
  }
  
  logCommand("camera", action, value);
}

void ManualMode::processAudioCommand(String action, int value) {
  if (!audio || !audioEnabled) return;
  
  if (action == "play") {
    playSound((SystemSound)value);
  } else if (action == "stop") {
    audio->stop();
  } else if (action == "volume") {
    audio->setVolume(value);
  } else if (action == "mic_start") {
    enableMicrophone(true);
  } else if (action == "mic_stop") {
    enableMicrophone(false);
  }
  
  logCommand("audio", action, value);
}

void ManualMode::processSystemCommand(String action, int value) {
  if (action == "restart") {
    Serial.println("System restart requested");
    delay(1000);
    ESP.restart();
  } else if (action == "status") {
    // Status is handled by main system
  } else if (action == "config") {
    // Configuration is handled by main system
  } else if (action == "log") {
    // Logging is handled by main system
  }
  
  logCommand("system", action, value);
}

void ManualMode::addCommand(Command command) {
  if (queueSize >= 10) {
    // Queue is full, remove oldest command
    queueHead = (queueHead + 1) % 10;
    queueSize--;
  }
  
  commandQueue[queueTail] = command;
  queueTail = (queueTail + 1) % 10;
  queueSize++;
}

Command ManualMode::getNextCommand() {
  if (queueSize == 0) {
    Command empty;
    empty.type = "";
    empty.action = "";
    empty.value = 0;
    empty.timestamp = 0;
    return empty;
  }
  
  Command command = commandQueue[queueHead];
  queueHead = (queueHead + 1) % 10;
  queueSize--;
  
  return command;
}

bool ManualMode::hasCommands() {
  return queueSize > 0;
}

void ManualMode::executeCommand(Command command) {
  if (command.type.length() == 0) return;
  
  if (command.type == "motor") {
    processMotorCommand(command.action, command.value);
  } else if (command.type == "camera") {
    processCameraCommand(command.action, command.value);
  } else if (command.type == "audio") {
    processAudioCommand(command.action, command.value);
  } else if (command.type == "system") {
    processSystemCommand(command.action, command.value);
  }
}

void ManualMode::logCommand(String command, String action, int value) {
  Serial.print("Command: ");
  Serial.print(command);
  Serial.print(".");
  Serial.print(action);
  Serial.print(" = ");
  Serial.println(value);
}

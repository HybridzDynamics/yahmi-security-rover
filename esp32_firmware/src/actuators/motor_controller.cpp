/*
 * Motor Controller Module - Implementation
 * 
 * This module handles DC motor control for the surveillance car.
 * Provides differential drive control with safety features.
 */

#include "motor_controller.h"

MotorController::MotorController() {
  in1 = in2 = in3 = in4 = -1;
  ena = enb = -1;
  leftSpeed = 0;
  rightSpeed = 0;
  currentDirection = MOTOR_STOP;
  isMoving = false;
  maxSpeed = 255;
  minSpeed = 50;
  safetyEnabled = true;
  lastCommandTime = 0;
  commandTimeout = 5000; // 5 second timeout
}

void MotorController::begin(int in1Pin, int in2Pin, int in3Pin, int in4Pin, int enaPin, int enbPin) {
  in1 = in1Pin;
  in2 = in2Pin;
  in3 = in3Pin;
  in4 = in4Pin;
  ena = enaPin;
  enb = enbPin;
  
  // Set pin modes
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  pinMode(in3, OUTPUT);
  pinMode(in4, OUTPUT);
  pinMode(ena, OUTPUT);
  pinMode(enb, OUTPUT);
  
  // Initialize motors to stop
  stop();
  
  Serial.print("Motor controller initialized on pins ");
  Serial.print("IN1:");
  Serial.print(in1);
  Serial.print(" IN2:");
  Serial.print(in2);
  Serial.print(" IN3:");
  Serial.print(in3);
  Serial.print(" IN4:");
  Serial.print(in4);
  Serial.print(" ENA:");
  Serial.print(ena);
  Serial.print(" ENB:");
  Serial.println(enb);
}

void MotorController::moveForward(int speed) {
  if (!isCommandValid()) return;
  
  speed = constrainSpeed(speed);
  setSpeeds(speed, speed);
  currentDirection = MOTOR_FORWARD;
  isMoving = true;
  lastCommandTime = millis();
  
  Serial.println("Moving forward");
}

void MotorController::moveBackward(int speed) {
  if (!isCommandValid()) return;
  
  speed = constrainSpeed(speed);
  setSpeeds(-speed, -speed);
  currentDirection = MOTOR_BACKWARD;
  isMoving = true;
  lastCommandTime = millis();
  
  Serial.println("Moving backward");
}

void MotorController::turnLeft(int speed) {
  if (!isCommandValid()) return;
  
  speed = constrainSpeed(speed);
  setSpeeds(-speed, speed);
  currentDirection = MOTOR_LEFT;
  isMoving = true;
  lastCommandTime = millis();
  
  Serial.println("Turning left");
}

void MotorController::turnRight(int speed) {
  if (!isCommandValid()) return;
  
  speed = constrainSpeed(speed);
  setSpeeds(speed, -speed);
  currentDirection = MOTOR_RIGHT;
  isMoving = true;
  lastCommandTime = millis();
  
  Serial.println("Turning right");
}

void MotorController::stop() {
  setSpeeds(0, 0);
  currentDirection = MOTOR_STOP;
  isMoving = false;
  lastCommandTime = millis();
  
  Serial.println("Motors stopped");
}

void MotorController::setSpeeds(int leftSpeed, int rightSpeed) {
  this->leftSpeed = constrainSpeed(leftSpeed);
  this->rightSpeed = constrainSpeed(rightSpeed);
  updateMotors();
}

void MotorController::setDirection(MotorDirection direction, int speed) {
  switch (direction) {
    case MOTOR_FORWARD:
      moveForward(speed);
      break;
    case MOTOR_BACKWARD:
      moveBackward(speed);
      break;
    case MOTOR_LEFT:
      turnLeft(speed);
      break;
    case MOTOR_RIGHT:
      turnRight(speed);
      break;
    case MOTOR_STOP:
      stop();
      break;
  }
}

void MotorController::setMaxSpeed(int maxSpeed) {
  this->maxSpeed = constrain(maxSpeed, 0, 255);
  Serial.print("Max speed set to: ");
  Serial.println(this->maxSpeed);
}

void MotorController::setMinSpeed(int minSpeed) {
  this->minSpeed = constrain(minSpeed, 0, 255);
  Serial.print("Min speed set to: ");
  Serial.println(this->minSpeed);
}

void MotorController::adjustSpeed(int deltaSpeed) {
  leftSpeed = constrainSpeed(leftSpeed + deltaSpeed);
  rightSpeed = constrainSpeed(rightSpeed + deltaSpeed);
  updateMotors();
}

void MotorController::enableSafety(bool enable) {
  safetyEnabled = enable;
  Serial.print("Motor safety ");
  Serial.println(enable ? "enabled" : "disabled");
}

void MotorController::setCommandTimeout(int timeoutMs) {
  commandTimeout = timeoutMs;
  Serial.print("Command timeout set to: ");
  Serial.print(timeoutMs);
  Serial.println(" ms");
}

void MotorController::checkSafety() {
  if (!safetyEnabled) return;
  
  // Check for command timeout
  if (isMoving && (millis() - lastCommandTime > commandTimeout)) {
    Serial.println("Motor command timeout - stopping");
    emergencyStop();
  }
}

int MotorController::getLeftSpeed() const {
  return leftSpeed;
}

int MotorController::getRightSpeed() const {
  return rightSpeed;
}

MotorDirection MotorController::getCurrentDirection() const {
  return currentDirection;
}

bool MotorController::isMoving() const {
  return isMoving;
}

bool MotorController::isSafetyEnabled() const {
  return safetyEnabled;
}

void MotorController::emergencyStop() {
  setSpeeds(0, 0);
  currentDirection = MOTOR_STOP;
  isMoving = false;
  lastCommandTime = millis();
  
  Serial.println("EMERGENCY STOP!");
}

void MotorController::coast() {
  // Set all direction pins to LOW to let motors coast
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  digitalWrite(in3, LOW);
  digitalWrite(in4, LOW);
  analogWrite(ena, 0);
  analogWrite(enb, 0);
  
  isMoving = false;
  currentDirection = MOTOR_STOP;
}

void MotorController::brake() {
  // Set opposite direction pins to create braking effect
  digitalWrite(in1, HIGH);
  digitalWrite(in2, HIGH);
  digitalWrite(in3, HIGH);
  digitalWrite(in4, HIGH);
  analogWrite(ena, 0);
  analogWrite(enb, 0);
  
  delay(100); // Brief brake
  stop();
}

String MotorController::getStatus() {
  String status = "Motors: ";
  status += isMoving ? "Moving" : "Stopped";
  status += " (L:";
  status += leftSpeed;
  status += ", R:";
  status += rightSpeed;
  status += ")";
  
  return status;
}

void MotorController::updateMotors() {
  // Left motor control
  if (leftSpeed > 0) {
    digitalWrite(in1, HIGH);
    digitalWrite(in2, LOW);
    analogWrite(ena, leftSpeed);
  } else if (leftSpeed < 0) {
    digitalWrite(in1, LOW);
    digitalWrite(in2, HIGH);
    analogWrite(ena, -leftSpeed);
  } else {
    digitalWrite(in1, LOW);
    digitalWrite(in2, LOW);
    analogWrite(ena, 0);
  }
  
  // Right motor control
  if (rightSpeed > 0) {
    digitalWrite(in3, HIGH);
    digitalWrite(in4, LOW);
    analogWrite(enb, rightSpeed);
  } else if (rightSpeed < 0) {
    digitalWrite(in3, LOW);
    digitalWrite(in4, HIGH);
    analogWrite(enb, -rightSpeed);
  } else {
    digitalWrite(in3, LOW);
    digitalWrite(in4, LOW);
    analogWrite(enb, 0);
  }
}

void MotorController::setMotorPins(int in1, int in2, int in3, int in4) {
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  digitalWrite(in3, LOW);
  digitalWrite(in4, LOW);
}

void MotorController::setMotorSpeeds(int leftSpeed, int rightSpeed) {
  analogWrite(ena, constrainSpeed(leftSpeed));
  analogWrite(enb, constrainSpeed(rightSpeed));
}

int MotorController::constrainSpeed(int speed) {
  return constrain(speed, -maxSpeed, maxSpeed);
}

bool MotorController::isCommandValid() {
  return !safetyEnabled || (millis() - lastCommandTime < commandTimeout);
}

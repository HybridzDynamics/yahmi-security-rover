/*
 * Motor Controller Module - Header File
 * 
 * This module handles DC motor control for the surveillance car.
 * Supports differential drive with speed control and direction management.
 */

#ifndef MOTOR_CONTROLLER_H
#define MOTOR_CONTROLLER_H

#include <Arduino.h>

class MotorController {
private:
  // Motor pins
  int in1, in2, in3, in4;  // Direction control pins
  int ena, enb;            // Speed control pins (PWM)
  
  // Motor states
  int leftSpeed;
  int rightSpeed;
  MotorDirection currentDirection;
  bool isMoving;
  
  // Speed limits
  int maxSpeed;
  int minSpeed;
  
  // Safety features
  bool safetyEnabled;
  unsigned long lastCommandTime;
  int commandTimeout;
  
public:
  // Constructor
  MotorController();
  
  // Initialization
  void begin(int in1Pin, int in2Pin, int in3Pin, int in4Pin, int enaPin, int enbPin);
  
  // Basic movement functions
  void moveForward(int speed = 150);
  void moveBackward(int speed = 150);
  void turnLeft(int speed = 150);
  void turnRight(int speed = 150);
  void stop();
  
  // Differential drive control
  void setSpeeds(int leftSpeed, int rightSpeed);
  void setDirection(MotorDirection direction, int speed = 150);
  
  // Speed control
  void setMaxSpeed(int maxSpeed);
  void setMinSpeed(int minSpeed);
  void adjustSpeed(int deltaSpeed);
  
  // Safety functions
  void enableSafety(bool enable);
  void setCommandTimeout(int timeoutMs);
  void checkSafety();
  
  // Getters
  int getLeftSpeed() const;
  int getRightSpeed() const;
  MotorDirection getCurrentDirection() const;
  bool isMoving() const;
  bool isSafetyEnabled() const;
  
  // Utility functions
  void emergencyStop();
  void coast(); // Let motors coast to stop
  void brake(); // Apply braking
  String getStatus(); // Get formatted status string
  
private:
  // Internal functions
  void updateMotors();
  void setMotorPins(int in1, int in2, int in3, int in4);
  void setMotorSpeeds(int leftSpeed, int rightSpeed);
  int constrainSpeed(int speed);
  bool isCommandValid();
};

#endif // MOTOR_CONTROLLER_H

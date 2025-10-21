/*
 * Camera Stream Module - Header File
 * 
 * This module handles ESP32-CAM video streaming and image capture.
 * Provides MJPEG streaming, image capture, and camera configuration.
 */

#ifndef CAMERA_STREAM_H
#define CAMERA_STREAM_H

#include <Arduino.h>
#include <esp_camera.h>

class CameraStream {
private:
  // Camera configuration
  camera_config_t config;
  bool isInitialized;
  bool isStreaming;
  
  // Stream settings
  int frameSize;
  int jpegQuality;
  int brightness;
  int contrast;
  int saturation;
  
  // Capture settings
  bool autoCapture;
  unsigned long lastCaptureTime;
  int captureInterval;
  
  // Storage
  String storagePath;
  bool saveToSD;
  
public:
  // Constructor
  CameraStream();
  
  // Initialization
  bool begin();
  void end();
  
  // Stream control
  void startStream();
  void stopStream();
  bool isStreaming() const;
  
  // Image capture
  bool captureImage();
  bool captureImage(String filename);
  void setAutoCapture(bool enable, int intervalMs = 5000);
  
  // Camera settings
  void setFrameSize(int size);
  void setJpegQuality(int quality);
  void setBrightness(int brightness);
  void setContrast(int contrast);
  void setSaturation(int saturation);
  
  // Getters
  int getFrameSize() const;
  int getJpegQuality() const;
  int getBrightness() const;
  int getContrast() const;
  int getSaturation() const;
  bool isInitialized() const;
  
  // Utility functions
  void update(); // Call in main loop
  String getStatus();
  bool testCamera();
  
private:
  // Internal functions
  bool initializeCamera();
  void configureCamera();
  bool saveImageToSD(camera_fb_t* fb, String filename);
  String generateFilename();
  void updateAutoCapture();
};

// Camera frame sizes
enum CameraFrameSize {
  FRAMESIZE_96X96 = 0,     // 96x96
  FRAMESIZE_QQVGA = 1,     // 160x120
  FRAMESIZE_QCIF = 2,      // 176x144
  FRAMESIZE_HQVGA = 3,     // 240x176
  FRAMESIZE_240X240 = 4,   // 240x240
  FRAMESIZE_QVGA = 5,      // 320x240
  FRAMESIZE_CIF = 6,       // 400x296
  FRAMESIZE_HVGA = 7,      // 480x320
  FRAMESIZE_VGA = 8,       // 640x480
  FRAMESIZE_SVGA = 9,      // 800x600
  FRAMESIZE_XGA = 10,      // 1024x768
  FRAMESIZE_HD = 11,       // 1280x720
  FRAMESIZE_SXGA = 12,     // 1280x1024
  FRAMESIZE_UXGA = 13      // 1600x1200
};

#endif // CAMERA_STREAM_H

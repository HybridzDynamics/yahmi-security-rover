/*
 * Camera Stream Module - Implementation
 * 
 * This module handles ESP32-CAM video streaming and image capture.
 * Provides MJPEG streaming, image capture, and camera configuration.
 */

#include "camera_stream.h"
#include "storage_manager.h"

CameraStream::CameraStream() {
  isInitialized = false;
  isStreaming = false;
  frameSize = FRAMESIZE_VGA; // 640x480
  jpegQuality = 12; // 0-63, lower is better quality
  brightness = 0; // -2 to 2
  contrast = 0; // -2 to 2
  saturation = 0; // -2 to 2
  autoCapture = false;
  lastCaptureTime = 0;
  captureInterval = 5000; // 5 seconds
  storagePath = "/images/";
  saveToSD = false;
}

bool CameraStream::begin() {
  Serial.println("Initializing camera...");
  
  // Configure camera pins for ESP32-CAM
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = jpegQuality;
  config.fb_count = 2;
  config.fb_size = 0;
  config.grab_mode = CAMERA_GRAB_LATEST;
  
  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  
  // Get camera sensor
  sensor_t* s = esp_camera_sensor_get();
  if (s == NULL) {
    Serial.println("Failed to get camera sensor");
    return false;
  }
  
  // Configure camera settings
  configureCamera();
  
  isInitialized = true;
  Serial.println("Camera initialized successfully");
  return true;
}

void CameraStream::end() {
  if (isInitialized) {
    esp_camera_deinit();
    isInitialized = false;
    isStreaming = false;
    Serial.println("Camera deinitialized");
  }
}

void CameraStream::startStream() {
  if (!isInitialized) {
    Serial.println("Camera not initialized");
    return;
  }
  
  isStreaming = true;
  Serial.println("Camera streaming started");
}

void CameraStream::stopStream() {
  isStreaming = false;
  Serial.println("Camera streaming stopped");
}

bool CameraStream::isStreaming() const {
  return isStreaming;
}

bool CameraStream::captureImage() {
  if (!isInitialized) {
    Serial.println("Camera not initialized");
    return false;
  }
  
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return false;
  }
  
  String filename = generateFilename();
  bool success = saveImageToSD(fb, filename);
  
  esp_camera_fb_return(fb);
  
  if (success) {
    Serial.print("Image captured: ");
    Serial.println(filename);
  }
  
  return success;
}

bool CameraStream::captureImage(String filename) {
  if (!isInitialized) {
    Serial.println("Camera not initialized");
    return false;
  }
  
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return false;
  }
  
  bool success = saveImageToSD(fb, filename);
  
  esp_camera_fb_return(fb);
  
  if (success) {
    Serial.print("Image captured: ");
    Serial.println(filename);
  }
  
  return success;
}

void CameraStream::setAutoCapture(bool enable, int intervalMs) {
  autoCapture = enable;
  captureInterval = intervalMs;
  lastCaptureTime = millis();
  
  Serial.print("Auto capture ");
  Serial.print(enable ? "enabled" : "disabled");
  if (enable) {
    Serial.print(" (interval: ");
    Serial.print(intervalMs);
    Serial.print("ms)");
  }
  Serial.println();
}

void CameraStream::setFrameSize(int size) {
  frameSize = size;
  if (isInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s) {
      s->set_framesize(s, (framesize_t)size);
      Serial.print("Frame size set to: ");
      Serial.println(size);
    }
  }
}

void CameraStream::setJpegQuality(int quality) {
  jpegQuality = constrain(quality, 0, 63);
  if (isInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s) {
      s->set_quality(s, jpegQuality);
      Serial.print("JPEG quality set to: ");
      Serial.println(jpegQuality);
    }
  }
}

void CameraStream::setBrightness(int brightness) {
  this->brightness = constrain(brightness, -2, 2);
  if (isInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s) {
      s->set_brightness(s, this->brightness);
      Serial.print("Brightness set to: ");
      Serial.println(this->brightness);
    }
  }
}

void CameraStream::setContrast(int contrast) {
  this->contrast = constrain(contrast, -2, 2);
  if (isInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s) {
      s->set_contrast(s, this->contrast);
      Serial.print("Contrast set to: ");
      Serial.println(this->contrast);
    }
  }
}

void CameraStream::setSaturation(int saturation) {
  this->saturation = constrain(saturation, -2, 2);
  if (isInitialized) {
    sensor_t* s = esp_camera_sensor_get();
    if (s) {
      s->set_saturation(s, this->saturation);
      Serial.print("Saturation set to: ");
      Serial.println(this->saturation);
    }
  }
}

int CameraStream::getFrameSize() const {
  return frameSize;
}

int CameraStream::getJpegQuality() const {
  return jpegQuality;
}

int CameraStream::getBrightness() const {
  return brightness;
}

int CameraStream::getContrast() const {
  return contrast;
}

int CameraStream::getSaturation() const {
  return saturation;
}

bool CameraStream::isInitialized() const {
  return isInitialized;
}

void CameraStream::update() {
  if (!isInitialized) return;
  
  // Handle auto capture
  if (autoCapture && isStreaming) {
    updateAutoCapture();
  }
}

String CameraStream::getStatus() {
  String status = "Camera: ";
  status += isInitialized ? "Initialized" : "Not initialized";
  status += " (Streaming: ";
  status += isStreaming ? "Yes" : "No";
  status += ", Quality: ";
  status += jpegQuality;
  status += ")";
  
  return status;
}

bool CameraStream::testCamera() {
  if (!isInitialized) {
    Serial.println("Camera not initialized");
    return false;
  }
  
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera test failed - no frame buffer");
    return false;
  }
  
  Serial.print("Camera test successful - Frame size: ");
  Serial.print(fb->width);
  Serial.print("x");
  Serial.print(fb->height);
  Serial.print(", Length: ");
  Serial.print(fb->len);
  Serial.println(" bytes");
  
  esp_camera_fb_return(fb);
  return true;
}

void CameraStream::configureCamera() {
  sensor_t* s = esp_camera_sensor_get();
  if (!s) return;
  
  // Set initial settings
  s->set_framesize(s, (framesize_t)frameSize);
  s->set_quality(s, jpegQuality);
  s->set_brightness(s, brightness);
  s->set_contrast(s, contrast);
  s->set_saturation(s, saturation);
  
  // Additional settings
  s->set_whitebal(s, 1); // Auto white balance
  s->set_awb_gain(s, 1); // Auto white balance gain
  s->set_wb_mode(s, 0); // White balance mode
  s->set_exposure_ctrl(s, 1); // Auto exposure
  s->set_aec2(s, 0); // Automatic exposure control
  s->set_ae_level(s, 0); // Auto exposure level
  s->set_aec_value(s, 300); // Auto exposure value
  s->set_gain_ctrl(s, 1); // Auto gain control
  s->set_agc_gain(s, 0); // Auto gain control gain
  s->set_gainceiling(s, (gainceiling_t)0); // Gain ceiling
  s->set_bpc(s, 0); // Black pixel correction
  s->set_wpc(s, 1); // White pixel correction
  s->set_raw_gma(s, 1); // Raw gamma
  s->set_lenc(s, 1); // Lens correction
  s->set_hmirror(s, 0); // Horizontal mirror
  s->set_vflip(s, 0); // Vertical flip
  s->set_dcw(s, 1); // Downsize enable
  s->set_colorbar(s, 0); // Color bar test pattern
}

bool CameraStream::saveImageToSD(camera_fb_t* fb, String filename) {
  if (!saveToSD) {
    // Just return true if not saving to SD
    return true;
  }
  
  // This would integrate with StorageManager
  // For now, just return true
  return true;
}

String CameraStream::generateFilename() {
  String filename = storagePath;
  filename += "img_";
  filename += millis();
  filename += ".jpg";
  return filename;
}

void CameraStream::updateAutoCapture() {
  if (millis() - lastCaptureTime >= captureInterval) {
    captureImage();
    lastCaptureTime = millis();
  }
}

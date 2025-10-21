/*
 * Audio Manager Module - Implementation
 * 
 * This module handles both audio input (microphone) and output (speaker).
 * Provides audio capture, playback, and system sound management.
 */

#include "audio_manager.h"

AudioManager::AudioManager() {
  speakerPin = -1;
  micPin = -1;
  micInitialized = false;
  speakerInitialized = false;
  sampleRate = 16000;
  bitDepth = 16;
  bufferSize = 1024;
  isCapturing = false;
  lastCaptureTime = 0;
  captureInterval = 100; // 100ms intervals
  isPlaying = false;
  playStartTime = 0;
  playDuration = 0;
  systemSoundsEnabled = true;
  masterVolume = 50;
}

void AudioManager::begin(int speakerPin, int micPin) {
  this->speakerPin = speakerPin;
  this->micPin = micPin;
  
  // Initialize speaker
  speakerInitialized = initializeSpeaker();
  
  // Initialize microphone
  micInitialized = initializeMicrophone();
  
  if (speakerInitialized) {
    Serial.print("Speaker initialized on pin ");
    Serial.println(speakerPin);
  }
  
  if (micInitialized) {
    Serial.print("Microphone initialized on pin ");
    Serial.println(micPin);
  }
}

void AudioManager::end() {
  if (isCapturing) {
    stopCapture();
  }
  
  if (isPlaying) {
    stop();
  }
  
  if (micInitialized) {
    i2s_driver_uninstall(I2S_NUM_0);
    micInitialized = false;
  }
  
  speakerInitialized = false;
  Serial.println("Audio manager deinitialized");
}

void AudioManager::playSystemSound(SystemSound sound) {
  if (!systemSoundsEnabled || !speakerInitialized) return;
  
  playSystemSoundInternal(sound);
}

void AudioManager::playTone(int frequency, int duration) {
  if (!speakerInitialized) return;
  
  speaker.playTone(frequency, duration);
  isPlaying = true;
  playStartTime = millis();
  playDuration = duration;
}

void AudioManager::setVolume(int volume) {
  masterVolume = constrain(volume, 0, 100);
  if (speakerInitialized) {
    speaker.setVolume(masterVolume);
  }
  Serial.print("Master volume set to: ");
  Serial.println(masterVolume);
}

void AudioManager::stop() {
  if (speakerInitialized) {
    speaker.stop();
  }
  isPlaying = false;
  playStartTime = 0;
  playDuration = 0;
}

bool AudioManager::startCapture() {
  if (!micInitialized) {
    Serial.println("Microphone not initialized");
    return false;
  }
  
  if (isCapturing) {
    Serial.println("Already capturing audio");
    return true;
  }
  
  // Start I2S driver
  esp_err_t err = i2s_driver_install(I2S_NUM_0, &i2sConfig, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("I2S driver install failed: %d\n", err);
    return false;
  }
  
  // Set I2S pins
  err = i2s_set_pin(I2S_NUM_0, &i2sPinConfig);
  if (err != ESP_OK) {
    Serial.printf("I2S set pin failed: %d\n", err);
    return false;
  }
  
  isCapturing = true;
  lastCaptureTime = millis();
  Serial.println("Audio capture started");
  return true;
}

void AudioManager::stopCapture() {
  if (!isCapturing) return;
  
  i2s_driver_uninstall(I2S_NUM_0);
  isCapturing = false;
  lastCaptureTime = 0;
  Serial.println("Audio capture stopped");
}

bool AudioManager::isCapturing() const {
  return isCapturing;
}

int AudioManager::captureAudio(uint8_t* buffer, int maxLength) {
  if (!isCapturing || !micInitialized) return 0;
  
  size_t bytesRead = 0;
  esp_err_t err = i2s_read(I2S_NUM_0, buffer, maxLength, &bytesRead, portMAX_DELAY);
  
  if (err != ESP_OK) {
    Serial.printf("I2S read failed: %d\n", err);
    return 0;
  }
  
  return bytesRead;
}

void AudioManager::setSampleRate(int rate) {
  sampleRate = rate;
  configureI2S();
  Serial.print("Sample rate set to: ");
  Serial.println(sampleRate);
}

void AudioManager::setBitDepth(int bits) {
  bitDepth = bits;
  configureI2S();
  Serial.print("Bit depth set to: ");
  Serial.println(bitDepth);
}

void AudioManager::setMasterVolume(int volume) {
  masterVolume = constrain(volume, 0, 100);
  if (speakerInitialized) {
    speaker.setVolume(masterVolume);
  }
  Serial.print("Master volume set to: ");
  Serial.println(masterVolume);
}

void AudioManager::enableSystemSounds(bool enable) {
  systemSoundsEnabled = enable;
  Serial.print("System sounds ");
  Serial.println(enable ? "enabled" : "disabled");
}

int AudioManager::getSampleRate() const {
  return sampleRate;
}

int AudioManager::getBitDepth() const {
  return bitDepth;
}

int AudioManager::getMasterVolume() const {
  return masterVolume;
}

bool AudioManager::isSystemSoundsEnabled() const {
  return systemSoundsEnabled;
}

bool AudioManager::isPlaying() const {
  return isPlaying;
}

void AudioManager::update() {
  // Update speaker
  if (speakerInitialized) {
    speaker.update();
  }
  
  // Check if playback has finished
  if (isPlaying && playStartTime > 0) {
    if (millis() - playStartTime >= playDuration) {
      isPlaying = false;
      playStartTime = 0;
      playDuration = 0;
    }
  }
  
  // Handle audio capture timing
  if (isCapturing && micInitialized) {
    if (millis() - lastCaptureTime >= captureInterval) {
      // Process captured audio here
      lastCaptureTime = millis();
    }
  }
}

String AudioManager::getStatus() {
  String status = "Audio: ";
  status += speakerInitialized ? "Speaker OK" : "Speaker Error";
  status += ", ";
  status += micInitialized ? "Mic OK" : "Mic Error";
  status += " (Vol: ";
  status += masterVolume;
  status += "%)";
  
  return status;
}

bool AudioManager::testAudio() {
  if (!speakerInitialized) {
    Serial.println("Speaker not initialized");
    return false;
  }
  
  // Test speaker with a simple tone
  playTone(1000, 500);
  delay(600);
  
  // Test microphone if available
  if (micInitialized) {
    uint8_t testBuffer[256];
    int bytesRead = captureAudio(testBuffer, 256);
    if (bytesRead > 0) {
      Serial.print("Microphone test successful - captured ");
      Serial.print(bytesRead);
      Serial.println(" bytes");
    } else {
      Serial.println("Microphone test failed");
      return false;
    }
  }
  
  Serial.println("Audio test completed");
  return true;
}

bool AudioManager::initializeMicrophone() {
  configureI2S();
  
  // Test I2S configuration
  esp_err_t err = i2s_driver_install(I2S_NUM_0, &i2sConfig, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("I2S driver install failed: %d\n", err);
    return false;
  }
  
  err = i2s_set_pin(I2S_NUM_0, &i2sPinConfig);
  if (err != ESP_OK) {
    Serial.printf("I2S set pin failed: %d\n", err);
    i2s_driver_uninstall(I2S_NUM_0);
    return false;
  }
  
  // Uninstall for now, will be installed when capture starts
  i2s_driver_uninstall(I2S_NUM_0);
  return true;
}

bool AudioManager::initializeSpeaker() {
  speaker.begin(speakerPin, 100);
  speaker.setVolume(masterVolume);
  return true;
}

void AudioManager::configureI2S() {
  // Configure I2S
  i2sConfig.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX);
  i2sConfig.sample_rate = sampleRate;
  i2sConfig.bits_per_sample = (i2s_bits_per_sample_t)bitDepth;
  i2sConfig.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
  i2sConfig.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  i2sConfig.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
  i2sConfig.dma_buf_count = 4;
  i2sConfig.dma_buf_len = bufferSize;
  i2sConfig.use_apll = true;
  i2sConfig.tx_desc_auto_clear = true;
  i2sConfig.fixed_mclk = 0;
  
  // Configure I2S pins
  i2sPinConfig.bck_io_num = 26; // BCK pin
  i2sPinConfig.ws_io_num = 25;  // WS pin
  i2sPinConfig.data_out_num = I2S_PIN_NO_CHANGE;
  i2sPinConfig.data_in_num = micPin; // Data input pin
}

void AudioManager::playSystemSoundInternal(SystemSound sound) {
  if (!speakerInitialized) return;
  
  switch (sound) {
    case SOUND_POWER_ON:
      speaker.playPowerOn();
      break;
    case SOUND_POWER_OFF:
      speaker.playPowerOff();
      break;
    case SOUND_ALERT:
      speaker.playAlert();
      break;
    case SOUND_SIREN:
      speaker.playSiren();
      break;
  }
  
  isPlaying = true;
  playStartTime = millis();
  playDuration = 1000; // Assume 1 second for system sounds
}

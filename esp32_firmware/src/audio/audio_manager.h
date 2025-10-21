/*
 * Audio Manager Module - Header File
 * 
 * This module handles both audio input (microphone) and output (speaker).
 * Provides audio capture, playback, and system sound management.
 */

#ifndef AUDIO_MANAGER_H
#define AUDIO_MANAGER_H

#include <Arduino.h>
#include <driver/i2s.h>
#include "speaker.h"

class AudioManager {
private:
  // Hardware pins
  int speakerPin;
  int micPin;
  
  // Audio components
  Speaker speaker;
  bool micInitialized;
  bool speakerInitialized;
  
  // Microphone settings
  i2s_config_t i2sConfig;
  i2s_pin_config_t i2sPinConfig;
  int sampleRate;
  int bitDepth;
  int bufferSize;
  
  // Audio capture
  bool isCapturing;
  unsigned long lastCaptureTime;
  int captureInterval;
  
  // Audio playback
  bool isPlaying;
  unsigned long playStartTime;
  unsigned long playDuration;
  
  // System sounds
  bool systemSoundsEnabled;
  int masterVolume;
  
public:
  // Constructor
  AudioManager();
  
  // Initialization
  void begin(int speakerPin, int micPin);
  void end();
  
  // Speaker control
  void playSystemSound(SystemSound sound);
  void playTone(int frequency, int duration);
  void setVolume(int volume);
  void stop();
  
  // Microphone control
  bool startCapture();
  void stopCapture();
  bool isCapturing() const;
  int captureAudio(uint8_t* buffer, int maxLength);
  
  // Audio settings
  void setSampleRate(int rate);
  void setBitDepth(int bits);
  void setMasterVolume(int volume);
  void enableSystemSounds(bool enable);
  
  // Getters
  int getSampleRate() const;
  int getBitDepth() const;
  int getMasterVolume() const;
  bool isSystemSoundsEnabled() const;
  bool isPlaying() const;
  
  // Utility functions
  void update(); // Call in main loop
  String getStatus();
  bool testAudio();
  
private:
  // Internal functions
  bool initializeMicrophone();
  bool initializeSpeaker();
  void configureI2S();
  void playSystemSoundInternal(SystemSound sound);
};

// Audio quality settings
enum AudioQuality {
  QUALITY_LOW = 0,    // 8kHz, 8-bit
  QUALITY_MEDIUM = 1, // 16kHz, 16-bit
  QUALITY_HIGH = 2    // 44.1kHz, 16-bit
};

#endif // AUDIO_MANAGER_H

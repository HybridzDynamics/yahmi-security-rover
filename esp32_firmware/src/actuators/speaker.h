/*
 * Speaker Module - Header File
 * 
 * This module handles audio output through a speaker or buzzer.
 * Supports system sounds, alerts, and audio playback.
 */

#ifndef SPEAKER_H
#define SPEAKER_H

#include <Arduino.h>

class Speaker {
private:
  int pin;
  bool isActive;
  int currentVolume;
  int maxVolume;
  
  // Audio playback
  bool isPlaying;
  unsigned long playStartTime;
  unsigned long playDuration;
  
  // System sounds
  struct SystemSound {
    int frequency;
    int duration;
    int pause;
  };
  
  SystemSound systemSounds[4];
  
public:
  // Constructor
  Speaker();
  
  // Initialization
  void begin(int speakerPin, int maxVol = 100);
  
  // Basic audio functions
  void playTone(int frequency, int duration);
  void playTone(int frequency, int duration, int pause);
  void stop();
  void setVolume(int volume);
  
  // System sounds
  void playSystemSound(SystemSound sound);
  void playPowerOn();
  void playPowerOff();
  void playAlert();
  void playSiren();
  
  // Audio control
  void update(); // Call in main loop
  bool isPlaying() const;
  int getVolume() const;
  int getMaxVolume() const;
  
  // Utility functions
  void beep(int count = 1, int frequency = 1000, int duration = 100);
  void playMelody(int* notes, int* durations, int length);
  String getStatus();
  
private:
  // Internal functions
  void initializeSystemSounds();
  void playNote(int frequency, int duration);
  void playPause(int duration);
};

#endif // SPEAKER_H

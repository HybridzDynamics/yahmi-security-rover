/*
 * Speaker Module - Implementation
 * 
 * This module handles audio output through a speaker or buzzer.
 * Provides system sounds, alerts, and audio playback capabilities.
 */

#include "speaker.h"

Speaker::Speaker() {
  pin = -1;
  isActive = false;
  currentVolume = 50;
  maxVolume = 100;
  isPlaying = false;
  playStartTime = 0;
  playDuration = 0;
  
  // Initialize system sounds
  initializeSystemSounds();
}

void Speaker::begin(int speakerPin, int maxVol) {
  pin = speakerPin;
  maxVolume = maxVol;
  
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  
  isActive = true;
  
  Serial.print("Speaker initialized on pin ");
  Serial.print(pin);
  Serial.print(" (Max volume: ");
  Serial.print(maxVolume);
  Serial.println(")");
}

void Speaker::playTone(int frequency, int duration) {
  if (!isActive || pin == -1) return;
  
  // Calculate PWM values for frequency
  int period = 1000000 / frequency; // Period in microseconds
  int highTime = period / 2;
  int lowTime = period / 2;
  
  // Apply volume scaling
  int scaledHighTime = (highTime * currentVolume) / maxVolume;
  
  // Generate tone
  unsigned long startTime = micros();
  while (micros() - startTime < duration * 1000) {
    digitalWrite(pin, HIGH);
    delayMicroseconds(scaledHighTime);
    digitalWrite(pin, LOW);
    delayMicroseconds(lowTime);
  }
  
  digitalWrite(pin, LOW);
}

void Speaker::playTone(int frequency, int duration, int pause) {
  playTone(frequency, duration);
  if (pause > 0) {
    delay(pause);
  }
}

void Speaker::stop() {
  if (pin != -1) {
    digitalWrite(pin, LOW);
  }
  isPlaying = false;
  playStartTime = 0;
  playDuration = 0;
}

void Speaker::setVolume(int volume) {
  currentVolume = constrain(volume, 0, maxVolume);
  Serial.print("Speaker volume set to: ");
  Serial.println(currentVolume);
}

void Speaker::playSystemSound(SystemSound sound) {
  if (!isActive) return;
  
  isPlaying = true;
  playStartTime = millis();
  playDuration = sound.duration + sound.pause;
  
  playTone(sound.frequency, sound.duration);
  if (sound.pause > 0) {
    delay(sound.pause);
  }
  
  isPlaying = false;
}

void Speaker::playPowerOn() {
  Serial.println("Playing power on sound");
  playSystemSound(systemSounds[SOUND_POWER_ON]);
}

void Speaker::playPowerOff() {
  Serial.println("Playing power off sound");
  playSystemSound(systemSounds[SOUND_POWER_OFF]);
}

void Speaker::playAlert() {
  Serial.println("Playing alert sound");
  playSystemSound(systemSounds[SOUND_ALERT]);
}

void Speaker::playSiren() {
  Serial.println("Playing siren sound");
  playSystemSound(systemSounds[SOUND_SIREN]);
}

void Speaker::update() {
  if (!isActive || !isPlaying) return;
  
  // Check if current sound has finished playing
  if (millis() - playStartTime >= playDuration) {
    isPlaying = false;
    playStartTime = 0;
    playDuration = 0;
  }
}

bool Speaker::isPlaying() const {
  return isPlaying;
}

int Speaker::getVolume() const {
  return currentVolume;
}

int Speaker::getMaxVolume() const {
  return maxVolume;
}

void Speaker::beep(int count, int frequency, int duration) {
  for (int i = 0; i < count; i++) {
    playTone(frequency, duration);
    if (i < count - 1) {
      delay(50); // Short pause between beeps
    }
  }
}

void Speaker::playMelody(int* notes, int* durations, int length) {
  for (int i = 0; i < length; i++) {
    if (notes[i] > 0) {
      playTone(notes[i], durations[i]);
    } else {
      delay(durations[i]); // Rest
    }
    delay(30); // Pause between notes
  }
}

String Speaker::getStatus() {
  String status = "Speaker: ";
  status += isActive ? "Active" : "Inactive";
  status += " (Vol: ";
  status += currentVolume;
  status += "/";
  status += maxVolume;
  status += ")";
  
  return status;
}

void Speaker::initializeSystemSounds() {
  // Power on sound: ascending tone
  systemSounds[SOUND_POWER_ON].frequency = 800;
  systemSounds[SOUND_POWER_ON].duration = 200;
  systemSounds[SOUND_POWER_ON].pause = 100;
  
  // Power off sound: descending tone
  systemSounds[SOUND_POWER_OFF].frequency = 600;
  systemSounds[SOUND_POWER_OFF].duration = 300;
  systemSounds[SOUND_POWER_OFF].pause = 0;
  
  // Alert sound: rapid beeps
  systemSounds[SOUND_ALERT].frequency = 1000;
  systemSounds[SOUND_ALERT].duration = 100;
  systemSounds[SOUND_ALERT].pause = 50;
  
  // Siren sound: alternating tones
  systemSounds[SOUND_SIREN].frequency = 800;
  systemSounds[SOUND_SIREN].duration = 500;
  systemSounds[SOUND_SIREN].pause = 200;
}

void Speaker::playNote(int frequency, int duration) {
  playTone(frequency, duration);
}

void Speaker::playPause(int duration) {
  delay(duration);
}

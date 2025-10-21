# Smart Surveillance Car - Hardware Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Component Specifications](#component-specifications)
3. [Wiring Diagram](#wiring-diagram)
4. [Power System](#power-system)
5. [Assembly Instructions](#assembly-instructions)
6. [Testing Procedures](#testing-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

## System Overview

The Smart Surveillance Car system consists of several interconnected components:

- **ESP32 Main Controller**: Central processing unit
- **ESP32-CAM**: Video streaming module
- **Sensor Array**: Obstacle detection and navigation
- **Motor System**: Movement and control
- **Audio System**: Sound output and input
- **Power Management**: Battery monitoring and supply
- **Storage**: Local data storage (optional)

## Component Specifications

### ESP32 Development Board
- **Model**: ESP32-DevKitC or similar
- **CPU**: Dual-core 32-bit LX6 microprocessor
- **Clock Speed**: 240 MHz
- **Memory**: 520 KB SRAM, 4 MB Flash
- **WiFi**: 802.11 b/g/n
- **Bluetooth**: 4.2 BR/EDR and BLE
- **GPIO**: 34 digital pins
- **ADC**: 12-bit, 18 channels
- **DAC**: 8-bit, 2 channels
- **Power**: 3.3V, 500mA

### ESP32-CAM Module
- **Model**: ESP32-CAM or similar
- **Camera**: OV2640 2MP
- **Resolution**: Up to 1600x1200
- **Video Format**: MJPEG
- **GPIO**: 9 pins available
- **Power**: 5V, 200mA
- **Storage**: MicroSD card slot

### IR Sensors
- **Model**: TCRT5000 or similar
- **Detection Range**: 2-30 cm
- **Response Time**: < 1 ms
- **Power**: 5V, 20mA
- **Output**: Digital (0/1) or Analog (0-1023)
- **Quantity**: 3 units

### Ultrasonic Sensor
- **Model**: HC-SR04
- **Range**: 2-400 cm
- **Accuracy**: ±3 mm
- **Angle**: 15°
- **Power**: 5V, 15mA
- **Trigger**: 10μs pulse
- **Echo**: 150μs - 25ms pulse

### Motor Driver
- **Model**: L298N
- **Voltage**: 5-35V
- **Current**: 2A per channel
- **Channels**: 2 (dual H-bridge)
- **Control**: PWM + Direction
- **Power**: 5V, 20mA

### DC Motors
- **Type**: Geared DC motors
- **Voltage**: 6V-12V
- **Speed**: 200-300 RPM
- **Torque**: 2-5 kg-cm
- **Current**: 200-500mA
- **Quantity**: 2 units

### Speaker
- **Type**: Piezo buzzer or speaker
- **Impedance**: 8Ω
- **Power**: 0.5W
- **Frequency**: 2-4 kHz
- **Voltage**: 3-12V

### Battery
- **Type**: Li-Po battery pack
- **Voltage**: 7.4V (2S) or 11.1V (3S)
- **Capacity**: 2000-5000mAh
- **Discharge Rate**: 20C
- **Connector**: XT60 or similar

### Voltage Divider
- **Resistors**: 10kΩ + 20kΩ
- **Ratio**: 1:3 (for 3S battery)
- **Accuracy**: ±1%
- **Power**: 0.1W

## Wiring Diagram

### ESP32 Pin Assignments
```
ESP32 Pin    Component
--------     ---------
GPIO 34      IR Sensor 1 (Left)
GPIO 35      IR Sensor 2 (Center)
GPIO 36      IR Sensor 3 (Right)
GPIO 32      Ultrasonic Trigger
GPIO 33      Ultrasonic Echo
GPIO 25      Motor 1 IN1
GPIO 26      Motor 1 IN2
GPIO 27      Motor 2 IN3
GPIO 14      Motor 2 IN4
GPIO 12      Motor 1 ENA (PWM)
GPIO 13      Motor 2 ENB (PWM)
GPIO 2       Speaker
GPIO 4       Microphone
GPIO 39      Battery Voltage (ADC)
GPIO 5       SD Card CS
GPIO 18      SD Card SCK
GPIO 19      SD Card MISO
GPIO 23      SD Card MOSI
```

### ESP32-CAM Pin Assignments
```
ESP32-CAM Pin    Function
-------------    --------
GPIO 0           Camera Reset
GPIO 1           Camera PWDN
GPIO 2           Camera XCLK
GPIO 3           Camera PCLK
GPIO 4           Camera D0
GPIO 5           Camera D1
GPIO 6           Camera D2
GPIO 7           Camera D3
GPIO 8           Camera D4
GPIO 9           Camera D5
GPIO 10          Camera D6
GPIO 11          Camera D7
GPIO 12          Camera VSYNC
GPIO 13          Camera HREF
GPIO 14          Camera SIOD
GPIO 15          Camera SIOC
```

### Power Distribution
```
Battery (+) ---- Voltage Divider ---- ESP32 ADC
     |
     +---- Motor Driver VCC
     |
     +---- ESP32-CAM VCC
     |
     +---- Sensor Array VCC
     |
     +---- Speaker VCC

Battery (-) ---- Common Ground
```

## Power System

### Power Requirements
- **ESP32**: 3.3V, 500mA
- **ESP32-CAM**: 5V, 200mA
- **Motors**: 6-12V, 1A (peak)
- **Sensors**: 5V, 100mA
- **Speaker**: 3-12V, 50mA
- **Total**: ~2A peak, 500mA average

### Battery Selection
- **7.4V 2S Li-Po**: 2000-3000mAh
- **11.1V 3S Li-Po**: 3000-5000mAh
- **Runtime**: 2-4 hours continuous
- **Charging**: Balance charger required

### Power Management
- **Voltage Regulator**: 5V, 3A (for ESP32-CAM)
- **Voltage Divider**: 1:3 ratio for battery monitoring
- **Power Switch**: Main power control
- **Low Battery Protection**: Software-based warning

## Assembly Instructions

### Step 1: Prepare Components
1. Gather all required components
2. Check component specifications
3. Prepare tools and materials
4. Create assembly workspace

### Step 2: Mount ESP32
1. Install ESP32 on breadboard or PCB
2. Connect power and ground rails
3. Install pull-up resistors where needed
4. Secure with standoffs

### Step 3: Install ESP32-CAM
1. Mount ESP32-CAM module
2. Connect power and ground
3. Install camera lens
4. Secure mounting

### Step 4: Connect Sensors
1. Install IR sensors on front of car
2. Mount ultrasonic sensor
3. Connect to ESP32 GPIO pins
4. Test sensor readings

### Step 5: Install Motor System
1. Mount motor driver board
2. Connect motors to driver
3. Wire control signals to ESP32
4. Install wheels and chassis

### Step 6: Add Audio System
1. Install speaker/buzzer
2. Connect to ESP32 GPIO
3. Test audio output
4. Secure mounting

### Step 7: Power System
1. Install battery compartment
2. Connect voltage divider
3. Install power switch
4. Wire power distribution

### Step 8: Final Assembly
1. Install all components in chassis
2. Route and secure cables
3. Install protective covers
4. Perform final testing

## Testing Procedures

### Pre-Assembly Testing
1. **ESP32 Test**
   - Upload blink sketch
   - Verify GPIO functionality
   - Test WiFi connection
   - Check power consumption

2. **ESP32-CAM Test**
   - Upload camera test sketch
   - Verify video streaming
   - Test image capture
   - Check power requirements

3. **Sensor Testing**
   - Test IR sensor readings
   - Verify ultrasonic distance
   - Check analog readings
   - Test response times

4. **Motor Testing**
   - Test motor rotation
   - Verify speed control
   - Check direction control
   - Test current draw

### Post-Assembly Testing
1. **Power System Test**
   - Check battery voltage
   - Verify power distribution
   - Test voltage divider
   - Check current consumption

2. **Communication Test**
   - Test WiFi connection
   - Verify WebSocket communication
   - Check data transmission
   - Test error handling

3. **Functionality Test**
   - Test manual control
   - Verify autonomous mode
   - Check obstacle detection
   - Test audio output

4. **Integration Test**
   - Test complete system
   - Verify all features
   - Check performance
   - Test reliability

## Troubleshooting

### Common Issues

#### Power Problems
- **Symptom**: System won't start
- **Cause**: Low battery, loose connections
- **Solution**: Check battery voltage, secure connections

#### Sensor Issues
- **Symptom**: Incorrect readings
- **Cause**: Loose connections, dirty sensors
- **Solution**: Check wiring, clean sensor lenses

#### Motor Problems
- **Symptom**: Motors not responding
- **Cause**: Loose connections, driver issues
- **Solution**: Check wiring, test driver board

#### Communication Issues
- **Symptom**: Can't connect to system
- **Cause**: WiFi problems, IP conflicts
- **Solution**: Check WiFi settings, restart system

### Diagnostic Tools
- **Multimeter**: Voltage and current measurements
- **Oscilloscope**: Signal analysis
- **Serial Monitor**: Debug output
- **Network Analyzer**: WiFi diagnostics

### Error Codes
- **E001**: Power supply error
- **E002**: Sensor communication error
- **E003**: Motor driver error
- **E004**: Camera initialization error
- **E005**: WiFi connection error

## Maintenance

### Regular Maintenance
1. **Weekly**
   - Check battery voltage
   - Clean sensor lenses
   - Inspect connections
   - Test functionality

2. **Monthly**
   - Clean all components
   - Check for wear
   - Update firmware
   - Calibrate sensors

3. **Quarterly**
   - Replace worn parts
   - Update software
   - Check power system
   - Perform full testing

### Preventive Measures
- Use quality components
- Proper installation
- Regular cleaning
- Timely updates
- Proper storage

### Replacement Parts
- **Battery**: Every 6-12 months
- **Motors**: Every 1-2 years
- **Sensors**: As needed
- **Cables**: As needed
- **Wheels**: As needed

### Storage
- Remove battery when not in use
- Store in dry, cool place
- Protect from dust and moisture
- Regular maintenance checks

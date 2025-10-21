#!/usr/bin/env python3
"""
Raspberry Pi Surveillance Car Firmware
Complete Python implementation for Raspberry Pi control
"""

import asyncio
import json
import logging
import os
import sys
import time
import threading
from datetime import datetime
from typing import Dict, Any, Optional
import signal
import subprocess

# Hardware control libraries
try:
    import RPi.GPIO as GPIO
    from gpiozero import Motor, LED, Button, DistanceSensor
    from gpiozero.pins.pigpio import PiGPIOFactory
    import picamera
    import pyaudio
    import numpy as np
    import cv2
    from flask import Flask, request, jsonify, Response
    from flask_socketio import SocketIO, emit
    import requests
    import websocket
    from threading import Thread
    import queue
except ImportError as e:
    print(f"Missing required library: {e}")
    print("Please install required packages:")
    print("pip install RPi.GPIO gpiozero picamera pyaudio numpy opencv-python flask flask-socketio requests websocket-client")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('surveillance_car.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SurveillanceCar:
    """Main surveillance car control class for Raspberry Pi"""
    
    def __init__(self):
        self.running = False
        self.mode = 'manual'
        self.ai_enabled = False
        self.patrol_enabled = False
        self.emergency_stop = False
        
        # Hardware configuration
        self.setup_gpio()
        self.setup_motors()
        self.setup_sensors()
        self.setup_camera()
        self.setup_audio()
        
        # System data
        self.system_data = {
            'battery_level': 100,
            'battery_voltage': 12.0,
            'cpu_temp': 0,
            'cpu_usage': 0,
            'memory_usage': 0,
            'disk_usage': 0,
            'wifi_signal': -50,
            'wifi_ssid': 'Unknown',
            'ip_address': '0.0.0.0',
            'uptime': 0,
            'free_heap': 0
        }
        
        self.sensor_data = {
            'ir_sensors': [0, 0, 0],
            'ultrasonic_distance': 0,
            'obstacle_detected': False,
            'left_motor_speed': 0,
            'right_motor_speed': 0,
            'motor_direction': 'stop'
        }
        
        # Web server
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'surveillance_car_secret'
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")
        self.setup_routes()
        
        # WebSocket client for backend connection
        self.ws_client = None
        self.backend_url = os.getenv('BACKEND_URL', 'ws://localhost:3000')
        
        # Data queues
        self.sensor_queue = queue.Queue()
        self.command_queue = queue.Queue()
        
        # Threads
        self.sensor_thread = None
        self.camera_thread = None
        self.websocket_thread = None
        self.ai_thread = None
        
        # AI Detection
        self.detection_history = []
        self.last_detection = None
        
        # Patrol mode
        self.patrol_route = []
        self.patrol_index = 0
        self.patrol_speed = 100
        
        logger.info("Surveillance Car initialized")
    
    def setup_gpio(self):
        """Setup GPIO pins"""
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            logger.info("GPIO setup complete")
        except Exception as e:
            logger.error(f"GPIO setup failed: {e}")
    
    def setup_motors(self):
        """Setup motor control"""
        try:
            # Motor pins (adjust according to your wiring)
            self.left_motor = Motor(forward=18, backward=23, enable=24)
            self.right_motor = Motor(forward=25, backward=12, enable=16)
            
            # Motor LEDs
            self.left_motor_led = LED(20)
            self.right_motor_led = LED(21)
            
            logger.info("Motors setup complete")
        except Exception as e:
            logger.error(f"Motor setup failed: {e}")
            self.left_motor = None
            self.right_motor = None
    
    def setup_sensors(self):
        """Setup sensors"""
        try:
            # IR sensors
            self.ir_left = Button(5, pull_up=True)
            self.ir_center = Button(6, pull_up=True)
            self.ir_right = Button(13, pull_up=True)
            
            # Ultrasonic sensor
            self.ultrasonic = DistanceSensor(echo=17, trigger=27)
            
            # Battery monitoring
            self.battery_monitor = Button(22, pull_up=True)
            
            logger.info("Sensors setup complete")
        except Exception as e:
            logger.error(f"Sensor setup failed: {e}")
    
    def setup_camera(self):
        """Setup camera"""
        try:
            self.camera = picamera.PiCamera()
            self.camera.resolution = (640, 480)
            self.camera.framerate = 30
            self.camera.rotation = 0
            
            # Camera settings
            self.camera.brightness = 50
            self.camera.contrast = 0
            self.camera.saturation = 0
            
            logger.info("Camera setup complete")
        except Exception as e:
            logger.error(f"Camera setup failed: {e}")
            self.camera = None
    
    def setup_audio(self):
        """Setup audio system"""
        try:
            self.audio = pyaudio.PyAudio()
            self.audio_format = pyaudio.paInt16
            self.audio_channels = 1
            self.audio_rate = 44100
            self.audio_chunk = 1024
            
            # Speaker control
            self.speaker_enable = LED(26)
            
            logger.info("Audio setup complete")
        except Exception as e:
            logger.error(f"Audio setup failed: {e}")
    
    def setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/')
        def index():
            return jsonify({
                'status': 'Surveillance Car API',
                'version': '1.0.0',
                'device': 'raspberry_pi',
                'timestamp': datetime.now().isoformat()
            })
        
        @self.app.route('/api/status')
        def get_status():
            return jsonify(self.system_data)
        
        @self.app.route('/api/sensors')
        def get_sensors():
            return jsonify(self.sensor_data)
        
        @self.app.route('/api/control', methods=['POST'])
        def control():
            try:
                data = request.get_json()
                command = data.get('command')
                action = data.get('action')
                value = data.get('value')
                
                self.handle_command(command, action, value)
                
                return jsonify({'success': True, 'message': 'Command executed'})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 400
        
        @self.app.route('/api/camera/stream')
        def camera_stream():
            def generate_frames():
                while self.running:
                    try:
                        if self.camera:
                            # Capture frame
                            frame = np.empty((480, 640, 3), dtype=np.uint8)
                            self.camera.capture(frame, format='bgr')
                            
                            # Encode frame
                            ret, buffer = cv2.imencode('.jpg', frame)
                            if ret:
                                frame_bytes = buffer.tobytes()
                                yield (b'--frame\r\n'
                                      b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    except Exception as e:
                        logger.error(f"Camera stream error: {e}")
                        break
                    time.sleep(0.033)  # ~30 FPS
            
            return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
        
        @self.app.route('/api/data')
        def get_data():
            return jsonify({
                'sensors': self.sensor_data,
                'system': self.system_data,
                'timestamp': datetime.now().isoformat()
            })
        
        @self.app.route('/api/config', methods=['GET', 'POST'])
        def config():
            if request.method == 'GET':
                return jsonify({
                    'camera_quality': getattr(self.camera, 'quality', 12) if self.camera else 12,
                    'camera_brightness': getattr(self.camera, 'brightness', 50) if self.camera else 50,
                    'camera_contrast': getattr(self.camera, 'contrast', 0) if self.camera else 0,
                    'ai_enabled': self.ai_enabled,
                    'patrol_enabled': self.patrol_enabled,
                    'mode': self.mode
                })
            else:
                data = request.get_json()
                if 'camera_quality' in data and self.camera:
                    self.camera.quality = data['camera_quality']
                if 'camera_brightness' in data and self.camera:
                    self.camera.brightness = data['camera_brightness']
                if 'camera_contrast' in data and self.camera:
                    self.camera.contrast = data['camera_contrast']
                if 'ai_enabled' in data:
                    self.ai_enabled = data['ai_enabled']
                if 'patrol_enabled' in data:
                    self.patrol_enabled = data['patrol_enabled']
                if 'mode' in data:
                    self.mode = data['mode']
                return jsonify({'success': True})
        
        @self.app.route('/api/system/restart', methods=['POST'])
        def restart_system():
            try:
                subprocess.run(['sudo', 'reboot'], check=True)
                return jsonify({'success': True, 'message': 'System restart initiated'})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/audio/play', methods=['POST'])
        def play_audio():
            try:
                data = request.get_json()
                sound_type = data.get('type', 'alert')
                
                if sound_type == 'alert':
                    self.play_alert()
                elif sound_type == 'siren':
                    self.play_siren()
                elif sound_type == 'low_pitch':
                    self.play_low_pitch()
                
                return jsonify({'success': True, 'message': f'Playing {sound_type} sound'})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/camera/capture', methods=['POST'])
        def capture_image():
            try:
                if self.camera:
                    filename = f"capture_{int(time.time())}.jpg"
                    filepath = f"captures/{filename}"
                    
                    # Create captures directory if it doesn't exist
                    os.makedirs("captures", exist_ok=True)
                    
                    self.camera.capture(filepath)
                    
                    return jsonify({
                        'success': True,
                        'filename': filename,
                        'filepath': filepath
                    })
                else:
                    return jsonify({'success': False, 'error': 'Camera not available'}), 400
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/ai/detect', methods=['POST'])
        def ai_detect():
            try:
                # This would integrate with your AI detection system
                # For now, return mock detection
                detection = {
                    'detected': True,
                    'objects': ['person'],
                    'confidence': 0.85,
                    'timestamp': datetime.now().isoformat()
                }
                
                return jsonify(detection)
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 500
    
    def handle_command(self, command, action, value):
        """Handle control commands"""
        try:
            if command == 'motor':
                self.control_motors(action, value)
            elif command == 'camera':
                self.control_camera(action, value)
            elif command == 'audio':
                self.control_audio(action, value)
            elif command == 'mode':
                self.set_mode(action)
            elif command == 'ai':
                self.control_ai(action, value)
            elif command == 'patrol':
                self.control_patrol(action, value)
            elif command == 'emergency_stop':
                self.emergency_stop = True
                self.stop_motors()
            
            logger.info(f"Command executed: {command} {action} {value}")
        except Exception as e:
            logger.error(f"Command execution failed: {e}")
    
    def control_motors(self, action, value=None):
        """Control motor movement"""
        if self.emergency_stop:
            return
        
        speed = value if value is not None else 0.5
        
        try:
            if action == 'forward':
                self.left_motor.forward(speed)
                self.right_motor.forward(speed)
                self.sensor_data['motor_direction'] = 'forward'
            elif action == 'backward':
                self.left_motor.backward(speed)
                self.right_motor.backward(speed)
                self.sensor_data['motor_direction'] = 'backward'
            elif action == 'left':
                self.left_motor.backward(speed)
                self.right_motor.forward(speed)
                self.sensor_data['motor_direction'] = 'left'
            elif action == 'right':
                self.left_motor.forward(speed)
                self.right_motor.backward(speed)
                self.sensor_data['motor_direction'] = 'right'
            elif action == 'stop':
                self.left_motor.stop()
                self.right_motor.stop()
                self.sensor_data['motor_direction'] = 'stop'
            elif action == 'speed':
                # Update speed for current direction
                current_direction = self.sensor_data['motor_direction']
                if current_direction != 'stop':
                    self.control_motors(current_direction, speed)
            
            # Update sensor data
            self.sensor_data['left_motor_speed'] = speed * 255
            self.sensor_data['right_motor_speed'] = speed * 255
            
        except Exception as e:
            logger.error(f"Motor control failed: {e}")
    
    def stop_motors(self):
        """Stop all motors"""
        try:
            if self.left_motor:
                self.left_motor.stop()
            if self.right_motor:
                self.right_motor.stop()
            self.sensor_data['motor_direction'] = 'stop'
            self.sensor_data['left_motor_speed'] = 0
            self.sensor_data['right_motor_speed'] = 0
        except Exception as e:
            logger.error(f"Stop motors failed: {e}")
    
    def control_camera(self, action, value):
        """Control camera settings"""
        try:
            if not self.camera:
                return
            
            if action == 'quality':
                # Adjust camera quality (0-100)
                quality = max(0, min(100, value))
                self.camera.quality = quality
            elif action == 'brightness':
                # Adjust brightness (-100 to 100)
                brightness = max(-100, min(100, value))
                self.camera.brightness = brightness
            elif action == 'contrast':
                # Adjust contrast (-100 to 100)
                contrast = max(-100, min(100, value))
                self.camera.contrast = contrast
            elif action == 'capture':
                # Capture image
                filename = f"capture_{int(time.time())}.jpg"
                filepath = f"captures/{filename}"
                os.makedirs("captures", exist_ok=True)
                self.camera.capture(filepath)
                logger.info(f"Image captured: {filepath}")
            
        except Exception as e:
            logger.error(f"Camera control failed: {e}")
    
    def control_audio(self, action, value):
        """Control audio system"""
        try:
            if action == 'volume':
                # Adjust volume (0-100)
                volume = max(0, min(100, value))
                # Implement volume control
                logger.info(f"Volume set to: {volume}")
            elif action == 'play':
                # Play specific sound
                sound_type = value
                if sound_type == 1:  # Alert
                    self.play_alert()
                elif sound_type == 2:  # Low pitch
                    self.play_low_pitch()
                elif sound_type == 3:  # Siren
                    self.play_siren()
            
        except Exception as e:
            logger.error(f"Audio control failed: {e}")
    
    def play_alert(self):
        """Play alert sound"""
        try:
            logger.info("Playing alert sound")
            # Generate alert tone using numpy
            duration = 0.5
            sample_rate = 44100
            frequency = 800
            
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            wave = np.sin(2 * np.pi * frequency * t) * 0.3
            
            # Convert to 16-bit PCM
            audio_data = (wave * 32767).astype(np.int16)
            
            # Play using pyaudio
            if hasattr(self, 'audio') and self.audio:
                stream = self.audio.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=sample_rate,
                    output=True
                )
                stream.write(audio_data.tobytes())
                stream.stop_stream()
                stream.close()
        except Exception as e:
            logger.error(f"Alert sound failed: {e}")
    
    def play_low_pitch(self):
        """Play low pitch sound"""
        try:
            logger.info("Playing low pitch sound")
            duration = 1.0
            sample_rate = 44100
            frequency = 200  # Low frequency
            
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            wave = np.sin(2 * np.pi * frequency * t) * 0.3
            
            audio_data = (wave * 32767).astype(np.int16)
            
            if hasattr(self, 'audio') and self.audio:
                stream = self.audio.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=sample_rate,
                    output=True
                )
                stream.write(audio_data.tobytes())
                stream.stop_stream()
                stream.close()
        except Exception as e:
            logger.error(f"Low pitch sound failed: {e}")
    
    def play_siren(self):
        """Play siren sound"""
        try:
            logger.info("Playing siren sound")
            duration = 2.0
            sample_rate = 44100
            
            # Create siren effect (frequency sweep)
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            frequency = 400 + 300 * np.sin(2 * np.pi * 2 * t)  # Sweep from 100Hz to 700Hz
            wave = np.sin(2 * np.pi * frequency * t) * 0.3
            
            audio_data = (wave * 32767).astype(np.int16)
            
            if hasattr(self, 'audio') and self.audio:
                stream = self.audio.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=sample_rate,
                    output=True
                )
                stream.write(audio_data.tobytes())
                stream.stop_stream()
                stream.close()
        except Exception as e:
            logger.error(f"Siren sound failed: {e}")
    
    def control_ai(self, action, value):
        """Control AI detection"""
        if action == 'start':
            self.ai_enabled = True
            logger.info("AI detection enabled")
        elif action == 'stop':
            self.ai_enabled = False
            logger.info("AI detection disabled")
    
    def control_patrol(self, action, value):
        """Control patrol mode"""
        if action == 'start':
            self.patrol_enabled = True
            self.patrol_speed = value.get('speed', 100) / 255.0
            logger.info("Patrol mode enabled")
        elif action == 'stop':
            self.patrol_enabled = False
            logger.info("Patrol mode disabled")
    
    def set_mode(self, mode):
        """Set operation mode"""
        self.mode = mode
        logger.info(f"Mode set to: {mode}")
    
    def read_sensors(self):
        """Read sensor data"""
        try:
            # Read IR sensors
            ir_left = 0 if self.ir_left.is_pressed else 1
            ir_center = 0 if self.ir_center.is_pressed else 1
            ir_right = 0 if self.ir_right.is_pressed else 1
            
            self.sensor_data['ir_sensors'] = [ir_left, ir_center, ir_right]
            
            # Read ultrasonic sensor
            if self.ultrasonic:
                distance = self.ultrasonic.distance * 100  # Convert to cm
                self.sensor_data['ultrasonic_distance'] = distance
                self.sensor_data['obstacle_detected'] = distance < 20  # 20cm threshold
            
            # Read battery level (simplified)
            self.system_data['battery_level'] = max(0, min(100, self.system_data['battery_level'] - 0.01))
            self.system_data['battery_voltage'] = 12.0 * (self.system_data['battery_level'] / 100)
            
        except Exception as e:
            logger.error(f"Sensor reading failed: {e}")
    
    def update_system_data(self):
        """Update system status data"""
        try:
            # Get system information
            self.system_data['uptime'] = time.time() - self.start_time
            self.system_data['cpu_temp'] = self.get_cpu_temperature()
            self.system_data['cpu_usage'] = self.get_cpu_usage()
            self.system_data['memory_usage'] = self.get_memory_usage()
            self.system_data['disk_usage'] = self.get_disk_usage()
            
            # Get WiFi information
            self.system_data['wifi_signal'] = self.get_wifi_signal()
            self.system_data['wifi_ssid'] = self.get_wifi_ssid()
            self.system_data['ip_address'] = self.get_ip_address()
            
        except Exception as e:
            logger.error(f"System data update failed: {e}")
    
    def get_cpu_temperature(self):
        """Get CPU temperature"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = int(f.read()) / 1000.0
            return temp
        except:
            return 0
    
    def get_cpu_usage(self):
        """Get CPU usage percentage"""
        try:
            import psutil
            return psutil.cpu_percent(interval=1)
        except:
            try:
                result = subprocess.run(['top', '-bn1'], capture_output=True, text=True)
                # Parse CPU usage from top output
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'Cpu(s)' in line:
                        # Extract CPU percentage
                        parts = line.split(',')
                        if parts:
                            cpu_part = parts[0].split()[1]
                            return float(cpu_part.replace('%us', ''))
                return 0
            except:
                return 0
    
    def get_memory_usage(self):
        """Get memory usage percentage"""
        try:
            import psutil
            return psutil.virtual_memory().percent
        except:
            try:
                with open('/proc/meminfo', 'r') as f:
                    meminfo = f.read()
                lines = meminfo.split('\n')
                mem_total = 0
                mem_available = 0
                for line in lines:
                    if line.startswith('MemTotal:'):
                        mem_total = int(line.split()[1])
                    elif line.startswith('MemAvailable:'):
                        mem_available = int(line.split()[1])
                if mem_total > 0:
                    return ((mem_total - mem_available) / mem_total) * 100
                return 0
            except:
                return 0
    
    def get_disk_usage(self):
        """Get disk usage percentage"""
        try:
            import psutil
            return psutil.disk_usage('/').percent
        except:
            try:
                result = subprocess.run(['df', '/'], capture_output=True, text=True)
                lines = result.stdout.split('\n')
                if len(lines) > 1:
                    parts = lines[1].split()
                    if len(parts) > 4:
                        usage_str = parts[4].replace('%', '')
                        return float(usage_str)
                return 0
            except:
                return 0
    
    def get_wifi_signal(self):
        """Get WiFi signal strength"""
        try:
            result = subprocess.run(['iwconfig'], capture_output=True, text=True)
            # Parse signal strength
            return -50  # Simplified
        except:
            return -50
    
    def get_wifi_ssid(self):
        """Get WiFi SSID"""
        try:
            result = subprocess.run(['iwgetid', '-r'], capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return 'Unknown'
    
    def get_ip_address(self):
        """Get IP address"""
        try:
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            return result.stdout.strip().split()[0]
        except:
            return '0.0.0.0'
    
    def sensor_loop(self):
        """Main sensor reading loop"""
        while self.running:
            try:
                self.read_sensors()
                self.update_system_data()
                
                # Send data via WebSocket
                if self.ws_client:
                    self.send_sensor_data()
                
                time.sleep(0.1)  # 10Hz update rate
                
            except Exception as e:
                logger.error(f"Sensor loop error: {e}")
                time.sleep(1)
    
    def send_sensor_data(self):
        """Send sensor data via WebSocket"""
        try:
            data = {
                'type': 'sensor_data',
                'timestamp': datetime.now().isoformat(),
                'data': self.sensor_data
            }
            self.ws_client.send(json.dumps(data))
        except Exception as e:
            logger.error(f"WebSocket send failed: {e}")
    
    def send_system_status(self):
        """Send system status via WebSocket"""
        try:
            data = {
                'type': 'status',
                'timestamp': datetime.now().isoformat(),
                'data': self.system_data
            }
            self.ws_client.send(json.dumps(data))
        except Exception as e:
            logger.error(f"WebSocket send failed: {e}")
    
    def connect_websocket(self):
        """Connect to backend WebSocket"""
        try:
            self.ws_client = websocket.WebSocket()
            self.ws_client.connect(self.backend_url)
            logger.info("WebSocket connected to backend")
            
            # Send initial status
            self.send_system_status()
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            self.ws_client = None
    
    def websocket_loop(self):
        """WebSocket communication loop"""
        while self.running:
            try:
                if not self.ws_client:
                    self.connect_websocket()
                    time.sleep(5)
                    continue
                
                # Send periodic updates
                self.send_system_status()
                time.sleep(5)  # Send status every 5 seconds
                
            except Exception as e:
                logger.error(f"WebSocket loop error: {e}")
                self.ws_client = None
                time.sleep(5)
    
    def ai_detection_loop(self):
        """AI detection loop"""
        while self.running:
            try:
                if self.ai_enabled and self.camera:
                    # Implement AI detection here
                    # This would integrate with your AI model
                    pass
                
                time.sleep(1)  # Check every second
                
            except Exception as e:
                logger.error(f"AI detection loop error: {e}")
                time.sleep(1)
    
    def patrol_loop(self):
        """Patrol mode loop"""
        while self.running:
            try:
                if self.patrol_enabled and not self.emergency_stop:
                    # Implement patrol logic
                    # Simple forward movement with obstacle avoidance
                    if not self.sensor_data['obstacle_detected']:
                        self.control_motors('forward', self.patrol_speed)
                    else:
                        # Avoid obstacle
                        self.control_motors('right', self.patrol_speed)
                        time.sleep(1)
                        self.control_motors('forward', self.patrol_speed)
                
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Patrol loop error: {e}")
                time.sleep(1)
    
    def start(self):
        """Start the surveillance car system"""
        try:
            self.running = True
            self.start_time = time.time()
            
            # Start threads
            self.sensor_thread = threading.Thread(target=self.sensor_loop, daemon=True)
            self.websocket_thread = threading.Thread(target=self.websocket_loop, daemon=True)
            self.ai_thread = threading.Thread(target=self.ai_detection_loop, daemon=True)
            self.patrol_thread = threading.Thread(target=self.patrol_loop, daemon=True)
            
            self.sensor_thread.start()
            self.websocket_thread.start()
            self.ai_thread.start()
            self.patrol_thread.start()
            
            logger.info("Surveillance car system started")
            
            # Start Flask server
            self.socketio.run(self.app, host='0.0.0.0', port=5000, debug=False)
            
        except Exception as e:
            logger.error(f"Start failed: {e}")
            self.stop()
    
    def stop(self):
        """Stop the surveillance car system"""
        try:
            self.running = False
            self.emergency_stop = True
            
            # Stop motors
            self.stop_motors()
            
            # Cleanup GPIO
            GPIO.cleanup()
            
            # Close camera
            if self.camera:
                self.camera.close()
            
            # Close WebSocket
            if self.ws_client:
                self.ws_client.close()
            
            logger.info("Surveillance car system stopped")
            
        except Exception as e:
            logger.error(f"Stop failed: {e}")

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Shutdown signal received")
    if 'car' in globals():
        car.stop()
    sys.exit(0)

def main():
    """Main function"""
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create surveillance car instance
    global car
    car = SurveillanceCar()
    
    try:
        car.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Main error: {e}")
    finally:
        car.stop()

if __name__ == "__main__":
    main()

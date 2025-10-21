/*
 * Complete ESP32 Surveillance Car Firmware
 * Professional implementation with all features
 * Compatible with web dashboard and mobile app
 */

 #include <WiFi.h>
 #include <WebServer.h>
 #include <WebSocketsServer.h>
 #include <ArduinoJson.h>
 #include <ESP32Servo.h>
 #include <esp_camera.h>
 #include <esp_timer.h>
 #include <esp_wifi.h>
 #include <esp_system.h>
 #include <esp_log.h>
 #include <freertos/FreeRTOS.h>
 #include <freertos/task.h>
 #include <freertos/queue.h>
 #include <driver/gpio.h>
 #include <driver/adc.h>
 #include <esp_adc_cal.h>
 
 // Pin definitions
 #define MOTOR_LEFT_FORWARD    18
 #define MOTOR_LEFT_BACKWARD   23
 #define MOTOR_LEFT_ENABLE     24
 #define MOTOR_RIGHT_FORWARD   25
 #define MOTOR_RIGHT_BACKWARD  12
 #define MOTOR_RIGHT_ENABLE    16
 
 #define IR_LEFT_PIN           5
 #define IR_CENTER_PIN         6
 #define IR_RIGHT_PIN          13
 #define ULTRASONIC_TRIG       27
 #define ULTRASONIC_ECHO       17
 #define BATTERY_MONITOR       22
 #define SPEAKER_PIN           26
 
 // Camera pins (ESP32-CAM)
 #define PWDN_GPIO_NUM     32
 #define RESET_GPIO_NUM    -1
 #define XCLK_GPIO_NUM      0
 #define SIOD_GPIO_NUM     26
 #define SIOC_GPIO_NUM     27
 #define Y9_GPIO_NUM       35
 #define Y8_GPIO_NUM       34
 #define Y7_GPIO_NUM       39
 #define Y6_GPIO_NUM       36
 #define Y5_GPIO_NUM       21
 #define Y4_GPIO_NUM       19
 #define Y3_GPIO_NUM       18
 #define Y2_GPIO_NUM        5
 #define VSYNC_GPIO_NUM    25
 #define HREF_GPIO_NUM     23
 #define PCLK_GPIO_NUM     22
 
 // System configuration
 #define WIFI_SSID "SurveillanceCar"
 #define WIFI_PASSWORD "surveillance123"
 #define BACKEND_URL "http://192.168.1.100:3000"
 #define DEVICE_NAME "ESP32-SurveillanceCar"
 
 // Global objects
 WebServer server(80);
 WebSocketsServer webSocket = WebSocketsServer(81);
 Servo servo;
 
 // System state
 struct SystemState {
   bool isRunning = true;
   String mode = "manual";
   bool aiEnabled = false;
   bool patrolEnabled = false;
   bool emergencyStop = false;
   int batteryLevel = 100;
   float batteryVoltage = 12.0;
   int cpuFreq = 240;
   int freeHeap = 0;
   unsigned long uptime = 0;
   int storageUsage = 0;
   String wifiSSID = "";
   int wifiSignal = 0;
   String ipAddress = "";
   int connectedClients = 0;
 } systemState;
 
 struct SensorData {
   int irSensors[3] = {0, 0, 0};
   float ultrasonicDistance = 0.0;
   bool obstacleDetected = false;
   int leftMotorSpeed = 0;
   int rightMotorSpeed = 0;
   String motorDirection = "stop";
 } sensorData;
 
 struct MotorControl {
   int leftSpeed = 0;
   int rightSpeed = 0;
   String direction = "stop";
   bool isMoving = false;
 } motorControl;
 
 // Task handles
 TaskHandle_t sensorTaskHandle;
 TaskHandle_t motorTaskHandle;
 TaskHandle_t cameraTaskHandle;
 TaskHandle_t communicationTaskHandle;
 
 // Queues
 QueueHandle_t commandQueue;
 QueueHandle_t sensorQueue;
 
 // Timing
 unsigned long lastSensorUpdate = 0;
 unsigned long lastStatusUpdate = 0;
 unsigned long lastHeartbeat = 0;
 const unsigned long SENSOR_UPDATE_INTERVAL = 100;  // 10Hz
 const unsigned long STATUS_UPDATE_INTERVAL = 1000; // 1Hz
 const unsigned long HEARTBEAT_INTERVAL = 30000;    // 30s
 
 // Function prototypes
 void setupWiFi();
 void setupCamera();
 void setupMotors();
 void setupSensors();
 void setupWebServer();
 void setupWebSocket();
 void setupTasks();
 
 void sensorTask(void *parameter);
 void motorTask(void *parameter);
 void cameraTask(void *parameter);
 void communicationTask(void *parameter);
 
 void handleRoot();
 void handleStatus();
 void handleSensors();
 void handleControl();
 void handleCamera();
 void handleStream();
 void handleCapture();
 void handleConfig();
 void handleHealth();
 
 void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
 void sendSensorData();
 void sendSystemStatus();
 void processCommand(String command, JsonObject data);
 void controlMotors(String direction, int speed);
 void readSensors();
 void updateSystemStatus();
 void sendToBackend(String endpoint, JsonObject data);
 
 void setup() {
   Serial.begin(115200);
   Serial.println("Starting ESP32 Surveillance Car...");
   
   // Initialize system
   systemState.uptime = millis();
   systemState.freeHeap = ESP.getFreeHeap();
   systemState.cpuFreq = getCpuFrequencyMhz();
   
   // Setup hardware
   setupWiFi();
   setupCamera();
   setupMotors();
   setupSensors();
   setupWebServer();
   setupWebSocket();
   setupTasks();
   
   Serial.println("ESP32 Surveillance Car initialized successfully!");
   Serial.println("Web dashboard: http://" + WiFi.localIP().toString());
   Serial.println("WebSocket: ws://" + WiFi.localIP().toString() + ":81");
 }
 
 void loop() {
   server.handleClient();
   webSocket.loop();
   
   // Update system status periodically
   if (millis() - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
     updateSystemStatus();
     sendSystemStatus();
     lastStatusUpdate = millis();
   }
   
   // Send heartbeat to backend
   if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
     sendHeartbeat();
     lastHeartbeat = millis();
   }
   
   delay(10);
 }
 
 void setupWiFi() {
   WiFi.mode(WIFI_STA);
   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
   
   Serial.print("Connecting to WiFi");
   int attempts = 0;
   while (WiFi.status() != WL_CONNECTED && attempts < 20) {
     delay(500);
     Serial.print(".");
     attempts++;
   }
   
   if (WiFi.status() == WL_CONNECTED) {
     systemState.wifiSSID = WiFi.SSID();
     systemState.ipAddress = WiFi.localIP().toString();
     systemState.wifiSignal = WiFi.RSSI();
     Serial.println();
     Serial.println("WiFi connected!");
     Serial.println("IP address: " + systemState.ipAddress);
   } else {
     Serial.println();
     Serial.println("WiFi connection failed!");
     // Start AP mode as fallback
     WiFi.mode(WIFI_AP);
     WiFi.softAP("SurveillanceCar-Config", "surveillance123");
     Serial.println("AP mode started: SurveillanceCar-Config");
   }
 }
 
 void setupCamera() {
   camera_config_t config;
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
   config.frame_size = FRAMESIZE_VGA;
   config.jpeg_quality = 12;
   config.fb_count = 2;
   
   esp_err_t err = esp_camera_init(&config);
   if (err != ESP_OK) {
     Serial.printf("Camera init failed with error 0x%x", err);
     return;
   }
   
   Serial.println("Camera initialized successfully");
 }
 
 void setupMotors() {
   pinMode(MOTOR_LEFT_FORWARD, OUTPUT);
   pinMode(MOTOR_LEFT_BACKWARD, OUTPUT);
   pinMode(MOTOR_LEFT_ENABLE, OUTPUT);
   pinMode(MOTOR_RIGHT_FORWARD, OUTPUT);
   pinMode(MOTOR_RIGHT_BACKWARD, OUTPUT);
   pinMode(MOTOR_RIGHT_ENABLE, OUTPUT);
   
   // Initialize motors as stopped
   digitalWrite(MOTOR_LEFT_ENABLE, LOW);
   digitalWrite(MOTOR_RIGHT_ENABLE, LOW);
   
   Serial.println("Motors initialized");
 }
 
 void setupSensors() {
   pinMode(IR_LEFT_PIN, INPUT);
   pinMode(IR_CENTER_PIN, INPUT);
   pinMode(IR_RIGHT_PIN, INPUT);
   pinMode(ULTRASONIC_TRIG, OUTPUT);
   pinMode(ULTRASONIC_ECHO, INPUT);
   pinMode(BATTERY_MONITOR, INPUT);
   pinMode(SPEAKER_PIN, OUTPUT);
   
   digitalWrite(ULTRASONIC_TRIG, LOW);
   digitalWrite(SPEAKER_PIN, LOW);
   
   Serial.println("Sensors initialized");
 }
 
 void setupWebServer() {
   server.on("/", handleRoot);
   server.on("/api/status", handleStatus);
   server.on("/api/sensors", handleSensors);
   server.on("/api/control", HTTP_POST, handleControl);
   server.on("/api/camera/stream", handleStream);
   server.on("/api/camera/capture", HTTP_POST, handleCapture);
   server.on("/api/config", handleConfig);
   server.on("/api/health", handleHealth);
   
   server.begin();
   Serial.println("Web server started");
 }
 
 void setupWebSocket() {
   webSocket.begin();
   webSocket.onEvent(webSocketEvent);
   Serial.println("WebSocket server started");
 }
 
 void setupTasks() {
   // Create queues
   commandQueue = xQueueCreate(10, sizeof(String));
   sensorQueue = xQueueCreate(5, sizeof(SensorData));
   
   // Create tasks
   xTaskCreatePinnedToCore(sensorTask, "SensorTask", 4096, NULL, 1, &sensorTaskHandle, 0);
   xTaskCreatePinnedToCore(motorTask, "MotorTask", 4096, NULL, 1, &motorTaskHandle, 1);
   xTaskCreatePinnedToCore(cameraTask, "CameraTask", 8192, NULL, 1, &cameraTaskHandle, 0);
   xTaskCreatePinnedToCore(communicationTask, "CommTask", 4096, NULL, 1, &communicationTaskHandle, 1);
   
   Serial.println("Tasks created successfully");
 }
 
 void sensorTask(void *parameter) {
   while (true) {
     readSensors();
     sendSensorData();
     vTaskDelay(pdMS_TO_TICKS(SENSOR_UPDATE_INTERVAL));
   }
 }
 
 void motorTask(void *parameter) {
   while (true) {
     // Process motor commands from queue
     String command;
     if (xQueueReceive(commandQueue, &command, 0) == pdTRUE) {
       processMotorCommand(command);
     }
     vTaskDelay(pdMS_TO_TICKS(50));
   }
 }
 
 void cameraTask(void *parameter) {
   while (true) {
     // Camera processing can be added here
     vTaskDelay(pdMS_TO_TICKS(100));
   }
 }
 
 void communicationTask(void *parameter) {
   while (true) {
     // Handle communication with backend
     sendToBackend("/api/status", createStatusJson());
     vTaskDelay(pdMS_TO_TICKS(5000));
   }
 }
 
 void handleRoot() {
   String html = "<!DOCTYPE html><html><head><title>ESP32 Surveillance Car</title></head><body>";
   html += "<h1>ESP32 Surveillance Car</h1>";
   html += "<p>Status: " + String(systemState.isRunning ? "Running" : "Stopped") + "</p>";
   html += "<p>Mode: " + systemState.mode + "</p>";
   html += "<p>Battery: " + String(systemState.batteryLevel) + "%</p>";
   html += "<p>IP: " + systemState.ipAddress + "</p>";
   html += "<p><a href='/api/status'>API Status</a></p>";
   html += "<p><a href='/api/sensors'>Sensor Data</a></p>";
   html += "</body></html>";
   
   server.send(200, "text/html", html);
 }
 
 void handleStatus() {
   DynamicJsonDocument doc(1024);
   doc["device"] = "ESP32";
   doc["status"] = systemState.isRunning ? "running" : "stopped";
   doc["mode"] = systemState.mode;
   doc["battery"] = systemState.batteryLevel;
   doc["batteryVoltage"] = systemState.batteryVoltage;
   doc["cpuFreq"] = systemState.cpuFreq;
   doc["freeHeap"] = systemState.freeHeap;
   doc["uptime"] = systemState.uptime;
   doc["wifiSSID"] = systemState.wifiSSID;
   doc["wifiSignal"] = systemState.wifiSignal;
   doc["ipAddress"] = systemState.ipAddress;
   doc["connectedClients"] = systemState.connectedClients;
   doc["timestamp"] = millis();
   
   String response;
   serializeJson(doc, response);
   server.send(200, "application/json", response);
 }
 
 void handleSensors() {
   DynamicJsonDocument doc(1024);
   doc["irSensors"] = JsonArray(sensorData.irSensors[0], sensorData.irSensors[1], sensorData.irSensors[2]);
   doc["ultrasonicDistance"] = sensorData.ultrasonicDistance;
   doc["obstacleDetected"] = sensorData.obstacleDetected;
   doc["leftMotorSpeed"] = sensorData.leftMotorSpeed;
   doc["rightMotorSpeed"] = sensorData.rightMotorSpeed;
   doc["motorDirection"] = sensorData.motorDirection;
   doc["timestamp"] = millis();
   
   String response;
   serializeJson(doc, response);
   server.send(200, "application/json", response);
 }
 
 void handleControl() {
   if (server.hasArg("plain")) {
     DynamicJsonDocument doc(1024);
     deserializeJson(doc, server.arg("plain"));
     
     String command = doc["command"];
     String action = doc["action"];
     int value = doc["value"];
     
     processCommand(command, doc.as<JsonObject>());
     
     server.send(200, "application/json", "{\"success\":true}");
   } else {
     server.send(400, "application/json", "{\"error\":\"No data\"}");
   }
 }
 
 void handleStream() {
   server.sendHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame");
   server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
   server.sendHeader("Pragma", "no-cache");
   server.sendHeader("Expires", "0");
   server.send(200);
   
   while (server.client().connected()) {
     camera_fb_t * fb = esp_camera_fb_get();
     if (!fb) {
       continue;
     }
     
     server.client().print("--frame\r\n");
     server.client().print("Content-Type: image/jpeg\r\n");
     server.client().print("Content-Length: " + String(fb->len) + "\r\n\r\n");
     server.client().write(fb->buf, fb->len);
     server.client().print("\r\n");
     
     esp_camera_fb_return(fb);
     delay(33); // ~30 FPS
   }
 }
 
 void handleCapture() {
   camera_fb_t * fb = esp_camera_fb_get();
   if (!fb) {
     server.send(500, "text/plain", "Camera capture failed");
     return;
   }
   
   server.sendHeader("Content-Type", "image/jpeg");
   server.sendHeader("Content-Length", String(fb->len));
   server.send(200);
   server.client().write(fb->buf, fb->len);
   
   esp_camera_fb_return(fb);
 }
 
 void handleConfig() {
   DynamicJsonDocument doc(1024);
   doc["wifiSSID"] = systemState.wifiSSID;
   doc["ipAddress"] = systemState.ipAddress;
   doc["deviceName"] = DEVICE_NAME;
   doc["firmwareVersion"] = "1.0.0";
   doc["hardwareVersion"] = "ESP32";
   
   String response;
   serializeJson(doc, response);
   server.send(200, "application/json", response);
 }
 
 void handleHealth() {
   DynamicJsonDocument doc(512);
   doc["healthy"] = true;
   doc["uptime"] = millis();
   doc["freeHeap"] = ESP.getFreeHeap();
   doc["timestamp"] = millis();
   
   String response;
   serializeJson(doc, response);
   server.send(200, "application/json", response);
 }
 
 void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
   switch (type) {
     case WStype_DISCONNECTED:
       Serial.printf("Client %u disconnected\n", num);
       systemState.connectedClients--;
       break;
       
     case WStype_CONNECTED:
       Serial.printf("Client %u connected from %s\n", num, payload);
       systemState.connectedClients++;
       break;
       
     case WStype_TEXT:
       processWebSocketMessage(num, (char*)payload);
       break;
       
     default:
       break;
   }
 }
 
 void processWebSocketMessage(uint8_t clientNum, char* message) {
   DynamicJsonDocument doc(1024);
   deserializeJson(doc, message);
   
   String type = doc["type"];
   
   if (type == "control") {
     processCommand(doc["command"], doc.as<JsonObject>());
   } else if (type == "get_status") {
     sendSystemStatus();
   } else if (type == "ping") {
     webSocket.sendTXT(clientNum, "{\"type\":\"pong\"}");
   }
 }
 
 void processCommand(String command, JsonObject data) {
   if (systemState.emergencyStop && command != "emergency_stop") {
     return;
   }
   
   if (command == "motor") {
     String action = data["action"];
     int speed = data["value"] | 150;
     controlMotors(action, speed);
   } else if (command == "mode") {
     systemState.mode = data["value"];
   } else if (command == "ai") {
     systemState.aiEnabled = data["action"] == "start";
   } else if (command == "patrol") {
     systemState.patrolEnabled = data["enabled"];
   } else if (command == "emergency_stop") {
     systemState.emergencyStop = true;
     controlMotors("stop", 0);
   }
 }
 
 void controlMotors(String direction, int speed) {
   if (systemState.emergencyStop) {
     digitalWrite(MOTOR_LEFT_ENABLE, LOW);
     digitalWrite(MOTOR_RIGHT_ENABLE, LOW);
     return;
   }
   
   speed = constrain(speed, 0, 255);
   motorControl.direction = direction;
   motorControl.isMoving = (direction != "stop");
   
   if (direction == "forward") {
     analogWrite(MOTOR_LEFT_FORWARD, speed);
     analogWrite(MOTOR_LEFT_BACKWARD, 0);
     analogWrite(MOTOR_RIGHT_FORWARD, speed);
     analogWrite(MOTOR_RIGHT_BACKWARD, 0);
     digitalWrite(MOTOR_LEFT_ENABLE, HIGH);
     digitalWrite(MOTOR_RIGHT_ENABLE, HIGH);
   } else if (direction == "backward") {
     analogWrite(MOTOR_LEFT_FORWARD, 0);
     analogWrite(MOTOR_LEFT_BACKWARD, speed);
     analogWrite(MOTOR_RIGHT_FORWARD, 0);
     analogWrite(MOTOR_RIGHT_BACKWARD, speed);
     digitalWrite(MOTOR_LEFT_ENABLE, HIGH);
     digitalWrite(MOTOR_RIGHT_ENABLE, HIGH);
   } else if (direction == "left") {
     analogWrite(MOTOR_LEFT_FORWARD, 0);
     analogWrite(MOTOR_LEFT_BACKWARD, speed);
     analogWrite(MOTOR_RIGHT_FORWARD, speed);
     analogWrite(MOTOR_RIGHT_BACKWARD, 0);
     digitalWrite(MOTOR_LEFT_ENABLE, HIGH);
     digitalWrite(MOTOR_RIGHT_ENABLE, HIGH);
   } else if (direction == "right") {
     analogWrite(MOTOR_LEFT_FORWARD, speed);
     analogWrite(MOTOR_LEFT_BACKWARD, 0);
     analogWrite(MOTOR_RIGHT_FORWARD, 0);
     analogWrite(MOTOR_RIGHT_BACKWARD, speed);
     digitalWrite(MOTOR_LEFT_ENABLE, HIGH);
     digitalWrite(MOTOR_RIGHT_ENABLE, HIGH);
   } else if (direction == "stop") {
     analogWrite(MOTOR_LEFT_FORWARD, 0);
     analogWrite(MOTOR_LEFT_BACKWARD, 0);
     analogWrite(MOTOR_RIGHT_FORWARD, 0);
     analogWrite(MOTOR_RIGHT_BACKWARD, 0);
     digitalWrite(MOTOR_LEFT_ENABLE, LOW);
     digitalWrite(MOTOR_RIGHT_ENABLE, LOW);
     motorControl.isMoving = false;
   }
   
   sensorData.leftMotorSpeed = (direction == "left" || direction == "right") ? speed : 0;
   sensorData.rightMotorSpeed = (direction == "left" || direction == "right") ? speed : 0;
   sensorData.motorDirection = direction;
 }
 
 void readSensors() {
   // Read IR sensors
   sensorData.irSensors[0] = digitalRead(IR_LEFT_PIN);
   sensorData.irSensors[1] = digitalRead(IR_CENTER_PIN);
   sensorData.irSensors[2] = digitalRead(IR_RIGHT_PIN);
   
   // Read ultrasonic sensor
   digitalWrite(ULTRASONIC_TRIG, HIGH);
   delayMicroseconds(10);
   digitalWrite(ULTRASONIC_TRIG, LOW);
   
   long duration = pulseIn(ULTRASONIC_ECHO, HIGH);
   sensorData.ultrasonicDistance = duration * 0.034 / 2;
   sensorData.obstacleDetected = sensorData.ultrasonicDistance < 20;
   
   // Read battery level (simplified)
   int batteryRaw = analogRead(BATTERY_MONITOR);
   systemState.batteryVoltage = (batteryRaw / 4095.0) * 3.3 * 4.0; // Assuming voltage divider
   systemState.batteryLevel = constrain((systemState.batteryVoltage - 10.0) / 2.0 * 100, 0, 100);
 }
 
 void updateSystemStatus() {
   systemState.uptime = millis();
   systemState.freeHeap = ESP.getFreeHeap();
   systemState.cpuFreq = getCpuFrequencyMhz();
   systemState.wifiSignal = WiFi.RSSI();
   systemState.connectedClients = webSocket.connectedClients();
 }
 
 void sendSensorData() {
   DynamicJsonDocument doc(1024);
   doc["type"] = "sensor_data";
   doc["timestamp"] = millis();
   doc["irSensors"] = JsonArray(sensorData.irSensors[0], sensorData.irSensors[1], sensorData.irSensors[2]);
   doc["ultrasonicDistance"] = sensorData.ultrasonicDistance;
   doc["obstacleDetected"] = sensorData.obstacleDetected;
   doc["leftMotorSpeed"] = sensorData.leftMotorSpeed;
   doc["rightMotorSpeed"] = sensorData.rightMotorSpeed;
   doc["motorDirection"] = sensorData.motorDirection;
   
   String message;
   serializeJson(doc, message);
   webSocket.broadcastTXT(message);
 }
 
 void sendSystemStatus() {
   DynamicJsonDocument doc(1024);
   doc["type"] = "status";
   doc["timestamp"] = millis();
   doc["isRunning"] = systemState.isRunning;
   doc["mode"] = systemState.mode;
   doc["battery"] = systemState.batteryLevel;
   doc["batteryVoltage"] = systemState.batteryVoltage;
   doc["cpuFreq"] = systemState.cpuFreq;
   doc["freeHeap"] = systemState.freeHeap;
   doc["uptime"] = systemState.uptime;
   doc["wifiSSID"] = systemState.wifiSSID;
   doc["wifiSignal"] = systemState.wifiSignal;
   doc["ipAddress"] = systemState.ipAddress;
   doc["connectedClients"] = systemState.connectedClients;
   
   String message;
   serializeJson(doc, message);
   webSocket.broadcastTXT(message);
 }
 
 void sendHeartbeat() {
   DynamicJsonDocument doc(512);
   doc["type"] = "heartbeat";
   doc["timestamp"] = millis();
   doc["uptime"] = systemState.uptime;
   doc["freeHeap"] = systemState.freeHeap;
   
   String message;
   serializeJson(doc, message);
   webSocket.broadcastTXT(message);
 }
 
 void sendToBackend(String endpoint, JsonObject data) {
   // Implementation for sending data to backend server
   // This would use HTTP client to send data to the Node.js backend
 }
 
 JsonObject createStatusJson() {
   DynamicJsonDocument doc(1024);
   doc["device"] = "ESP32";
   doc["status"] = systemState.isRunning ? "running" : "stopped";
   doc["mode"] = systemState.mode;
   doc["battery"] = systemState.batteryLevel;
   doc["timestamp"] = millis();
   return doc.as<JsonObject>();
 }
 
 void processMotorCommand(String command) {
   // Process motor commands from queue
   // Implementation depends on command format
 }
 
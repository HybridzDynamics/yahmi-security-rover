# Troubleshooting Guide

This guide covers common symptoms, diagnosis steps, and solutions across the Yahmi Security Rover stack.

---

## 📸 Video Streaming & Camera Issues

### Issue: Camera stream is blank or fails to load
- **Cause 1: Power supply brownout.** The ESP32-CAM requires up to 350mA peak during Wi-Fi transmission and camera sensor startup. If powered by USB port or weak 3.3V pin, it reboots in a loop.
  - **Fix**: Power the ESP32 via a dedicated 5V 2A buck converter directly from the battery pack, placing a 470µF electrolytic capacitor across 5V and GND.
- **Cause 2: Wrong camera model selected.** In `surveillance_car.ino`, ensure `#define CAMERA_MODEL_AI_THINKER` is uncommented matching your module pinout.
- **Cause 3: WebSocket/HTTP mixed content.** If dashboard is loaded over HTTPS, browsers block insecure `http://` MJPEG camera feeds.
  - **Fix**: Route the camera stream through the Web Dashboard proxy or configure an SSL reverse proxy for the stream.

---

## 🚗 Motor Actuation & Navigation Issues

### Issue: Motors do not respond to commands
- **Cause 1: Common ground missing.** Motor driver (L298N/TB6612FNG) ground is not connected to ESP32 ground.
  - **Fix**: Connect battery GND, motor driver GND, and ESP32 GND together.
- **Cause 2: E-Stop triggered by ultrasonic sensor.** The rover firmware contains a failsafe that halts movement if an object is within 20cm.
  - **Fix**: Check `ULTRASONIC_TRIG` (Pin 27) and `ULTRASONIC_ECHO` (Pin 17) connections, or inspect serial logs for `Obstacle Detected`.

### Issue: One side spins backwards or rover drifts
- **Fix**: Swap the `MOTOR_LEFT_FORWARD` and `MOTOR_LEFT_BACKWARD` pin assignments in `esp32_firmware/surveillance_car.ino`.

---

## 🌐 Network & WebSocket Issues

### Issue: Dashboard shows "Rover Disconnected"
- **Diagnosis**:
  ```bash
  # Check if dashboard server is running and healthy
  curl -i http://localhost:3000/health
  ```
- **Cause 1: Reverse proxy dropping Upgrade headers.**
  - **Fix**: In your Nginx configuration, verify:
    ```nginx
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    ```
- **Cause 2: IP address mismatch.** If rover IP changed via DHCP, update the IP in `settings.html` or set a static DHCP reservation in your router.

---

## 🗄️ Database & Backend Issues

### Issue: `MongoServerError: Authentication failed`
- **Cause**: Username/password mismatch or incorrect `authSource`.
  - **Fix**: In `.env`, ensure the URI format specifies `?authSource=admin`:
    ```env
    MONGODB_URI=mongodb://admin:secret@localhost:27017/yahmi_security_rover?authSource=admin
    ```

### Issue: Node process exits immediately on startup
- **Cause**: Port 3000 is already in use by another process.
  - **Fix**: Check for existing process with `lsof -i :3000` (Linux) or `netstat -ano | findstr 3000` (Windows), or change `PORT=3001` in `.env`.

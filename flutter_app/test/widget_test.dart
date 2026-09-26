import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Rover Mobile App Core Logic Tests', () {
    test('Calculates motor throttle correctly from joystick position', () {
      double joystickY = 0.75;
      int speed = (joystickY * 255).round();
      expect(speed, 191);
    });

    test('Validates battery health warning threshold', () {
      int batteryLevel = 18;
      bool isLowBattery = batteryLevel < 20;
      expect(isLowBattery, true);
    });
  });
}

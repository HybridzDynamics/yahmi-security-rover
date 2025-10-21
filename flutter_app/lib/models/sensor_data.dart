class SensorData {
  final List<int> irSensors;
  final double ultrasonicDistance;
  final double batteryVoltage;
  final int batteryPercentage;
  final int leftMotorSpeed;
  final int rightMotorSpeed;
  final String motorDirection;
  final bool obstacleDetected;
  final DateTime timestamp;

  SensorData({
    required this.irSensors,
    required this.ultrasonicDistance,
    required this.batteryVoltage,
    required this.batteryPercentage,
    required this.leftMotorSpeed,
    required this.rightMotorSpeed,
    required this.motorDirection,
    required this.obstacleDetected,
    required this.timestamp,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    return SensorData(
      irSensors: List<int>.from(json['irSensors'] ?? [0, 0, 0]),
      ultrasonicDistance: (json['ultrasonicDistance'] ?? 0.0).toDouble(),
      batteryVoltage: (json['batteryVoltage'] ?? 0.0).toDouble(),
      batteryPercentage: json['batteryPercentage'] ?? 0,
      leftMotorSpeed: json['leftMotorSpeed'] ?? 0,
      rightMotorSpeed: json['rightMotorSpeed'] ?? 0,
      motorDirection: json['motorDirection'] ?? 'stop',
      obstacleDetected: json['obstacleDetected'] ?? false,
      timestamp: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'irSensors': irSensors,
      'ultrasonicDistance': ultrasonicDistance,
      'batteryVoltage': batteryVoltage,
      'batteryPercentage': batteryPercentage,
      'leftMotorSpeed': leftMotorSpeed,
      'rightMotorSpeed': rightMotorSpeed,
      'motorDirection': motorDirection,
      'obstacleDetected': obstacleDetected,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  SensorData copyWith({
    List<int>? irSensors,
    double? ultrasonicDistance,
    double? batteryVoltage,
    int? batteryPercentage,
    int? leftMotorSpeed,
    int? rightMotorSpeed,
    String? motorDirection,
    bool? obstacleDetected,
    DateTime? timestamp,
  }) {
    return SensorData(
      irSensors: irSensors ?? this.irSensors,
      ultrasonicDistance: ultrasonicDistance ?? this.ultrasonicDistance,
      batteryVoltage: batteryVoltage ?? this.batteryVoltage,
      batteryPercentage: batteryPercentage ?? this.batteryPercentage,
      leftMotorSpeed: leftMotorSpeed ?? this.leftMotorSpeed,
      rightMotorSpeed: rightMotorSpeed ?? this.rightMotorSpeed,
      motorDirection: motorDirection ?? this.motorDirection,
      obstacleDetected: obstacleDetected ?? this.obstacleDetected,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  @override
  String toString() {
    return 'SensorData(irSensors: $irSensors, ultrasonicDistance: $ultrasonicDistance, batteryVoltage: $batteryVoltage, batteryPercentage: $batteryPercentage, leftMotorSpeed: $leftMotorSpeed, rightMotorSpeed: $rightMotorSpeed, motorDirection: $motorDirection, obstacleDetected: $obstacleDetected, timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SensorData &&
        other.irSensors == irSensors &&
        other.ultrasonicDistance == ultrasonicDistance &&
        other.batteryVoltage == batteryVoltage &&
        other.batteryPercentage == batteryPercentage &&
        other.leftMotorSpeed == leftMotorSpeed &&
        other.rightMotorSpeed == rightMotorSpeed &&
        other.motorDirection == motorDirection &&
        other.obstacleDetected == obstacleDetected;
  }

  @override
  int get hashCode {
    return Object.hash(
      irSensors,
      ultrasonicDistance,
      batteryVoltage,
      batteryPercentage,
      leftMotorSpeed,
      rightMotorSpeed,
      motorDirection,
      obstacleDetected,
    );
  }
}

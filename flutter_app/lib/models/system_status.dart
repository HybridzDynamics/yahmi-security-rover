class SystemStatus {
  final bool isConnected;
  final String mode;
  final int batteryLevel;
  final double batteryVoltage;
  final bool obstacleDetected;
  final bool isRunning;
  final int uptime;
  final int freeHeap;
  final int cpuFreq;
  final String wifiSSID;
  final String ipAddress;
  final int wifiSignal;
  final double storageUsage;
  final DateTime timestamp;

  SystemStatus({
    required this.isConnected,
    required this.mode,
    required this.batteryLevel,
    required this.batteryVoltage,
    required this.obstacleDetected,
    required this.isRunning,
    required this.uptime,
    required this.freeHeap,
    required this.cpuFreq,
    required this.wifiSSID,
    required this.ipAddress,
    required this.wifiSignal,
    required this.storageUsage,
    required this.timestamp,
  });

  factory SystemStatus.fromJson(Map<String, dynamic> json) {
    return SystemStatus(
      isConnected: json['isConnected'] ?? false,
      mode: json['mode'] ?? 'manual',
      batteryLevel: json['batteryLevel'] ?? 0,
      batteryVoltage: (json['batteryVoltage'] ?? 0.0).toDouble(),
      obstacleDetected: json['obstacleDetected'] ?? false,
      isRunning: json['isRunning'] ?? false,
      uptime: json['uptime'] ?? 0,
      freeHeap: json['freeHeap'] ?? 0,
      cpuFreq: json['cpuFreq'] ?? 0,
      wifiSSID: json['wifiSSID'] ?? '',
      ipAddress: json['ipAddress'] ?? '',
      wifiSignal: json['wifiSignal'] ?? 0,
      storageUsage: (json['storageUsage'] ?? 0.0).toDouble(),
      timestamp: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isConnected': isConnected,
      'mode': mode,
      'batteryLevel': batteryLevel,
      'batteryVoltage': batteryVoltage,
      'obstacleDetected': obstacleDetected,
      'isRunning': isRunning,
      'uptime': uptime,
      'freeHeap': freeHeap,
      'cpuFreq': cpuFreq,
      'wifiSSID': wifiSSID,
      'ipAddress': ipAddress,
      'wifiSignal': wifiSignal,
      'storageUsage': storageUsage,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  SystemStatus copyWith({
    bool? isConnected,
    String? mode,
    int? batteryLevel,
    double? batteryVoltage,
    bool? obstacleDetected,
    bool? isRunning,
    int? uptime,
    int? freeHeap,
    int? cpuFreq,
    String? wifiSSID,
    String? ipAddress,
    int? wifiSignal,
    double? storageUsage,
    DateTime? timestamp,
  }) {
    return SystemStatus(
      isConnected: isConnected ?? this.isConnected,
      mode: mode ?? this.mode,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      batteryVoltage: batteryVoltage ?? this.batteryVoltage,
      obstacleDetected: obstacleDetected ?? this.obstacleDetected,
      isRunning: isRunning ?? this.isRunning,
      uptime: uptime ?? this.uptime,
      freeHeap: freeHeap ?? this.freeHeap,
      cpuFreq: cpuFreq ?? this.cpuFreq,
      wifiSSID: wifiSSID ?? this.wifiSSID,
      ipAddress: ipAddress ?? this.ipAddress,
      wifiSignal: wifiSignal ?? this.wifiSignal,
      storageUsage: storageUsage ?? this.storageUsage,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  @override
  String toString() {
    return 'SystemStatus(isConnected: $isConnected, mode: $mode, batteryLevel: $batteryLevel, batteryVoltage: $batteryVoltage, obstacleDetected: $obstacleDetected, isRunning: $isRunning, uptime: $uptime, freeHeap: $freeHeap, cpuFreq: $cpuFreq, wifiSSID: $wifiSSID, ipAddress: $ipAddress, wifiSignal: $wifiSignal, storageUsage: $storageUsage, timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SystemStatus &&
        other.isConnected == isConnected &&
        other.mode == mode &&
        other.batteryLevel == batteryLevel &&
        other.batteryVoltage == batteryVoltage &&
        other.obstacleDetected == obstacleDetected &&
        other.isRunning == isRunning &&
        other.uptime == uptime &&
        other.freeHeap == freeHeap &&
        other.cpuFreq == cpuFreq &&
        other.wifiSSID == wifiSSID &&
        other.ipAddress == ipAddress &&
        other.wifiSignal == wifiSignal &&
        other.storageUsage == storageUsage;
  }

  @override
  int get hashCode {
    return Object.hash(
      isConnected,
      mode,
      batteryLevel,
      batteryVoltage,
      obstacleDetected,
      isRunning,
      uptime,
      freeHeap,
      cpuFreq,
      wifiSSID,
      ipAddress,
      wifiSignal,
      storageUsage,
    );
  }
}

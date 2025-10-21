import 'package:flutter/material.dart';
import '../services/websocket_service.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class ConnectionProvider extends ChangeNotifier {
  bool _isConnected = false;
  bool _isConnecting = false;
  String _serverUrl = '192.168.1.100';
  int _port = 80;
  int _wsPort = 81;
  DateTime? _lastConnected;
  String _connectionStatus = 'Disconnected';
  int _reconnectAttempts = 0;
  int _maxReconnectAttempts = 5;
  bool _autoReconnect = true;

  // Getters
  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;
  String get serverUrl => _serverUrl;
  int get port => _port;
  int get wsPort => _wsPort;
  DateTime? get lastConnected => _lastConnected;
  String get connectionStatus => _connectionStatus;
  int get reconnectAttempts => _reconnectAttempts;
  bool get autoReconnect => _autoReconnect;

  // Initialize connection provider
  void initialize() {
    _loadSettings();
    _setupWebSocketCallbacks();
  }

  Future<void> _loadSettings() async {
    _serverUrl = StorageService.getServerUrl();
    _port = StorageService.getServerPort();
    _wsPort = StorageService.getSetting<int>('ws_port', defaultValue: 81) ?? 81;
    _autoReconnect = StorageService.getAutoConnect();
  }

  void _setupWebSocketCallbacks() {
    WebSocketService.onConnected = () {
      _isConnected = true;
      _isConnecting = false;
      _lastConnected = DateTime.now();
      _connectionStatus = 'Connected';
      _reconnectAttempts = 0;
      notifyListeners();
    };

    WebSocketService.onDisconnected = () {
      _isConnected = false;
      _isConnecting = false;
      _connectionStatus = 'Disconnected';
      notifyListeners();
      
      if (_autoReconnect && _reconnectAttempts < _maxReconnectAttempts) {
        _attemptReconnect();
      }
    };

    WebSocketService.onError = (error) {
      _isConnecting = false;
      _connectionStatus = 'Error: $error';
      notifyListeners();
    };
  }

  Future<bool> connect({String? serverUrl, int? port, int? wsPort}) async {
    if (_isConnecting) return false;
    
    _isConnecting = true;
    _connectionStatus = 'Connecting...';
    notifyListeners();

    try {
      // Update server settings if provided
      if (serverUrl != null) _serverUrl = serverUrl;
      if (port != null) _port = port;
      if (wsPort != null) _wsPort = wsPort;

      // Save settings
      await StorageService.saveServerConfig(_serverUrl, _port);
      await StorageService.saveSetting('ws_port', _wsPort);

      // Set API service base URL
      ApiService.setBaseUrl(_serverUrl, port: _port);

      // Test API connection first
      final apiConnected = await ApiService.testConnection();
      if (!apiConnected) {
        throw Exception('API connection failed');
      }

      // Connect WebSocket
      final wsConnected = await WebSocketService.connect(_serverUrl, port: _wsPort);
      if (!wsConnected) {
        throw Exception('WebSocket connection failed');
      }

      return true;
    } catch (e) {
      _isConnecting = false;
      _connectionStatus = 'Connection failed: $e';
      notifyListeners();
      return false;
    }
  }

  void disconnect() {
    WebSocketService.disconnect();
    _isConnected = false;
    _isConnecting = false;
    _connectionStatus = 'Disconnected';
    _reconnectAttempts = 0;
    notifyListeners();
  }

  void _attemptReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _connectionStatus = 'Max reconnect attempts reached';
      notifyListeners();
      return;
    }

    _reconnectAttempts++;
    _connectionStatus = 'Reconnecting... (${_reconnectAttempts}/$_maxReconnectAttempts)';
    notifyListeners();

    Future.delayed(Duration(seconds: _reconnectAttempts * 2), () {
      if (!_isConnected) {
        connect();
      }
    });
  }

  Future<void> setServerSettings(String serverUrl, int port, int wsPort) async {
    _serverUrl = serverUrl;
    _port = port;
    _wsPort = wsPort;
    
    await StorageService.saveServerConfig(serverUrl, port);
    await StorageService.saveSetting('ws_port', wsPort);
    
    notifyListeners();
  }

  void setAutoReconnect(bool enabled) {
    _autoReconnect = enabled;
    StorageService.saveSetting('auto_reconnect', enabled);
    notifyListeners();
  }

  void setMaxReconnectAttempts(int attempts) {
    _maxReconnectAttempts = attempts;
    StorageService.saveSetting('max_reconnect_attempts', attempts);
    notifyListeners();
  }

  Future<void> testConnection() async {
    try {
      _connectionStatus = 'Testing connection...';
      notifyListeners();
      
      final connected = await ApiService.testConnection();
      if (connected) {
        _connectionStatus = 'Connection test successful';
      } else {
        _connectionStatus = 'Connection test failed';
      }
      notifyListeners();
    } catch (e) {
      _connectionStatus = 'Connection test error: $e';
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> getSystemStatus() async {
    try {
      return await ApiService.getSystemStatus();
    } catch (e) {
      throw Exception('Failed to get system status: $e');
    }
  }

  Future<Map<String, dynamic>> getSensorData() async {
    try {
      return await ApiService.getSensorData();
    } catch (e) {
      throw Exception('Failed to get sensor data: $e');
    }
  }

  void sendCommand(String command, {String? action, dynamic value}) {
    if (_isConnected) {
      WebSocketService.sendControlCommand(command, action: action, value: value);
    }
  }

  void sendMotorCommand(String action, {int? speed}) {
    if (_isConnected) {
      WebSocketService.sendMotorCommand(action, speed: speed);
    }
  }

  void sendCameraCommand(String action, {dynamic value}) {
    if (_isConnected) {
      WebSocketService.sendCameraCommand(action, value: value);
    }
  }

  void sendAudioCommand(String action, {dynamic value}) {
    if (_isConnected) {
      WebSocketService.sendAudioCommand(action, value: value);
    }
  }

  void sendSystemCommand(String action, {dynamic value}) {
    if (_isConnected) {
      WebSocketService.sendSystemCommand(action, value: value);
    }
  }

  void setMode(String mode) {
    if (_isConnected) {
      WebSocketService.setMode(mode);
    }
  }

  void ping() {
    if (_isConnected) {
      WebSocketService.ping();
    }
  }

  @override
  void dispose() {
    WebSocketService.dispose();
    super.dispose();
  }
}

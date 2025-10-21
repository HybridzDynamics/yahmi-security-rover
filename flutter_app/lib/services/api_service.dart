import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static String _baseUrl = '';
  static int _port = 80;
  static Duration _timeout = const Duration(seconds: 10);

  static Future<void> init() async {
    // Initialize API service
  }

  static void setBaseUrl(String url, {int port = 80}) {
    _baseUrl = url;
    _port = port;
  }

  static String get baseUrl => 'http://$_baseUrl:$_port';

  static Future<Map<String, dynamic>> _makeRequest(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/$endpoint');
      final requestHeaders = {
        'Content-Type': 'application/json',
        ...?headers,
      };

      http.Response response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: requestHeaders).timeout(_timeout);
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          ).timeout(_timeout);
          break;
        case 'PUT':
          response = await http.put(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          ).timeout(_timeout);
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: requestHeaders).timeout(_timeout);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      } else {
        throw HttpException('HTTP ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      throw Exception('API request failed: $e');
    }
  }

  // System Status
  static Future<Map<String, dynamic>> getSystemStatus() async {
    return await _makeRequest('status');
  }

  // Control Commands
  static Future<Map<String, dynamic>> sendControlCommand(
    String command, {
    String? action,
    dynamic value,
  }) async {
    final body = {
      'command': command,
      if (action != null) 'action': action,
      if (value != null) 'value': value,
    };
    return await _makeRequest('control', method: 'POST', body: body);
  }

  // Motor Control
  static Future<Map<String, dynamic>> controlMotor(String action, {int? speed}) async {
    return await sendControlCommand('motor', action: action, value: speed);
  }

  // Camera Control
  static Future<Map<String, dynamic>> controlCamera(String action, {dynamic value}) async {
    return await sendControlCommand('camera', action: action, value: value);
  }

  // Audio Control
  static Future<Map<String, dynamic>> controlAudio(String action, {dynamic value}) async {
    return await sendControlCommand('audio', action: action, value: value);
  }

  // System Control
  static Future<Map<String, dynamic>> controlSystem(String action, {dynamic value}) async {
    return await sendControlCommand('system', action: action, value: value);
  }

  // Configuration
  static Future<Map<String, dynamic>> getConfiguration() async {
    return await _makeRequest('config');
  }

  static Future<Map<String, dynamic>> updateConfiguration(Map<String, dynamic> config) async {
    return await _makeRequest('config', method: 'POST', body: config);
  }

  // Sensor Data
  static Future<Map<String, dynamic>> getSensorData() async {
    return await _makeRequest('data/sensors');
  }

  static Future<Map<String, dynamic>> getBatteryData() async {
    return await _makeRequest('data/battery');
  }

  // Video Stream
  static Future<Map<String, dynamic>> getVideoInfo() async {
    return await _makeRequest('video');
  }

  // Audio Stream
  static Future<Map<String, dynamic>> getAudioInfo() async {
    return await _makeRequest('audio');
  }

  // Storage
  static Future<Map<String, dynamic>> getStorageInfo() async {
    return await _makeRequest('storage');
  }

  // Logs
  static Future<Map<String, dynamic>> getLogs() async {
    return await _makeRequest('logs');
  }

  // System Info
  static Future<Map<String, dynamic>> getSystemInfo() async {
    return await _makeRequest('system');
  }

  // Restart System
  static Future<Map<String, dynamic>> restartSystem() async {
    return await controlSystem('restart');
  }

  // Test Connection
  static Future<bool> testConnection() async {
    try {
      await getSystemStatus();
      return true;
    } catch (e) {
      return false;
    }
  }

  // Set Timeout
  static void setTimeout(Duration timeout) {
    _timeout = timeout;
  }
}

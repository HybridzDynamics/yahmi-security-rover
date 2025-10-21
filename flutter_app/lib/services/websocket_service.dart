import 'dart:convert';
import 'dart:io';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

class WebSocketService {
  static WebSocketService? _instance;
  static WebSocketChannel? _channel;
  static bool _isConnected = false;
  static String _serverUrl = '';
  static int _port = 81;
  
  // Callbacks
  static Function(Map<String, dynamic>)? onMessage;
  static Function()? onConnected;
  static Function()? onDisconnected;
  static Function(dynamic)? onError;

  static Future<void> init() async {
    _instance = WebSocketService();
  }

  static Future<bool> connect(String serverUrl, {int port = 81}) async {
    try {
      _serverUrl = serverUrl;
      _port = port;
      
      final uri = Uri.parse('ws://$serverUrl:$port');
      _channel = WebSocketChannel.connect(uri);
      
      _channel!.stream.listen(
        (data) {
          try {
            final message = jsonDecode(data);
            onMessage?.call(message);
          } catch (e) {
            print('Error parsing WebSocket message: $e');
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
          _isConnected = false;
          onError?.call(error);
        },
        onDone: () {
          print('WebSocket connection closed');
          _isConnected = false;
          onDisconnected?.call();
        },
      );
      
      _isConnected = true;
      onConnected?.call();
      return true;
    } catch (e) {
      print('Failed to connect to WebSocket: $e');
      _isConnected = false;
      onError?.call(e);
      return false;
    }
  }

  static void disconnect() {
    _channel?.sink.close(status.goingAway);
    _isConnected = false;
    onDisconnected?.call();
  }

  static bool get isConnected => _isConnected;

  static void sendMessage(Map<String, dynamic> message) {
    if (_isConnected && _channel != null) {
      try {
        _channel!.sink.add(jsonEncode(message));
      } catch (e) {
        print('Error sending WebSocket message: $e');
        onError?.call(e);
      }
    }
  }

  static void sendControlCommand(String command, {String? action, dynamic value}) {
    final message = {
      'type': 'control',
      'command': command,
      if (action != null) 'action': action,
      if (value != null) 'value': value,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    sendMessage(message);
  }

  static void sendMotorCommand(String action, {int? speed}) {
    sendControlCommand('motor', action: action, value: speed);
  }

  static void sendCameraCommand(String action, {dynamic value}) {
    sendControlCommand('camera', action: action, value: value);
  }

  static void sendAudioCommand(String action, {dynamic value}) {
    sendControlCommand('audio', action: action, value: value);
  }

  static void sendSystemCommand(String action, {dynamic value}) {
    sendControlCommand('system', action: action, value: value);
  }

  static void setMode(String mode) {
    sendControlCommand('mode', value: mode == 'manual' ? 0 : 1);
  }

  static void ping() {
    sendMessage({
      'type': 'ping',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  static void dispose() {
    disconnect();
    _instance = null;
  }
}

import 'package:shared_preferences/shared_preferences.dart';
import 'package:hive_flutter/hive_flutter.dart';

class StorageService {
  static late Box _settingsBox;
  static late Box _historyBox;
  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    
    // Initialize Hive boxes
    _settingsBox = await Hive.openBox('settings');
    _historyBox = await Hive.openBox('history');
  }

  // Settings Storage
  static Future<void> saveSetting(String key, dynamic value) async {
    await _settingsBox.put(key, value);
  }

  static T? getSetting<T>(String key, {T? defaultValue}) {
    return _settingsBox.get(key, defaultValue: defaultValue);
  }

  static Future<void> removeSetting(String key) async {
    await _settingsBox.delete(key);
  }

  // History Storage
  static Future<void> saveHistoryItem(String key, Map<String, dynamic> data) async {
    await _historyBox.put(key, data);
  }

  static Map<String, dynamic>? getHistoryItem(String key) {
    return _historyBox.get(key);
  }

  static List<Map<String, dynamic>> getAllHistory() {
    return _historyBox.values.cast<Map<String, dynamic>>().toList();
  }

  static Future<void> removeHistoryItem(String key) async {
    await _historyBox.delete(key);
  }

  static Future<void> clearHistory() async {
    await _historyBox.clear();
  }

  // SharedPreferences Storage
  static Future<void> savePreference(String key, dynamic value) async {
    if (value is String) {
      await _prefs.setString(key, value);
    } else if (value is int) {
      await _prefs.setInt(key, value);
    } else if (value is double) {
      await _prefs.setDouble(key, value);
    } else if (value is bool) {
      await _prefs.setBool(key, value);
    } else if (value is List<String>) {
      await _prefs.setStringList(key, value);
    }
  }

  static T? getPreference<T>(String key, {T? defaultValue}) {
    return _prefs.get(key) as T? ?? defaultValue;
  }

  static Future<void> removePreference(String key) async {
    await _prefs.remove(key);
  }

  // Server Configuration
  static Future<void> saveServerConfig(String serverUrl, int port) async {
    await saveSetting('server_url', serverUrl);
    await saveSetting('server_port', port);
  }

  static String getServerUrl() {
    return getSetting<String>('server_url', defaultValue: '192.168.1.100') ?? '192.168.1.100';
  }

  static int getServerPort() {
    return getSetting<int>('server_port', defaultValue: 80) ?? 80;
  }

  // App Settings
  static Future<void> saveAppSettings({
    bool? isDarkMode,
    bool? autoConnect,
    bool? notifications,
    String? language,
  }) async {
    if (isDarkMode != null) await saveSetting('is_dark_mode', isDarkMode);
    if (autoConnect != null) await saveSetting('auto_connect', autoConnect);
    if (notifications != null) await saveSetting('notifications', notifications);
    if (language != null) await saveSetting('language', language);
  }

  static bool getIsDarkMode() {
    return getSetting<bool>('is_dark_mode', defaultValue: false) ?? false;
  }

  static bool getAutoConnect() {
    return getSetting<bool>('auto_connect', defaultValue: true) ?? true;
  }

  static bool getNotifications() {
    return getSetting<bool>('notifications', defaultValue: true) ?? true;
  }

  static String getLanguage() {
    return getSetting<String>('language', defaultValue: 'en') ?? 'en';
  }

  // Connection History
  static Future<void> saveConnectionHistory(String serverUrl, int port, bool success) async {
    final historyItem = {
      'serverUrl': serverUrl,
      'port': port,
      'success': success,
      'timestamp': DateTime.now().toIso8601String(),
    };
    
    final key = '${serverUrl}:$port';
    await saveHistoryItem(key, historyItem);
  }

  static List<Map<String, dynamic>> getConnectionHistory() {
    return getAllHistory().where((item) => item.containsKey('serverUrl')).toList();
  }

  // Sensor Data History
  static Future<void> saveSensorDataHistory(Map<String, dynamic> sensorData) async {
    final key = 'sensor_${DateTime.now().millisecondsSinceEpoch}';
    await saveHistoryItem(key, sensorData);
  }

  static List<Map<String, dynamic>> getSensorDataHistory() {
    return getAllHistory().where((item) => item.containsKey('sensorData')).toList();
  }

  // System Status History
  static Future<void> saveSystemStatusHistory(Map<String, dynamic> systemStatus) async {
    final key = 'status_${DateTime.now().millisecondsSinceEpoch}';
    await saveHistoryItem(key, systemStatus);
  }

  static List<Map<String, dynamic>> getSystemStatusHistory() {
    return getAllHistory().where((item) => item.containsKey('systemStatus')).toList();
  }

  // Clear All Data
  static Future<void> clearAllData() async {
    await _settingsBox.clear();
    await _historyBox.clear();
    await _prefs.clear();
  }

  // Export Data
  static Map<String, dynamic> exportData() {
    return {
      'settings': _settingsBox.toMap(),
      'history': _historyBox.toMap(),
      'preferences': _prefs.getKeys().map((key) => {
        'key': key,
        'value': _prefs.get(key),
      }).toList(),
    };
  }

  // Import Data
  static Future<void> importData(Map<String, dynamic> data) async {
    if (data.containsKey('settings')) {
      await _settingsBox.clear();
      for (final entry in (data['settings'] as Map).entries) {
        await _settingsBox.put(entry.key, entry.value);
      }
    }
    
    if (data.containsKey('history')) {
      await _historyBox.clear();
      for (final entry in (data['history'] as Map).entries) {
        await _historyBox.put(entry.key, entry.value);
      }
    }
  }

  // Dispose
  static Future<void> dispose() async {
    await _settingsBox.close();
    await _historyBox.close();
  }
}

import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class AppProvider extends ChangeNotifier {
  bool _isDarkMode = false;
  bool _isFirstLaunch = true;
  String _language = 'en';
  bool _notificationsEnabled = true;
  bool _autoConnect = true;
  String _theme = 'system';

  // Getters
  bool get isDarkMode => _isDarkMode;
  bool get isFirstLaunch => _isFirstLaunch;
  String get language => _language;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get autoConnect => _autoConnect;
  String get theme => _theme;

  // Initialize app settings
  Future<void> loadSettings() async {
    try {
      _isDarkMode = StorageService.getIsDarkMode();
      _language = StorageService.getLanguage();
      _notificationsEnabled = StorageService.getNotifications();
      _autoConnect = StorageService.getAutoConnect();
      
      // Check if this is the first launch
      _isFirstLaunch = StorageService.getPreference<bool>('is_first_launch', defaultValue: true) ?? true;
      
      if (_isFirstLaunch) {
        await _setupFirstLaunch();
      }
      
      notifyListeners();
    } catch (e) {
      print('Error loading app settings: $e');
    }
  }

  Future<void> _setupFirstLaunch() async {
    // Set up default settings for first launch
    await StorageService.saveAppSettings(
      isDarkMode: false,
      language: 'en',
      notifications: true,
      autoConnect: true,
    );
    
    await StorageService.savePreference('is_first_launch', false);
    _isFirstLaunch = false;
  }

  // Theme management
  Future<void> setDarkMode(bool isDark) async {
    _isDarkMode = isDark;
    await StorageService.saveSetting('is_dark_mode', isDark);
    notifyListeners();
  }

  Future<void> setTheme(String theme) async {
    _theme = theme;
    await StorageService.saveSetting('theme', theme);
    
    // Apply theme based on selection
    switch (theme) {
      case 'light':
        _isDarkMode = false;
        break;
      case 'dark':
        _isDarkMode = true;
        break;
      case 'system':
        // Use system theme
        break;
    }
    
    notifyListeners();
  }

  // Language management
  Future<void> setLanguage(String language) async {
    _language = language;
    await StorageService.saveSetting('language', language);
    notifyListeners();
  }

  // Notifications management
  Future<void> setNotificationsEnabled(bool enabled) async {
    _notificationsEnabled = enabled;
    await StorageService.saveSetting('notifications', enabled);
    notifyListeners();
  }

  // Auto-connect management
  Future<void> setAutoConnect(bool enabled) async {
    _autoConnect = enabled;
    await StorageService.saveSetting('auto_connect', enabled);
    notifyListeners();
  }

  // App lifecycle management
  void onAppResumed() {
    // Handle app resume
    notifyListeners();
  }

  void onAppPaused() {
    // Handle app pause
    notifyListeners();
  }

  // Reset all settings
  Future<void> resetSettings() async {
    await StorageService.clearAllData();
    await loadSettings();
  }

  // Export settings
  Map<String, dynamic> exportSettings() {
    return {
      'isDarkMode': _isDarkMode,
      'language': _language,
      'notificationsEnabled': _notificationsEnabled,
      'autoConnect': _autoConnect,
      'theme': _theme,
    };
  }

  // Import settings
  Future<void> importSettings(Map<String, dynamic> settings) async {
    if (settings.containsKey('isDarkMode')) {
      await setDarkMode(settings['isDarkMode']);
    }
    if (settings.containsKey('language')) {
      await setLanguage(settings['language']);
    }
    if (settings.containsKey('notificationsEnabled')) {
      await setNotificationsEnabled(settings['notificationsEnabled']);
    }
    if (settings.containsKey('autoConnect')) {
      await setAutoConnect(settings['autoConnect']);
    }
    if (settings.containsKey('theme')) {
      await setTheme(settings['theme']);
    }
  }
}

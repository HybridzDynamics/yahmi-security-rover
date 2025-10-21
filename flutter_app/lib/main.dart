import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

import 'providers/app_provider.dart';
import 'providers/connection_provider.dart';
import 'providers/camera_provider.dart';
import 'providers/control_provider.dart';
import 'providers/sensor_provider.dart';

import 'screens/splash_screen.dart';
import 'screens/main_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/history_screen.dart';

import 'services/websocket_service.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Initialize services
  await StorageService.init();
  await ApiService.init();
  await WebSocketService.init();
  
  // Request permissions
  await _requestPermissions();
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  
  runApp(const SurveillanceCarApp());
}

Future<void> _requestPermissions() async {
  // Request camera permission
  await Permission.camera.request();
  
  // Request microphone permission
  await Permission.microphone.request();
  
  // Request storage permission
  await Permission.storage.request();
  
  // Request location permission (for network discovery)
  await Permission.location.request();
}

class SurveillanceCarApp extends StatelessWidget {
  const SurveillanceCarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()),
        ChangeNotifierProvider(create: (_) => ConnectionProvider()),
        ChangeNotifierProvider(create: (_) => CameraProvider()),
        ChangeNotifierProvider(create: (_) => ControlProvider()),
        ChangeNotifierProvider(create: (_) => SensorProvider()),
      ],
      child: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          return MaterialApp(
            title: 'Surveillance Car',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              primarySwatch: Colors.blue,
              primaryColor: const Color(0xFF2196F3),
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF2196F3),
                brightness: Brightness.light,
              ),
              useMaterial3: true,
              fontFamily: 'Roboto',
              appBarTheme: const AppBarTheme(
                backgroundColor: Color(0xFF2196F3),
                foregroundColor: Colors.white,
                elevation: 0,
                centerTitle: true,
              ),
              cardTheme: CardTheme(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            darkTheme: ThemeData(
              primarySwatch: Colors.blue,
              primaryColor: const Color(0xFF1976D2),
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF1976D2),
                brightness: Brightness.dark,
              ),
              useMaterial3: true,
              fontFamily: 'Roboto',
              appBarTheme: const AppBarTheme(
                backgroundColor: Color(0xFF1976D2),
                foregroundColor: Colors.white,
                elevation: 0,
                centerTitle: true,
              ),
              cardTheme: CardTheme(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            themeMode: appProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            home: const SplashScreen(),
            routes: {
              '/main': (context) => const MainScreen(),
              '/settings': (context) => const SettingsScreen(),
              '/history': (context) => const HistoryScreen(),
            },
          );
        },
      ),
    );
  }
}

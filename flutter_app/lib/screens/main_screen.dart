import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connection_provider.dart';
import '../providers/camera_provider.dart';
import '../providers/control_provider.dart';
import '../providers/sensor_provider.dart';
import '../widgets/connection_status.dart';
import '../widgets/video_stream.dart';
import '../widgets/control_panel.dart';
import '../widgets/sensor_display.dart';
import '../widgets/system_status.dart';
import 'settings_screen.dart';
import 'history_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _fabAnimationController;
  late Animation<double> _fabAnimation;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fabAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fabAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fabAnimationController, curve: Curves.easeInOut),
    );
    
    _fabAnimationController.forward();
    
    // Initialize providers
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeProviders();
    });
  }

  void _initializeProviders() {
    final connectionProvider = Provider.of<ConnectionProvider>(context, listen: false);
    final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
    final controlProvider = Provider.of<ControlProvider>(context, listen: false);
    final sensorProvider = Provider.of<SensorProvider>(context, listen: false);
    
    // Initialize connections
    connectionProvider.initialize();
    cameraProvider.initialize();
    controlProvider.initialize();
    sensorProvider.initialize();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fabAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Surveillance Car'),
        actions: [
          Consumer<ConnectionProvider>(
            builder: (context, connectionProvider, child) {
              return IconButton(
                icon: Icon(
                  connectionProvider.isConnected
                      ? Icons.wifi
                      : Icons.wifi_off,
                  color: connectionProvider.isConnected
                      ? Colors.green
                      : Colors.red,
                ),
                onPressed: () => _showConnectionDialog(),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => _navigateToSettings(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.videocam), text: 'Live Feed'),
            Tab(icon: Icon(Icons.gamepad), text: 'Control'),
            Tab(icon: Icon(Icons.analytics), text: 'Status'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Live Feed Tab
          _buildLiveFeedTab(),
          // Control Tab
          _buildControlTab(),
          // Status Tab
          _buildStatusTab(),
        ],
      ),
      floatingActionButton: AnimatedBuilder(
        animation: _fabAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _fabAnimation.value,
            child: Consumer<ConnectionProvider>(
              builder: (context, connectionProvider, child) {
                return FloatingActionButton(
                  onPressed: connectionProvider.isConnected
                      ? _disconnect
                      : _connect,
                  backgroundColor: connectionProvider.isConnected
                      ? Colors.red
                      : Colors.green,
                  child: Icon(
                    connectionProvider.isConnected
                        ? Icons.stop
                        : Icons.play_arrow,
                  ),
                );
              },
            ),
          );
        },
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildLiveFeedTab() {
    return Column(
      children: [
        // Connection Status
        const ConnectionStatus(),
        
        // Video Stream
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: const VideoStream(),
            ),
          ),
        ),
        
        // Quick Controls
        _buildQuickControls(),
      ],
    );
  }

  Widget _buildControlTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Control Panel
          const ControlPanel(),
          
          const SizedBox(height: 20),
          
          // Sensor Display
          const SensorDisplay(),
        ],
      ),
    );
  }

  Widget _buildStatusTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // System Status
          const SystemStatus(),
          
          const SizedBox(height: 20),
          
          // Connection Info
          _buildConnectionInfo(),
        ],
      ),
    );
  }

  Widget _buildQuickControls() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildQuickControlButton(
            icon: Icons.camera_alt,
            label: 'Capture',
            onPressed: () => _captureImage(),
          ),
          _buildQuickControlButton(
            icon: Icons.videocam,
            label: 'Record',
            onPressed: () => _toggleRecording(),
          ),
          _buildQuickControlButton(
            icon: Icons.stop,
            label: 'Stop',
            onPressed: () => _stopMotors(),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FloatingActionButton(
          mini: true,
          onPressed: onPressed,
          child: Icon(icon),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildConnectionInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Connection Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Consumer<ConnectionProvider>(
              builder: (context, connectionProvider, child) {
                return Column(
                  children: [
                    _buildInfoRow('Status', connectionProvider.isConnected ? 'Connected' : 'Disconnected'),
                    _buildInfoRow('Server', connectionProvider.serverUrl),
                    _buildInfoRow('Port', connectionProvider.port.toString()),
                    _buildInfoRow('Last Connected', connectionProvider.lastConnected?.toString() ?? 'Never'),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(value),
        ],
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBottomNavItem(
                icon: Icons.home,
                label: 'Home',
                onTap: () => _tabController.animateTo(0),
              ),
              _buildBottomNavItem(
                icon: Icons.history,
                label: 'History',
                onTap: () => _navigateToHistory(),
              ),
              _buildBottomNavItem(
                icon: Icons.settings,
                label: 'Settings',
                onTap: () => _navigateToSettings(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNavItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: Colors.white,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  void _showConnectionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Connection Settings'),
        content: const Text('Connection settings dialog would go here'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _navigateToSettings() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const SettingsScreen()),
    );
  }

  void _navigateToHistory() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const HistoryScreen()),
    );
  }

  void _connect() {
    final connectionProvider = Provider.of<ConnectionProvider>(context, listen: false);
    connectionProvider.connect();
  }

  void _disconnect() {
    final connectionProvider = Provider.of<ConnectionProvider>(context, listen: false);
    connectionProvider.disconnect();
  }

  void _captureImage() {
    final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
    cameraProvider.captureImage();
  }

  void _toggleRecording() {
    final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
    cameraProvider.toggleRecording();
  }

  void _stopMotors() {
    final controlProvider = Provider.of<ControlProvider>(context, listen: false);
    controlProvider.stopMotors();
  }
}

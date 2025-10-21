import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connection_provider.dart';
import '../providers/camera_provider.dart';

class VideoStream extends StatefulWidget {
  const VideoStream({super.key});

  @override
  State<VideoStream> createState() => _VideoStreamState();
}

class _VideoStreamState extends State<VideoStream> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startVideoStream();
    });
  }

  void _startVideoStream() {
    final connectionProvider = Provider.of<ConnectionProvider>(context, listen: false);
    final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
    
    if (connectionProvider.isConnected) {
      cameraProvider.startStream();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ConnectionProvider, CameraProvider>(
      builder: (context, connectionProvider, cameraProvider, child) {
        if (!connectionProvider.isConnected) {
          return _buildDisconnectedView();
        }

        if (cameraProvider.isStreaming) {
          return _buildVideoView();
        }

        return _buildLoadingView();
      },
    );
  }

  Widget _buildDisconnectedView() {
    return Container(
      color: Colors.grey[900],
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.wifi_off,
              size: 64,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'Not Connected',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Connect to surveillance car to view live feed',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoView() {
    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          // Video stream placeholder
          Center(
            child: Container(
              width: double.infinity,
              height: double.infinity,
              color: Colors.black,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.videocam,
                      size: 64,
                      color: Colors.white,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Live Video Stream',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'MJPEG Stream from ESP32-CAM',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Video controls overlay
          Positioned(
            top: 16,
            right: 16,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildControlButton(
                  icon: Icons.camera_alt,
                  onPressed: () => _captureImage(),
                ),
                const SizedBox(width: 8),
                _buildControlButton(
                  icon: cameraProvider.isRecording
                      ? Icons.stop
                      : Icons.videocam,
                  onPressed: () => _toggleRecording(),
                  isActive: cameraProvider.isRecording,
                ),
              ],
            ),
          ),
          
          // Recording indicator
          if (cameraProvider.isRecording)
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.fiber_manual_record,
                      color: Colors.white,
                      size: 16,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'REC',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoadingView() {
    return Container(
      color: Colors.grey[900],
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
            ),
            SizedBox(height: 16),
            Text(
              'Starting video stream...',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required VoidCallback onPressed,
    bool isActive = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isActive ? Colors.red : Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: IconButton(
        icon: Icon(
          icon,
          color: Colors.white,
          size: 20,
        ),
        onPressed: onPressed,
      ),
    );
  }

  void _captureImage() {
    final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
    cameraProvider.captureImage();
  }

  void _toggleRecording() {
    final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
    cameraProvider.toggleRecording();
  }
}

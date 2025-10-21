import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connection_provider.dart';

class ConnectionStatus extends StatelessWidget {
  const ConnectionStatus({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectionProvider>(
      builder: (context, connectionProvider, child) {
        return Container(
          margin: const EdgeInsets.all(8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: connectionProvider.isConnected
                ? Colors.green.withOpacity(0.1)
                : Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: connectionProvider.isConnected
                  ? Colors.green
                  : Colors.red,
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                connectionProvider.isConnected
                    ? Icons.wifi
                    : Icons.wifi_off,
                color: connectionProvider.isConnected
                    ? Colors.green
                    : Colors.red,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                connectionProvider.connectionStatus,
                style: TextStyle(
                  color: connectionProvider.isConnected
                      ? Colors.green[700]
                      : Colors.red[700],
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
              ),
              if (connectionProvider.isConnecting) ...[
                const SizedBox(width: 8),
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

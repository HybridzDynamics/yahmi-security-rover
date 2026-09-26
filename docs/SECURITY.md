# Yahmi Security Rover - Security Architecture & Policy

Please review the primary [SECURITY.md](../SECURITY.md) located at the root of the repository.

## Summary of Security Controls

### 1. Network Boundary Security
- Hardware nodes (ESP32-CAM and Raspberry Pi) operate on a dedicated WPA2/WPA3 enterprise or isolated IoT VLAN.
- Rover communication uses TLS/WSS (WebSockets over TLS) when operating across non-trusted subnets.

### 2. Node.js API Defense
- **Helmet.js**: Implements Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and disables MIME-type sniffing.
- **Express Rate Limiter**: Configured with a default of 1000 requests per 15 minutes per IP window to prevent DDoS and credential stuffing.
- **Payload Size Capping**: Request limits capped at 50MB for telemetry and video chunks to avoid memory starvation.

### 3. Identity and Credential Management
- Sensitive keys (`JWT_SECRET`, `MONGO_PASSWORD`, `REDIS_PASSWORD`) are passed strictly via environment variables or secret vaults.
- No plaintext passwords or private keys are tracked in Git.

# Production Deployment Guide

This guide covers production deployment strategies for the **Yahmi Security Rover** ecosystem, including Docker containerization, Linux Systemd services, Nginx reverse proxy configuration with TLS/SSL, and database backup routines.

---

## 📋 Prerequisites

- **Host OS**: Ubuntu 22.04 LTS, Debian 12, or Raspberry Pi OS (64-bit)
- **Docker**: Engine version 24.0+ and Docker Compose v2+
- **Node.js**: v18.x or v20.x LTS (if running bare-metal)
- **Domain & SSL**: Valid domain with DNS pointing to server, Ports 80 & 443 open

---

## 🐳 Method 1: Docker Compose Deployment (Recommended)

### 1. Clone & Configure
```bash
git clone https://github.com/HybridzDynamics/yahmi-security-rover.git /opt/yahmi-security-rover
cd /opt/yahmi-security-rover

cp .env.example .env
# Edit .env with strong production credentials
nano .env
```

### 2. Deploy using Automated Script
```bash
chmod +x scripts/deploy.sh scripts/health-check.sh
./scripts/deploy.sh
```

Or deploy manually via Docker Compose:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Verify Containers & Services
```bash
docker compose -f docker-compose.prod.yml ps
./scripts/health-check.sh
```

---

## 🐧 Method 2: Systemd Bare-Metal Deployment

For deploying the Web Dashboard directly on Linux:

### 1. Create Application Directory & Install Dependencies
```bash
cd /opt/yahmi-security-rover/web_dashboard
npm ci --omit=dev
```

### 2. Configure Systemd Service File
Create `/etc/systemd/system/yahmi-rover.service`:
```ini
[Unit]
Description=Yahmi Security Rover Web Dashboard
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/yahmi-security-rover/web_dashboard
EnvironmentFile=/opt/yahmi-security-rover/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=yahmi-rover

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable yahmi-rover
sudo systemctl start yahmi-rover
sudo systemctl status yahmi-rover
```

---

## 🔒 Nginx Reverse Proxy with TLS/SSL

To expose the Rover Web Dashboard over HTTPS and secure WebSockets (`wss://`):

### 1. Nginx Configuration
Create `/etc/nginx/sites-available/yahmi-rover.conf`:
```nginx
server {
    listen 80;
    server_name rover.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rover.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/rover.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rover.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### 2. Enable Site and Obtain Certificate
```bash
sudo ln -s /etc/nginx/sites-available/yahmi-rover.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d rover.yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🗄️ Database Backup & Maintenance

### Daily MongoDB Dump Cronjob
Add to `crontab -e`:
```bash
0 2 * * * docker exec yahmi-rover-mongodb-prod mongodump --out /data/db/backup-$(date +\%F) && find /var/lib/docker/volumes/prod_mongo_data/_data/backup* -mtime +14 -exec rm -rf {} \;
```

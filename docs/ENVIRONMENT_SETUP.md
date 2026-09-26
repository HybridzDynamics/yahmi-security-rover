# Environment & Secrets Configuration Guide

This document outlines environment variable configuration and external integrations for the Yahmi Security Rover platform.

---

## 🔑 Environment Lifecycle Matrix

| Variable | Development Default | Staging | Production | Description |
|---|---|---|---|---|
| `NODE_ENV` | `development` | `staging` | `production` | Node execution environment |
| `PORT` | `3000` | `3000` | `3000` | HTTP/WS bind port |
| `MONGODB_URI` | `mongodb://localhost:27017/yahmi_dev` | Cluster URI | Replicated Cluster URI | Primary database connection string |
| `JWT_SECRET` | Auto-generated dev key | 64-char random | 64-char random | Cryptographic signing key for access tokens |
| `JWT_REFRESH_SECRET` | Auto-generated dev key | 64-char random | 64-char random | Cryptographic signing key for refresh tokens |
| `REDIS_HOST` | `localhost` | `staging-redis` | `prod-redis` | In-memory cache host |

---

## 🛠️ Step-by-Step Integrations

### 1. Generating Secure Keys
Never use default secret strings in production. Generate cryptographically strong random keys via OpenSSL:
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET
openssl rand -hex 32
```

### 2. Google Gemini AI Integration
The Rover supports real-time computer vision analysis via Google Gemini Vision API:
1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Create an API Key.
3. Add to `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

### 3. Email Alerting (Gmail App Password)
To enable automatic alert emails when an intruder is detected:
1. Log in to your Google Account and navigate to **Security** → **2-Step Verification**.
2. Scroll to **App passwords** and generate a new password for "Yahmi Rover".
3. Update `.env`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
   ALERT_EMAIL=security-officer@company.com
   ```

### 4. MongoDB Credentials
For authenticated production databases:
```env
MONGODB_URI=mongodb://yahmi_user:StrongPassword123!@mongo-host:27017/yahmi_security_rover?authSource=admin
```

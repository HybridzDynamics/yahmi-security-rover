# Security Policy

## 🛡️ Supported Versions

We release patches and security advisories for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🔒 Reporting a Vulnerability

The Yahmi Security Rover team takes security seriously. If you discover a vulnerability in any part of this repository (firmware, backend, web dashboard, or mobile client), please report it responsibly.

### How to report:
1. **Do NOT open a public GitHub issue** for undisclosed security vulnerabilities.
2. Email the core security team at **security@yahmi.cloud** or submit a private security advisory through GitHub's Security Advisory tab.
3. Include:
   - Type of issue (e.g. buffer overflow in ESP32 stream parser, unauthorized endpoint bypass, SQL/NoSQL injection)
   - Step-by-step reproduction instructions or proof-of-concept
   - Impact assessment
   - Potential remediation or patch ideas if available

### Response Timeline:
- **Acknowledgement**: Within 48 hours.
- **Triage & Assessment**: Within 5 business days.
- **Patch Release & Advisory**: Within 14 to 30 days depending on severity.

---

## 🛡️ Security Best Practices in Yahmi Rover

- **Authentication**: JWT tokens with short expiry (24h) and secure refresh token exchange.
- **Password Protection**: Passwords salted and hashed with bcrypt (minimum 12 rounds).
- **HTTP Hardening**: Helmet.js enabled to enforce strict CSP, HSTS, frameguard, and X-Content-Type-Options.
- **Rate Limiting**: IP rate limiting enabled on all `/api/` endpoints to mitigate brute force attacks.
- **Hardware Isolation**: ESP32 and Raspberry Pi communication protected by token-based handshakes.

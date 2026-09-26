#!/usr/bin/env bash
# ==============================================================================
# Yahmi Security Rover - Production Deployment Script
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Starting Yahmi Security Rover deployment..."
echo "📂 Project root: ${ROOT_DIR}"

# 1. Check for production environment configuration
if [ ! -f "${ROOT_DIR}/.env" ]; then
    echo "⚠️ .env file not found in root. Checking for web_dashboard/.env..."
    if [ -f "${ROOT_DIR}/web_dashboard/.env" ]; then
        echo "✅ Found web_dashboard/.env, copying to root..."
        cp "${ROOT_DIR}/web_dashboard/.env" "${ROOT_DIR}/.env"
    else
        echo "❌ ERROR: No .env configuration file found!"
        echo "Please copy .env.example to .env and configure secrets before deploying."
        exit 1
    fi
fi

# 2. Check for Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not installed or not in PATH."
    exit 1
fi

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "❌ ERROR: Docker Compose is not installed."
        exit 1
    fi
fi

echo "🐳 Using Docker Compose command: ${COMPOSE_CMD}"

# 3. Pull latest images or build
echo "📦 Building production containers..."
cd "${ROOT_DIR}"
${COMPOSE_CMD} -f docker-compose.prod.yml build

# 4. Bring up stack with zero-downtime recreation
echo "🔄 Starting production stack..."
${COMPOSE_CMD} -f docker-compose.prod.yml up -d --remove-orphans

# 5. Wait and execute health checks
echo "⏳ Waiting 15 seconds for services to initialize..."
sleep 15

HEALTH_URL="http://localhost:3000/health"
echo "🩺 Performing health check against ${HEALTH_URL}..."

if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" || echo "failed")
    if [ "${HTTP_STATUS}" == "200" ]; then
        echo "✅ Health check PASSED! System is fully operational."
    else
        echo "⚠️ Health check returned HTTP status ${HTTP_STATUS}. Check container logs:"
        ${COMPOSE_CMD} -f docker-compose.prod.yml logs --tail=50 dashboard
        exit 1
    fi
else
    echo "ℹ️ curl not installed; skipping local HTTP check."
fi

echo "🎉 Yahmi Security Rover deployed successfully!"

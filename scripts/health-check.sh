#!/usr/bin/env bash
# ==============================================================================
# Yahmi Security Rover - System Health Check Script
# ==============================================================================

set -euo pipefail

TARGET_HOST="${TARGET_HOST:-http://localhost:3000}"
HEALTH_ENDPOINT="${TARGET_HOST}/health"
METRICS_ENDPOINT="${TARGET_HOST}/metrics"

echo "🔍 Probing Yahmi Security Rover at ${TARGET_HOST}..."

# Check Health Endpoint
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${HEALTH_ENDPOINT}" || echo "HTTP_STATUS:000")
    STATUS_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")

    if [ "$STATUS_CODE" -eq 200 ]; then
        echo "✅ [SUCCESS] Health Endpoint is UP (HTTP 200)"
        echo "📊 Status Payload:"
        echo "$BODY"
    else
        echo "❌ [FAILURE] Health Endpoint failed with status code $STATUS_CODE"
        exit 1
    fi

    # Check Metrics Endpoint
    METRICS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${METRICS_ENDPOINT}" || echo "000")
    if [ "$METRICS_CODE" -eq 200 ]; then
        echo "✅ [SUCCESS] Metrics Endpoint is UP (HTTP 200)"
    else
        echo "⚠️ [WARNING] Metrics Endpoint returned HTTP $METRICS_CODE"
    fi
else
    echo "❌ ERROR: curl is required to perform health checks."
    exit 1
fi

echo "✨ All critical health probes succeeded!"
exit 0

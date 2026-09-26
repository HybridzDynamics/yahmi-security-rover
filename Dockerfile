# ==========================================
# Yahmi Security Rover - Production Container
# ==========================================

FROM node:20-alpine AS base

# Install system dependencies (ffmpeg & graphics libraries for camera processing)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    curl

WORKDIR /app

# Install dependencies first for Docker caching
COPY web_dashboard/package*.json ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev

# Copy application source code
COPY web_dashboard/ ./

# Create runtime directories
RUN mkdir -p uploads recordings logs && \
    chown -R node:node /app

# Use non-root node user for security
USER node

# Expose HTTP & WebSocket port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]

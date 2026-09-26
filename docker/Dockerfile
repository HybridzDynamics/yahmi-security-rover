# Yahmi Security Rover - Dockerfile
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ ffmpeg curl

WORKDIR /app

COPY web_dashboard/package*.json ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev

COPY web_dashboard/ ./
RUN mkdir -p uploads recordings logs && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]

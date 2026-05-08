# syntax=docker/dockerfile:1

# ---- deps stage ----
# Install production dependencies only, so the final image stays small.
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# ---- build stage (no-op for this project, kept for future asset pipelines) ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ---- release stage ----
FROM node:20-alpine AS release
WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what's needed to run
COPY --chown=appuser:appgroup --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package.json ./
COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup frontend/ ./frontend/

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]

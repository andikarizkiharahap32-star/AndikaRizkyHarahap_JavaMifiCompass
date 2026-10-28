# ==============================================================================
# P25: Reproducible, Minimal, Hardened Runtime Container
# Multi-stage Dockerfile, Alpine base, Non-root user (10001), Read-only root FS
# ==============================================================================

# 1. Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install dependencies deterministically
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Drizzle schemas
RUN pnpm --filter @javamifi/api db:generate

# Build shared library and API service
RUN pnpm --filter @javamifi/shared build
RUN pnpm --filter @javamifi/api build

# Prune non-production dependencies
RUN pnpm prune --prod

# 3. Production Runner stage (Hardened, Distroless/Alpine, Non-root)
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Create non-root group and user with explicit UID/GID
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3001

# Copy built application and required production node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=appuser:appgroup /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=appuser:appgroup /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=appuser:appgroup /app/apps/api/package.json ./apps/api/package.json

# Security hardening: Drop all capabilities and switch to unprivileged user
USER 10001:10001

# Compatible with read-only root filesystems
VOLUME ["/tmp"]

# Network port exposition
EXPOSE 3001

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Command execution
CMD ["node", "apps/api/dist/apps/api/src/main"]

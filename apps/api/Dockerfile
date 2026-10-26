# ═══════════════════════════════════════════════════════════════
# JavaMifi Compass — API (NestJS) Dockerfile
# ═══════════════════════════════════════════════════════════════
# Multi-stage build for minimal production image

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests for caching
COPY package.json pnpm-lock.yaml* ./
COPY tsconfig*.json ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm run build

# Prune dev dependencies after build
RUN pnpm prune --prod

# ── Stage 3: Production runner ────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

# Security: run as non-root
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy production artifacts
COPY --from=build --chown=nestjs:nestjs /app/dist ./dist
COPY --from=build --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/package.json ./package.json

# Create uploads directory
RUN mkdir -p /app/uploads && chown nestjs:nestjs /app/uploads

USER nestjs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Use dumb-init to handle PID 1 properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

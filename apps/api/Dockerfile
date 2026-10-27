# ═══════════════════════════════════════════════════════════════
# JavaMifi Compass — API (NestJS) Dockerfile
# ═══════════════════════════════════════════════════════════════
# Multi-stage monorepo build for production NestJS runner

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy root workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/api-client/package.json ./packages/api-client/
COPY apps/api/package.json ./apps/api/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:20-alpine AS build

RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm --filter @javamifi/shared build
RUN pnpm --filter @javamifi/api db:generate
RUN pnpm --filter @javamifi/api build

# ── Stage 3: Production runner ────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init openssl

# Security: run as non-root
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy production artifacts
COPY --from=build --chown=nestjs:nestjs /app/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/apps/api/package.json ./package.json
COPY --from=build --chown=nestjs:nestjs /app/apps/api/prisma ./prisma
COPY --from=build --chown=nestjs:nestjs /app/packages ./packages

# Create uploads directory
RUN mkdir -p /app/uploads && chown nestjs:nestjs /app/uploads

USER nestjs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

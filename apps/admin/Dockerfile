# ═══════════════════════════════════════════════════════════════
# JavaMifi Compass — Admin (React Vite) Dockerfile
# ═══════════════════════════════════════════════════════════════
# Multi-stage monorepo build with static Nginx runner

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY apps/admin/package.json ./apps/admin/

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm --filter @javamifi/shared build
RUN pnpm --filter @javamifi/api-client build
RUN pnpm --filter @javamifi/admin build

# ── Stage 3: Nginx static host ────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=build /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 3002

CMD ["nginx", "-g", "daemon off;"]

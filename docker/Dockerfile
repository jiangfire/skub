# ─── Skills Hub Dockerfile ───
# Multi-stage build: deps → build → runtime

# ── Stage 1: Dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app
# OpenSSL 1.1 compat needed by Prisma engine during build on Alpine 3.20+
RUN apk add --no-cache openssl1.1-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Compile seed.ts to standalone JS (tsx is a devDependency, not available in runtime)
RUN npx esbuild prisma/seed.ts --bundle --platform=node --outfile=prisma/seed.js --format=cjs --external:@prisma/client --external:bcrypt

# ── Stage 3: Runtime ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL 1.1 compat needed by Prisma engine at runtime on Alpine 3.20+
RUN apk add --no-cache openssl1.1-compat

# Install only production dependencies (skip prepare/husky script — devDep, not available)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built app and Prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled seed script
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

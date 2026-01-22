# Dockerize Next.js app - Using Debian Bullseye for Prisma compatibility (has libssl1.1)
FROM node:20-bullseye-slim AS base

# Patch base OS packages to reduce known CVEs in the base image
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build-time args — avoid passing secrets at build; supply them at runtime via env/secrets.
# NOTE: Do NOT bake `NODE_ENV` into the image. The runtime (docker-compose / orchestrator)
# should provide `NODE_ENV` via `env_file` or environment variables so it can differ
# between environments (development/production) and avoid image-specific behavior.

# Build should not require secrets; enable relaxed env validation only during build.
# Do NOT pass DATABASE_URL or JWT_SECRET as build args to avoid baking secrets into image layers.
ARG SKIP_ENV_VALIDATION=true
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install OpenSSL for Prisma, curl for healthchecks/init, and Prisma CLI globally for migrations at runtime
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g prisma@5.22.0

# NOTE: `NODE_ENV` must be supplied at runtime by the orchestrator (`env_file` / environment).
# Do NOT bake `NODE_ENV` into the image to avoid environment-specific behaviour being fixed in the image.

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create logs directory for runtime
RUN mkdir logs
RUN chown nextjs:nodejs logs

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy startup script and set permissions
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-startup.sh ./
RUN chmod +x docker-startup.sh

# Copy Prisma schema and migrations for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run startup script (migrations + admin creation) then start server
CMD ["./docker-startup.sh"]

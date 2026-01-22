# Dockerize Next.js app - Using Debian Bullseye for Prisma compatibility (has libssl1.1)
FROM node:20-bullseye-slim AS base

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

# Build-time arguments from docker-compose
# These can be overridden at build time and are NOT baked into the final image layers
ARG DATABASE_URL
ARG JWT_SECRET

# Set as ENV for Next.js build process (will be overridden at runtime by env_file)
ENV DATABASE_URL=${DATABASE_URL:-postgresql://build:build@localhost:5432/build}
ENV JWT_SECRET=${JWT_SECRET:-build-time-placeholder-min-32-chars-xxxxxxxxxxxxxxx}
ENV NODE_ENV=production

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install OpenSSL for Prisma, curl for healthchecks/init, and Prisma CLI globally for migrations at runtime
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g prisma@5.22.0

# Runtime env vars are supplied by docker-compose via env_file
# The build-time ENV values above are overridden at container startup

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
# NOTE: We do NOT copy node_modules/.prisma or node_modules/@prisma from builder
# because they contain the build-time DATABASE_URL. The startup script will regenerate them.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run startup script (migrations + admin creation) then start server
CMD ["./docker-startup.sh"]

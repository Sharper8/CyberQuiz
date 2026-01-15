#!/bin/bash
set -euo pipefail
echo "🔍 Build Debug Info"
node -v || true
npm -v || true
echo "Working dir: $(pwd)"
ls -1 | head -20

echo "Checking Prisma binary presence"
ls -al node_modules/.prisma || echo "(no .prisma directory)"
ls -al node_modules/@prisma/client | head -20 || true

echo "Environment snapshot (filtered)"
export | grep -E 'NODE_ENV|DATABASE_URL|JWT_SECRET|OLLAMA|QDRANT|OPENAI' || true

echo "Prisma version check"
node_modules/.bin/prisma -v || echo "Prisma CLI not available"

echo "Starting Next.js build (verbose)"
set -x
npm run build || { echo "❌ BUILD FAILED"; exit 1; }
set +x

echo "✅ Build script completed"

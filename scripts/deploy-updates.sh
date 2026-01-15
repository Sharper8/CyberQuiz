#!/bin/bash
# Quick deployment script for recent updates
# Run this after pulling the latest changes

set -e

echo "🚀 CyberQuiz - Deploying Updates"
echo "================================"
echo ""

echo "📦 Step 1: Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

echo ""
echo "🗑️  Step 2: Removing volumes (clean slate)..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "🔨 Step 3: Rebuilding containers..."
docker-compose -f docker-compose.dev.yml build

echo ""
echo "🚀 Step 4: Starting services..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Step 5: Waiting for Ollama to download models (this may take 5-10 minutes)..."
echo "   You can monitor progress with: docker-compose -f docker-compose.dev.yml logs -f ollama"
echo ""

# Wait for healthcheck
echo "   Checking Ollama health..."
for i in {1..30}; do
  if docker-compose -f docker-compose.dev.yml ps | grep -q "ollama.*healthy"; then
    echo "   ✅ Ollama is healthy and models are ready!"
    break
  fi
  echo "   ⏳ Waiting... (${i}/30)"
  sleep 10
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🌐 Access the application:"
echo "   - Main app: http://localhost:3333"
echo "   - Admin login: http://localhost:3333/admin-login"
echo "   - PgAdmin: http://localhost:5050"
echo ""
echo "🔑 Default credentials:"
echo "   - Email: admin@cyberquiz.fr"
echo "   - Password: AdminSecure2026!"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f docker-compose.dev.yml logs -f [service-name]"
echo ""

#!/bin/bash
# CyberQuiz Development Setup Script
# Run this once to set up everything

set -e

echo "🚀 CyberQuiz Development Setup"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Start database services
echo "🐳 Starting PostgreSQL and Qdrant..."
docker compose -f docker-compose.dev.yml up -d postgres qdrant pgadmin
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5
echo "✅ Database services started"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations completed"
echo ""

# Seed database
echo "🌱 Seeding database with sample questions..."
npm run db:seed
echo "✅ Database seeded with 20+ questions"
echo ""

# Initialize Qdrant collection
echo "🔮 Initializing Qdrant collection..."
curl -X PUT "http://localhost:6333/collections/cyberquiz_questions" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }' > /dev/null 2>&1 || echo "⚠️  Collection may already exist"
echo "✅ Qdrant configured"
echo ""

echo "═══════════════════════════════════════"
echo "🎉 Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "📝 What's been set up:"
echo "   ✅ PostgreSQL (port 5432)"
echo "   ✅ Qdrant Vector DB (port 6333)"
echo "   ✅ PgAdmin (port 5050)"
echo "   ✅ 20+ pre-seeded questions"
echo "   ✅ Admin user created"
echo ""
echo "🚀 Next steps:"
echo ""
echo "   1. Start the development server:"
echo "      npm run dev"
echo ""
echo "   2. Access the application:"
echo "      http://localhost:3000"
echo ""
echo "   3. Login to admin panel:"
echo "      http://localhost:3000/admin-login"
echo "      Email: admin@cyberquiz.fr"
echo "      Password: password123"
echo ""
echo "   4. (Optional) Access PgAdmin:"
echo "      http://localhost:5050"
echo "      Email: admin@cyberquiz.local"
echo "      Password: admin"
echo ""
echo "💡 To use AI question generation:"
echo "   - Install Ollama: https://ollama.ai"
echo "   - Pull models: ollama pull llama3.1:8b"
echo "   - Or start with Docker: docker compose -f docker-compose.dev.yml up -d ollama"
echo ""
echo "📚 For more info, see QUICKSTART.md"
echo ""

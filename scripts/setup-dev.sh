#!/bin/bash
# CyberQuiz Development Setup Script
# Run this once to set up everything

set -e

echo "ðŸš€ CyberQuiz Development Setup"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "âŒ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "âœ… Docker is running"
echo ""

# Install npm dependencies
echo "ðŸ“¦ Installing npm dependencies..."
npm install
echo "âœ… Dependencies installed"
echo ""

# Start database services
echo "ðŸ³ Starting PostgreSQL and Qdrant..."
docker compose -f docker-compose.dev.yml up -d postgres qdrant pgadmin
echo "â³ Waiting for PostgreSQL to be ready..."
sleep 5
echo "âœ… Database services started"
echo ""

# Run database migrations
echo "ðŸ—„ï¸  Running database migrations..."
npx prisma migrate deploy
echo "âœ… Migrations completed"
echo ""

# Seed database
echo "ðŸŒ± Seeding database with sample questions..."
npm run db:seed
echo "âœ… Database seeded with 20+ questions"
echo ""

# Initialize Qdrant collection
echo "ðŸ”® Initializing Qdrant collection..."
curl -X PUT "http://localhost:6333/collections/cyberquiz_questions" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }' > /dev/null 2>&1 || echo "âš ï¸  Collection may already exist"
echo "âœ… Qdrant configured"
echo ""

echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
echo "ðŸŽ‰ Setup Complete!"
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
echo ""
echo "ðŸ“ What's been set up:"
echo "   âœ… PostgreSQL (port 5432)"
echo "   âœ… Qdrant Vector DB (port 6333)"
echo "   âœ… PgAdmin (port 5050)"
echo "   âœ… 20+ pre-seeded questions"
echo "   âœ… Admin user created"
echo ""
echo "ðŸš€ Next steps:"
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
echo "ðŸ’¡ To use AI question generation:"
echo "   - Install Ollama: https://ollama.ai"
echo "   - Pull models: ollama pull llama3.1:8b"
echo "   - Or start with Docker: docker compose -f docker-compose.dev.yml up -d ollama"
echo ""
echo "ðŸ“š For more info, see QUICKSTART.md"
echo ""


#!/bin/bash
set -e

echo "🐳 CyberQuiz Docker Initialization"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Starting Docker containers...${NC}"
docker-compose up -d

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Wait for PostgreSQL
echo -e "${YELLOW}🔍 Checking PostgreSQL...${NC}"
until docker-compose exec -T postgres pg_isready -U cyberquiz; do
  echo "   Waiting for PostgreSQL..."
  sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Wait for Qdrant
echo -e "${YELLOW}🔍 Checking Qdrant...${NC}"
until curl -s http://localhost:6333/readyz > /dev/null 2>&1; do
  echo "   Waiting for Qdrant..."
  sleep 2
done
echo -e "${GREEN}✅ Qdrant is ready${NC}"

# Wait for Ollama
echo -e "${YELLOW}🔍 Checking Ollama...${NC}"
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  echo "   Waiting for Ollama..."
  sleep 2
done
echo -e "${GREEN}✅ Ollama is ready${NC}"

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations completed${NC}"

# Seed database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npm run db:seed
echo -e "${GREEN}✅ Database seeded${NC}"

# Initialize Qdrant collection
echo -e "${YELLOW}🔮 Initializing Qdrant collection...${NC}"
curl -X PUT "http://localhost:6333/collections/cyberquiz_questions" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }' > /dev/null 2>&1
echo -e "${GREEN}✅ Qdrant collection created${NC}"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Access the app: http://localhost:3000"
echo "   2. Admin login: http://localhost:3000/admin-login"
echo "      - Email: admin@cyberquiz.fr"
echo "      - Password: password123"
echo "   3. PgAdmin: http://localhost:5050"
echo "      - Email: admin@cyberquiz.local"
echo "      - Password: admin"
echo ""
echo "🛠️  Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop all: docker-compose down"
echo "   - Restart: docker-compose restart"
echo "   - Reset DB: docker-compose down -v && ./scripts/docker-init.sh"
echo ""

#!/bin/bash
set -e

echo "ðŸ³ CyberQuiz Docker Initialization"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}ðŸ“¦ Starting Docker containers...${NC}"
docker-compose up -d

echo -e "${YELLOW}â³ Waiting for services to be ready...${NC}"
sleep 5

# Wait for PostgreSQL
echo -e "${YELLOW}ðŸ” Checking PostgreSQL...${NC}"
until docker-compose exec -T postgres pg_isready -U cyberquiz; do
  echo "   Waiting for PostgreSQL..."
  sleep 2
done
echo -e "${GREEN}âœ… PostgreSQL is ready${NC}"

# Wait for Qdrant
echo -e "${YELLOW}ðŸ” Checking Qdrant...${NC}"
until curl -s http://localhost:6333/readyz > /dev/null 2>&1; do
  echo "   Waiting for Qdrant..."
  sleep 2
done
echo -e "${GREEN}âœ… Qdrant is ready${NC}"

# Wait for Ollama
echo -e "${YELLOW}ðŸ” Checking Ollama...${NC}"
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  echo "   Waiting for Ollama..."
  sleep 2
done
echo -e "${GREEN}âœ… Ollama is ready${NC}"

# Run database migrations
echo -e "${YELLOW}ðŸ—„ï¸  Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}âœ… Migrations completed${NC}"

# Seed database
echo -e "${YELLOW}ðŸŒ± Seeding database...${NC}"
npm run db:seed
echo -e "${GREEN}âœ… Database seeded${NC}"

# Initialize Qdrant collection
echo -e "${YELLOW}ðŸ”® Initializing Qdrant collection...${NC}"
curl -X PUT "http://localhost:6333/collections/cyberquiz_questions" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }' > /dev/null 2>&1
echo -e "${GREEN}âœ… Qdrant collection created${NC}"

echo ""
echo -e "${GREEN}ðŸŽ‰ Setup complete!${NC}"
echo ""
echo "ðŸ“ Next steps:"
echo "   1. Access the app: http://localhost:3000"
echo "   2. Admin login: http://localhost:3000/admin-login"
echo "      - Email: admin@cyberquiz.fr"
echo "      - Password: password123"
echo "   3. PgAdmin: http://localhost:5050"
echo "      - Email: admin@cyberquiz.local"
echo "      - Password: admin"
echo ""
echo "ðŸ› ï¸  Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop all: docker-compose down"
echo "   - Restart: docker-compose restart"
echo "   - Reset DB: docker-compose down -v && ./scripts/docker-init.sh"
echo ""

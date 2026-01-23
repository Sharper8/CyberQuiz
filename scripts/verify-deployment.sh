#!/bin/bash
# Pre-deployment verification script
# Ensures all migrations and configurations are ready for production

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          CyberQuiz Deployment Verification Script         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
  local status=$1
  local message=$2
  
  if [ "$status" == "OK" ]; then
    echo -e "${GREEN}✓${NC} $message"
  elif [ "$status" == "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $message"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${RED}✗${NC} $message"
    ERRORS=$((ERRORS + 1))
  fi
}

# Check 1: Environment file exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f ".env" ]; then
  print_status "ERROR" ".env file not found"
  echo "  → Copy .env.example and configure it for production"
else
  print_status "OK" ".env file exists"
  
  # Check critical environment variables
  source .env 2>/dev/null || true
  
  # Check DATABASE_URL
  if [ -z "$DATABASE_URL" ]; then
    print_status "ERROR" "DATABASE_URL not set"
  elif [[ $DATABASE_URL == *"localhost"* ]]; then
    print_status "WARN" "DATABASE_URL contains 'localhost' - use Docker service name 'postgres'"
  else
    print_status "OK" "DATABASE_URL configured"
  fi
  
  # Check JWT_SECRET
  if [ -z "$JWT_SECRET" ]; then
    print_status "ERROR" "JWT_SECRET not set"
  elif [ ${#JWT_SECRET} -lt 32 ]; then
    print_status "ERROR" "JWT_SECRET too short (minimum 32 characters)"
  elif [[ $JWT_SECRET == *"changeme"* ]] || [[ $JWT_SECRET == *"secret"* ]]; then
    print_status "WARN" "JWT_SECRET appears to be a default value"
  else
    print_status "OK" "JWT_SECRET configured (${#JWT_SECRET} chars)"
  fi
  
  # Check ADMIN_PASSWORD
  if [ -z "$ADMIN_PASSWORD" ]; then
    print_status "WARN" "ADMIN_PASSWORD not set (will use default)"
  elif [[ $ADMIN_PASSWORD == "changeme" ]]; then
    print_status "WARN" "ADMIN_PASSWORD is default value 'changeme'"
  else
    print_status "OK" "ADMIN_PASSWORD configured"
  fi
  
  # Check OLLAMA_BASE_URL
  if [[ $OLLAMA_BASE_URL == *"localhost"* ]]; then
    print_status "WARN" "OLLAMA_BASE_URL contains 'localhost' - use Docker service name 'http://ollama:11434'"
  else
    print_status "OK" "OLLAMA_BASE_URL configured"
  fi
  
  # Check QDRANT_URL
  if [[ $QDRANT_URL == *"localhost"* ]]; then
    print_status "WARN" "QDRANT_URL contains 'localhost' - use Docker service name 'http://qdrant:6333'"
  else
    print_status "OK" "QDRANT_URL configured"
  fi
fi

echo ""

# Check 2: Prisma migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "prisma/migrations" ]; then
  print_status "ERROR" "No migrations directory found"
else
  migration_count=$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l)
  print_status "OK" "Found $migration_count migration(s)"
  
  # List migrations
  echo "  Migrations:"
  for migration in prisma/migrations/*/; do
    if [ -d "$migration" ]; then
      migration_name=$(basename "$migration")
      if [ "$migration_name" != "migration_lock.toml" ]; then
        echo "    - $migration_name"
      fi
    fi
  done
fi

echo ""

# Check 3: Docker configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Docker Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "Dockerfile" ]; then
  print_status "ERROR" "Dockerfile not found"
else
  print_status "OK" "Dockerfile exists"
  
  # Check if startup script is referenced
  if grep -q "docker-startup.sh" Dockerfile; then
    print_status "OK" "Startup script configured in Dockerfile"
  else
    print_status "ERROR" "Startup script not found in Dockerfile"
  fi
fi

if [ ! -f "docker-compose.yml" ]; then
  print_status "ERROR" "docker-compose.yml not found"
else
  print_status "OK" "docker-compose.yml exists"
  
  # Check if health checks are configured
  if grep -q "healthcheck:" docker-compose.yml; then
    print_status "OK" "Health checks configured"
  else
    print_status "WARN" "No health checks found in docker-compose.yml"
  fi
fi

if [ ! -f "scripts/docker-startup.sh" ]; then
  print_status "ERROR" "docker-startup.sh not found"
else
  print_status "OK" "docker-startup.sh exists"
  
  # Check if it's executable
  if [ -x "scripts/docker-startup.sh" ]; then
    print_status "OK" "docker-startup.sh is executable"
  else
    print_status "WARN" "docker-startup.sh not executable (should be fixed during build)"
  fi
  
  # Check if migrations are in startup script
  if grep -q "prisma migrate deploy" scripts/docker-startup.sh; then
    print_status "OK" "Migrations configured in startup script"
  else
    print_status "ERROR" "Migrations not found in startup script"
  fi
fi

echo ""

# Check 4: Build test (optional - only if Docker is available)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Docker Build Test (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v docker &> /dev/null; then
  print_status "WARN" "Docker not available - skipping build test"
else
  read -p "Run Docker build test? This may take several minutes. (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  Building Docker image..."
    if docker build -t cyberquiz-test --build-arg SKIP_ENV_VALIDATION=true . > /tmp/cyberquiz-build.log 2>&1; then
      print_status "OK" "Docker build successful"
      echo "  → Image tagged as 'cyberquiz-test'"
    else
      print_status "ERROR" "Docker build failed - check /tmp/cyberquiz-build.log"
      echo "  Last 20 lines of build log:"
      tail -20 /tmp/cyberquiz-build.log | sed 's/^/    /'
    fi
  else
    print_status "WARN" "Skipped Docker build test"
  fi
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC} Ready for deployment."
  echo ""
  echo "Next steps:"
  echo "  1. Review .env file and update any placeholder values"
  echo "  2. Run: docker compose down"
  echo "  3. Run: docker compose build"
  echo "  4. Run: docker compose up -d"
  echo "  5. Monitor: docker compose logs -f nextjs-app"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
  echo ""
  echo "Deployment may proceed, but review warnings above."
  echo "Consider fixing warnings before production deployment."
  exit 0
else
  echo -e "${RED}✗ $ERRORS error(s) found${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
  fi
  echo ""
  echo "Fix errors before deployment!"
  exit 1
fi

#!/bin/bash
set -e

# Production Deployment Script
# This script automates safe production deployments with verification

COMPOSE_FILE="docker-compose.yml"
HEALTH_URL="http://localhost:3100/api/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=2

echo "🚀 CyberQuiz Production Deployment"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo "ℹ $1"
}

# Step 1: Pre-deployment verification
echo "Step 1: Running pre-deployment checks..."
if [ -f "./scripts/verify-deployment.sh" ]; then
    if ! bash ./scripts/verify-deployment.sh; then
        error "Pre-deployment verification failed!"
        error "Fix the issues reported above before deploying to production."
        exit 1
    fi
    success "Pre-deployment verification passed"
else
    warning "Verification script not found, skipping..."
fi
echo ""

# Step 2: Confirm production deployment
echo "Step 2: Confirming production deployment..."
info "This will deploy to PRODUCTION environment (port 3100)"
info "Current git branch: $(git branch --show-current)"
info "Last commit: $(git log -1 --oneline)"
echo ""
read -p "Are you sure you want to deploy to production? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    warning "Deployment cancelled by user"
    exit 0
fi
echo ""

# Step 3: Backup current state
echo "Step 3: Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database if possible
if docker ps | grep -q cyberquiz-postgres-prod; then
    info "Backing up database..."
    docker exec cyberquiz-postgres-prod pg_dump -U cyberquiz cyberquiz > "$BACKUP_DIR/database.sql" 2>/dev/null || warning "Database backup failed (container might not be running)"
    if [ -f "$BACKUP_DIR/database.sql" ]; then
        success "Database backed up to $BACKUP_DIR/database.sql"
    fi
fi

# Backup .env
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env.backup"
    success "Environment file backed up"
fi
echo ""

# Step 4: Pull latest images (if using registry)
echo "Step 4: Preparing Docker environment..."
info "Cleaning up old images..."
docker system prune -f --volumes || true
success "Docker cleanup complete"
echo ""

# Step 5: Stop current production
echo "Step 5: Stopping current production services..."
docker compose -f "$COMPOSE_FILE" down
success "Production services stopped"
echo ""

# Step 6: Deploy new version
echo "Step 6: Building and starting new production containers..."
info "This may take 2-3 minutes..."
docker compose -f "$COMPOSE_FILE" up -d --build

if [ $? -ne 0 ]; then
    error "Docker compose failed to start!"
    error "Attempting to restore from backup..."
    
    # Restore database if backup exists
    if [ -f "$BACKUP_DIR/database.sql" ]; then
        warning "Database restore available at: $BACKUP_DIR/database.sql"
        warning "Manual restore required: docker exec -i cyberquiz-postgres-prod psql -U cyberquiz cyberquiz < $BACKUP_DIR/database.sql"
    fi
    
    exit 1
fi
success "Containers started"
echo ""

# Step 7: Wait for services to be healthy
echo "Step 7: Waiting for services to become healthy..."
info "This may take 30-60 seconds for migrations and startup..."

RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_HEALTH_RETRIES ]; do
    # Check container status
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
        error "Some containers are unhealthy!"
        docker compose -f "$COMPOSE_FILE" ps
        exit 1
    fi
    
    # Check health endpoint
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        success "Health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep $HEALTH_RETRY_INTERVAL
done
echo ""

if [ $RETRY_COUNT -ge $MAX_HEALTH_RETRIES ]; then
    error "Health check failed after $MAX_HEALTH_RETRIES attempts"
    error "Checking logs..."
    docker compose -f "$COMPOSE_FILE" logs --tail=50 nextjs-app
    exit 1
fi
echo ""

# Step 8: Run smoke tests
echo "Step 8: Running smoke tests..."

# Test 1: Health endpoint
info "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    success "Health endpoint OK"
else
    error "Health endpoint returned unexpected response"
    echo "$HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Database connection
if echo "$HEALTH_RESPONSE" | grep -q '"database":{"status":"ok"'; then
    success "Database connection OK"
else
    error "Database connection failed"
    exit 1
fi

# Test 3: Homepage loads
info "Testing homepage..."
if curl -sf http://localhost:3100 > /dev/null 2>&1; then
    success "Homepage loads"
else
    warning "Homepage load test failed (might be normal if using reverse proxy)"
fi

# Test 4: Check Ollama
info "Checking Ollama models..."
OLLAMA_MODELS=$(docker exec cyberquiz-ollama-prod ollama list 2>/dev/null | grep -E "mistral|nomic" | wc -l)
if [ "$OLLAMA_MODELS" -ge 2 ]; then
    success "Ollama models loaded ($OLLAMA_MODELS/2)"
else
    warning "Ollama models not fully loaded yet (may take a few minutes on first deploy)"
fi

echo ""

# Step 9: Display deployment summary
echo "Step 9: Deployment Summary"
echo "=========================="
docker compose -f "$COMPOSE_FILE" ps
echo ""

# Show recent logs
info "Recent startup logs:"
docker compose -f "$COMPOSE_FILE" logs --tail=20 nextjs-app | grep -E "Startup|Migration|Admin|Generation|Ready"
echo ""

# Step 10: Post-deployment information
echo "✅ Production Deployment Complete!"
echo ""
echo "📊 Access Points:"
echo "  - Application: http://localhost:3100"
echo "  - Health Check: $HEALTH_URL"
echo "  - Admin Panel: http://localhost:3100/admin-login"
echo "  - PgAdmin: http://localhost:5050 (if enabled)"
echo ""
echo "📁 Backup Location: $BACKUP_DIR"
echo ""
echo "📝 Next Steps:"
echo "  1. Verify admin login works"
echo "  2. Test quiz functionality"
echo "  3. Check question generation"
echo "  4. Monitor logs: docker compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🔄 Rollback (if needed):"
echo "  docker compose -f $COMPOSE_FILE down"
echo "  # Restore database: docker exec -i cyberquiz-postgres-prod psql -U cyberquiz cyberquiz < $BACKUP_DIR/database.sql"
echo "  git checkout <previous-commit>"
echo "  docker compose -f $COMPOSE_FILE up -d --build"
echo ""
success "Deployment successful! 🎉"

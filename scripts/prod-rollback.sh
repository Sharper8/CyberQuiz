#!/bin/bash

# Quick Production Rollback Script
# Quickly rollback to previous version if deployment fails

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}✗${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
info() { echo "ℹ $1"; }

echo "🔄 Production Rollback"
echo "====================="
echo ""

# Find most recent backup
BACKUP_DIR=$(ls -td backups/* 2>/dev/null | head -1)

if [ -z "$BACKUP_DIR" ]; then
    error "No backups found in backups/ directory"
    exit 1
fi

info "Most recent backup: $BACKUP_DIR"
echo ""

# Confirm rollback
warning "This will:"
echo "  1. Stop current production containers"
echo "  2. Restore database from backup (if available)"
echo "  3. Checkout previous git commit"
echo "  4. Rebuild and restart production"
echo ""
read -p "Continue with rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    warning "Rollback cancelled"
    exit 0
fi
echo ""

# Step 1: Stop production
echo "Step 1: Stopping current production..."
docker compose -f docker-compose.yml down
success "Production stopped"
echo ""

# Step 2: Restore database
echo "Step 2: Restoring database..."
if [ -f "$BACKUP_DIR/database.sql" ]; then
    info "Starting PostgreSQL container for restore..."
    docker compose -f docker-compose.yml up -d postgres
    sleep 5
    
    info "Restoring database from $BACKUP_DIR/database.sql..."
    docker exec -i cyberquiz-postgres-prod psql -U cyberquiz cyberquiz < "$BACKUP_DIR/database.sql"
    
    if [ $? -eq 0 ]; then
        success "Database restored"
    else
        error "Database restore failed"
        warning "You may need to manually restore the database"
    fi
else
    warning "No database backup found in $BACKUP_DIR"
    warning "Skipping database restore"
fi
echo ""

# Step 3: Git rollback
echo "Step 3: Finding previous commit..."
CURRENT_COMMIT=$(git rev-parse HEAD)
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

info "Current commit: $CURRENT_COMMIT"
info "Previous commit: $PREVIOUS_COMMIT"
echo ""

read -p "Rollback to $PREVIOUS_COMMIT? (yes/no): " GIT_CONFIRM

if [ "$GIT_CONFIRM" = "yes" ]; then
    git checkout "$PREVIOUS_COMMIT"
    success "Rolled back to previous commit"
else
    warning "Skipping git rollback - using current code"
fi
echo ""

# Step 4: Rebuild production
echo "Step 4: Rebuilding production with previous version..."
docker compose -f docker-compose.yml up -d --build

if [ $? -eq 0 ]; then
    success "Production rebuilt and started"
else
    error "Production rebuild failed!"
    exit 1
fi
echo ""

# Step 5: Wait for health check
echo "Step 5: Waiting for health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3100/api/health > /dev/null 2>&1; then
        success "Health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done
echo ""

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    error "Health check failed after rollback"
    error "Check logs: docker compose -f docker-compose.yml logs"
    exit 1
fi

echo ""
success "Rollback complete! 🎉"
echo ""
echo "Production has been rolled back to:"
echo "  Git commit: $(git rev-parse --short HEAD)"
echo "  Backup from: $BACKUP_DIR"
echo ""
echo "Verify functionality:"
echo "  - Check health: http://localhost:3100/api/health"
echo "  - Test app: http://localhost:3100"
echo "  - View logs: docker compose -f docker-compose.yml logs -f"

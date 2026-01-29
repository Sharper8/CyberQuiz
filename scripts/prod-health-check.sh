#!/bin/bash

# Production Health Check Script
# Comprehensive verification that production is running correctly

HEALTH_URL="http://localhost:3100/api/health"
APP_URL="http://localhost:3100"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

FAILED_CHECKS=0

echo "🏥 Production Health Check"
echo "========================="
echo ""

# Container Status
echo "1. Container Status"
echo "-------------------"
CONTAINERS=$(docker compose -f docker-compose.yml ps --format json 2>/dev/null | jq -r '.Name' | wc -l)
if [ "$CONTAINERS" -ge 4 ]; then
    success "All containers running ($CONTAINERS/5)"
    docker compose -f docker-compose.yml ps | grep -E "(nextjs|postgres|ollama|qdrant)" | while read line; do
        if echo "$line" | grep -q "Up"; then
            echo "  ✓ $(echo $line | awk '{print $1}')"
        else
            echo "  ✗ $(echo $line | awk '{print $1}')"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done
else
    error "Not all containers running ($CONTAINERS/5)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# Health Endpoint
echo "2. Application Health"
echo "--------------------"
HEALTH_RESPONSE=$(curl -sf "$HEALTH_URL" 2>/dev/null)
if [ $? -eq 0 ]; then
    success "Health endpoint responding"
    
    # Check status
    if echo "$HEALTH_RESPONSE" | jq -e '.status == "ok"' > /dev/null 2>&1; then
        success "Application status: OK"
    else
        error "Application status: $(echo $HEALTH_RESPONSE | jq -r '.status')"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # Check database
    if echo "$HEALTH_RESPONSE" | jq -e '.services.database.status == "ok"' > /dev/null 2>&1; then
        success "Database: Connected"
    else
        error "Database: $(echo $HEALTH_RESPONSE | jq -r '.services.database.status')"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # Check AI
    OLLAMA_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.services.aiProviders.ollama')
    if [ "$OLLAMA_STATUS" = "available" ]; then
        success "Ollama AI: Available"
    else
        warning "Ollama AI: $OLLAMA_STATUS"
    fi
    
    # Response time
    RESPONSE_TIME=$(echo "$HEALTH_RESPONSE" | jq -r '.responseTime')
    info "Response time: $RESPONSE_TIME"
else
    error "Health endpoint not responding"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# Database Check
echo "3. Database Status"
echo "------------------"
DB_SIZE=$(docker exec cyberquiz-postgres-prod psql -U cyberquiz -d cyberquiz -t -c "SELECT pg_size_pretty(pg_database_size('cyberquiz'));" 2>/dev/null | xargs)
if [ $? -eq 0 ]; then
    success "Database accessible"
    info "Database size: $DB_SIZE"
    
    # Check question count
    QUESTION_COUNT=$(docker exec cyberquiz-postgres-prod psql -U cyberquiz -d cyberquiz -t -c "SELECT COUNT(*) FROM \"Question\" WHERE status = 'validated';" 2>/dev/null | xargs)
    if [ $? -eq 0 ]; then
        info "Validated questions: $QUESTION_COUNT"
        if [ "$QUESTION_COUNT" -lt 10 ]; then
            warning "Low question count - consider generating more"
        fi
    fi
    
    # Check pending questions
    PENDING_COUNT=$(docker exec cyberquiz-postgres-prod psql -U cyberquiz -d cyberquiz -t -c "SELECT COUNT(*) FROM \"Question\" WHERE status = 'to_review';" 2>/dev/null | xargs)
    if [ $? -eq 0 ]; then
        info "Pending review: $PENDING_COUNT"
    fi
else
    error "Cannot access database"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# Ollama Models
echo "4. AI Models"
echo "------------"
MODELS=$(docker exec cyberquiz-ollama-prod ollama list 2>/dev/null)
if [ $? -eq 0 ]; then
    if echo "$MODELS" | grep -q "mistral"; then
        success "mistral:7b loaded"
    else
        error "mistral:7b not found"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    if echo "$MODELS" | grep -q "nomic-embed"; then
        success "nomic-embed-text loaded"
    else
        error "nomic-embed-text not found"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    error "Cannot check Ollama models"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# Disk Usage
echo "5. Resource Usage"
echo "-----------------"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    success "Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    warning "Disk usage: ${DISK_USAGE}% (getting high)"
else
    error "Disk usage: ${DISK_USAGE}% (critical!)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Memory usage
MEMORY_USAGE=$(docker stats --no-stream --format "{{.Container}}: {{.MemUsage}}" | grep cyberquiz)
if [ $? -eq 0 ]; then
    info "Container memory usage:"
    echo "$MEMORY_USAGE" | while read line; do
        echo "  $line"
    done
fi
echo ""

# Recent Errors
echo "6. Recent Errors"
echo "----------------"
ERROR_COUNT=$(docker compose -f docker-compose.yml logs --since 1h 2>/dev/null | grep -i error | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    success "No errors in last hour"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    warning "$ERROR_COUNT errors in last hour"
    info "Check logs: docker compose -f docker-compose.yml logs --since 1h | grep -i error"
else
    error "$ERROR_COUNT errors in last hour!"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    info "Showing recent errors:"
    docker compose -f docker-compose.yml logs --since 1h 2>/dev/null | grep -i error | tail -5
fi
echo ""

# API Endpoints
echo "7. Critical Endpoints"
echo "---------------------"
# Test quiz start
if curl -sf "$APP_URL/api/quiz/start" -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    success "Quiz start endpoint OK"
else
    warning "Quiz start endpoint failed (might need authentication)"
fi

# Test questions endpoint
if curl -sf "$APP_URL/api/questions?limit=1" > /dev/null 2>&1; then
    success "Questions endpoint OK"
else
    error "Questions endpoint failed"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Test scores endpoint
if curl -sf "$APP_URL/api/scores?limit=10" > /dev/null 2>&1; then
    success "Scores endpoint OK"
else
    error "Scores endpoint failed"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# Summary
echo "================================="
if [ $FAILED_CHECKS -eq 0 ]; then
    success "All health checks passed! 🎉"
    echo ""
    echo "Production is healthy and operational."
    exit 0
elif [ $FAILED_CHECKS -lt 3 ]; then
    warning "$FAILED_CHECKS checks failed"
    echo ""
    echo "Production is running but has some issues."
    echo "Review the warnings above."
    exit 0
else
    error "$FAILED_CHECKS checks failed!"
    echo ""
    echo "Production has critical issues!"
    echo "Recommended actions:"
    echo "  1. Check logs: docker compose -f docker-compose.yml logs -f"
    echo "  2. Restart services: docker compose -f docker-compose.yml restart"
    echo "  3. If issues persist, consider rollback"
    exit 1
fi

#!/bin/bash

# Script to initialize Ollama models
# Usage: ./scripts/init-ollama-models.sh [container-name]
# Default container name: cyberquiz-ollama-prod

CONTAINER_NAME="${1:-cyberquiz-ollama-prod}"

echo "🔍 Waiting for Ollama container to be ready..."
MAX_WAIT=30
WAITED=0

until docker exec $CONTAINER_NAME ollama list >/dev/null 2>&1 || [ $WAITED -eq $MAX_WAIT ]; do
  echo "   Waiting for Ollama to start... ($WAITED/$MAX_WAIT)"
  sleep 2
  WAITED=$((WAITED + 2))
done

if [ $WAITED -eq $MAX_WAIT ]; then
  echo "❌ Timeout waiting for Ollama container"
  exit 1
fi

echo "✅ Ollama is ready"
echo ""

# Pull required models
MODELS=(
  "mistral:7b"
  "llama3.1:8b"
  "nomic-embed-text:latest"
)

for model in "${MODELS[@]}"; do
  echo "📥 Pulling $model..."
  docker exec $CONTAINER_NAME ollama pull $model
  if [ $? -eq 0 ]; then
    echo "✅ $model pulled successfully"
  else
    echo "⚠️  Failed to pull $model (continuing anyway)"
  fi
  echo ""
done

echo "📋 Final model list:"
docker exec $CONTAINER_NAME ollama list

echo ""
echo "✅ Ollama initialization complete!"

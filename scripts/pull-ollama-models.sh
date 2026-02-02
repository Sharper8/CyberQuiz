#!/bin/sh
set -e

# Pull a list of Ollama models. Tries local `ollama` CLI first, falls back to docker exec into an ollama container.
# Usage: ./scripts/pull-ollama-models.sh [model1 model2 ...]

MODELS=${@:-"mistral:7b llama3.1:8b gemma2:2b nomic-embed-text:latest tinyllama:latest"}

echo "Pulling models: $MODELS"

pull_with_cli() {
  for m in $MODELS; do
    echo "Pulling $m via local ollama CLI..."
    ollama pull "$m" || return 1
  done
}

pull_with_docker() {
  # find an ollama container
  CONTAINER=$(docker ps --filter "ancestor=ollama/ollama" --format "{{.Names}}" | head -n1)
  if [ -z "$CONTAINER" ]; then
    # try common service name
    CONTAINER=$(docker ps --filter "name=ollama" --format "{{.Names}}" | head -n1)
  fi

  if [ -z "$CONTAINER" ]; then
    echo "No running Ollama container found. Cannot pull models."
    return 1
  fi

  for m in $MODELS; do
    echo "Pulling $m inside container $CONTAINER..."
    docker exec "$CONTAINER" ollama pull "$m" || return 1
  done
}

if command -v ollama >/dev/null 2>&1; then
  echo "Using local ollama CLI"
  pull_with_cli || {
    echo "Local pull failed, trying docker exec fallback"
    pull_with_docker
  }
else
  echo "Local ollama CLI not found, attempting docker exec"
  pull_with_docker
fi

echo "All requested models pulled (or already available)."

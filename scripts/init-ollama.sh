#!/bin/sh

echo "ðŸš€ Starting Ollama server and pulling models..."

# ============================================================================
# âš ï¸  IMPORTANT: Model Selection
# ============================================================================
# Current model: mistral:7b (~3.8 GB RAM required)
# 
# Do NOT change to llama3.1:8b or llama2:13b as they require:
# - llama3.1:8b: 4.8 GB RAM (causes OOM on production VM with 7.6 GB total)
# - llama2:13b: 7+ GB RAM (exceeds VM memory)
#
# If you need a larger model:
# 1. Upgrade VM to at least 16 GB RAM
# 2. Update this script
# 3. Update src/lib/ai/providers/ollama.ts default model
# 4. Test thoroughly in dev environment first
# ============================================================================

# Start Ollama server in background
/bin/ollama serve &
OLLAMA_PID=$!

# Give server a moment to start
sleep 5

# Pull models in FOREGROUND to ensure they're ready before container is marked healthy
echo "ðŸ“¥ Pulling mistral:7b model (this may take a few minutes)..."
if /bin/ollama pull mistral:7b; then
  echo "âœ… mistral:7b pulled successfully"
else
  echo "âš ï¸  mistral:7b pull failed"
fi
echo "📥 Pulling llama3.1:8b model (this may take a few minutes)..."
if /bin/ollama pull llama3.1:8b; then
  echo "✅ llama3.1:8b pulled successfully"
else
  echo "⚠️  llama3.1:8b pull failed"
fi
echo "ðŸ“¥ Pulling nomic-embed-text model..."
if /bin/ollama pull nomic-embed-text; then
  echo "âœ… nomic-embed-text pulled successfully"
else
  echo "âš ï¸  nomic-embed-text pull failed"
fi

echo "âœ… Ollama server started and models pulled"

# Keep container running
wait $OLLAMA_PID



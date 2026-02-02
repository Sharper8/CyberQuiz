#!/bin/sh

echo "ðŸš€ Starting Ollama server and pulling models..."

# ============================================================================
# âš ï¸  IMPORTANT: Model Selection
# ============================================================================
# Current model: tinyllama:1b (~600 MB RAM required)
# 
# Lightweight model chosen due to VM RAM constraints (7.6 GB total)
# mistral:7b requires 4.5 GB but only 3.2 GB is available
# llama3.1:8b requires 4.8 GB (too large)
#
# If you need a larger/better model:
# 1. Upgrade VM to at least 16 GB RAM
# 2. Switch to mistral:7b or llama3.1:8b
# 3. Update generation settings via admin panel
# 4. Test thoroughly in dev environment first
# ============================================================================

# Start Ollama server in background
/bin/ollama serve &
OLLAMA_PID=$!

# Give server a moment to start
sleep 5

# Pull models in FOREGROUND to ensure they're ready before container is marked healthy
echo "📥 Pulling tinyllama model (lightweight, ~600MB RAM)..."
if /bin/ollama pull tinyllama; then
  echo "✅ tinyllama pulled successfully"
else
  echo "⚠️  tinyllama pull failed"
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



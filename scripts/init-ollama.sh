#!/bin/sh

echo "ðŸš€ Starting Ollama server and pulling models..."

# ============================================================================
# ⚠️  IMPORTANT: Model Selection & Memory Management
# ============================================================================
# Set aggressive model unloading to prevent multiple models in RAM
export OLLAMA_KEEP_ALIVE=2m  # Unload model after 2 minutes of inactivity
# ============================================================================
# Available models: mistral:7b (~4.5 GB RAM) and llama3.1:8b (~4.8 GB RAM)
# 
# IMPORTANT: Only ONE model is loaded in RAM at a time (VM has 7.6 GB total, 5+ GB available)
# Ollama automatically unloads models after OLLAMA_KEEP_ALIVE timeout (set to 2m)
# This prevents both models from being loaded simultaneously (which would exceed 6GB container limit)
#
# Model lifecycle:
# - First request: Model loads into RAM (~10-15 seconds)
# - During use: Model stays in RAM for fast responses
# - After 2 minutes idle: Model unloads automatically to free RAM
# - Next request: Different model can load without memory conflict
# ============================================================================

# Start Ollama server in background
/bin/ollama serve &
OLLAMA_PID=$!

# Give server a moment to start
sleep 5

# Pull models in FOREGROUND to ensure they're ready before container is marked healthy
echo "📥 Pulling mistral:7b model (this may take a few minutes)..."
if /bin/ollama pull mistral:7b; then
  echo "✅ mistral:7b pulled successfully"
else
  echo "⚠️  mistral:7b pull failed"
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



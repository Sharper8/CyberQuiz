#!/bin/sh

echo "🚀 Starting Ollama server and pulling models..."

# Start Ollama server in background
/bin/ollama serve &
OLLAMA_PID=$!

# Give server a moment to start
sleep 5

# Pull models in the background (don't block container startup)
# Models will be available soon but we don't wait for completion
echo "📥 Starting model pulls in background..."
(/bin/ollama pull llama3.1:8b > /tmp/llama-pull.log 2>&1 && echo "✅ llama3.1:8b pulled" || echo "⚠️  llama3.1:8b pull failed") &
sleep 2
(/bin/ollama pull nomic-embed-text > /tmp/embed-pull.log 2>&1 && echo "✅ nomic-embed-text pulled" || echo "⚠️  nomic-embed-text pull failed") &

echo "✅ Ollama server started (models pulling in background)"

# Keep container running
wait $OLLAMA_PID

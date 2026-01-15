#!/bin/sh

echo "🚀 Starting Ollama server and pulling models..."

# Start Ollama server in background
/bin/ollama serve &
OLLAMA_PID=$!

# Give server a moment to start
sleep 5

# Pull models in FOREGROUND to ensure they're ready before container is marked healthy
echo "📥 Pulling llama3.1:8b model (this may take a few minutes)..."
if /bin/ollama pull llama3.1:8b; then
  echo "✅ llama3.1:8b pulled successfully"
else
  echo "⚠️  llama3.1:8b pull failed"
fi

echo "📥 Pulling nomic-embed-text model..."
if /bin/ollama pull nomic-embed-text; then
  echo "✅ nomic-embed-text pulled successfully"
else
  echo "⚠️  nomic-embed-text pull failed"
fi

echo "✅ Ollama server started and models pulled"

# Keep container running
wait $OLLAMA_PID

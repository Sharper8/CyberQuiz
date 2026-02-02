# Ollama Models Guide

## Available Models

CyberQuiz supports multiple Ollama models for question generation. Models are **automatically pulled on-demand** when selected in the admin panel.

### Generation Models

| Model | Size (Disk) | RAM Usage | Speed | Quality | Use Case |
|-------|------------|-----------|-------|---------|----------|
| **mistral:7b** | ~4.4 GB | ~3.8 GB | Medium | High | Default - Best balance |
| **llama3.1:8b** | ~4.7 GB | ~4.8 GB | Medium | Very High | Higher quality questions |
| **gemma2:2b** | ~1.6 GB | ~1.5 GB | Fast | Good | Testing, low resources |
| **tinyllama:latest** | ~637 MB | ~700 MB | Very Fast | Basic | Fallback, development |

### Embedding Model

- **nomic-embed-text:latest** (~274 MB) - Required for semantic search, always loaded

## How It Works

### Automatic Model Pulling

1. **Initial Setup**: Only essential models (`mistral:7b` and `nomic-embed-text`) are pulled during container startup
2. **On-Demand Loading**: When you select a new model in the admin panel:
   - The system checks if the model is available
   - If not, it automatically pulls the model in the background
   - First generation with a new model may take 1-5 minutes (one-time pull)
   - Subsequent generations are immediate

### Memory Management

- **Only one generation model is loaded at a time**
- Switching models unloads the previous one from RAM
- This prevents memory exhaustion on limited VMs
- Embedding model stays loaded (small footprint)

## Using Different Models

### In Admin Panel

1. Navigate to **Admin Panel** → **Generation Settings**
2. Find the **Model Configuration** section
3. Select your desired model from the dropdown:
   - `mistral:7b` (default)
   - `llama3.1:8b`
   - `gemma2:2b`
   - `tinyllama:latest`
4. Click **Save Settings**
5. The buffer maintenance service will automatically:
   - Pull the model if needed (first time only)
   - Switch to the new model
   - Start generating questions with it

### Model Selection Tips

**For Production:**
- Use `mistral:7b` for best balance of quality and speed
- Use `llama3.1:8b` if you need higher quality and have ≥16GB RAM

**For Development/Testing:**
- Use `gemma2:2b` for fast iterations
- Use `tinyllama:latest` for very low resource environments

**Fallback Model:**
- If primary model fails, system automatically switches to `tinyllama:latest`
- You can change the fallback model in generation settings

## Resource Requirements

### Minimum VM Requirements

| Model | Minimum RAM | Recommended RAM |
|-------|-------------|-----------------|
| mistral:7b | 6 GB | 8 GB |
| llama3.1:8b | 8 GB | 16 GB |
| gemma2:2b | 4 GB | 6 GB |
| tinyllama:latest | 2 GB | 4 GB |

**Note:** Production VM (Elestio) has ~7.6 GB RAM
- ✅ Safe: `mistral:7b`, `gemma2:2b`, `tinyllama:latest`
- ⚠️  Risk: `llama3.1:8b` (may cause OOM under load)

## Adding New Models

To add more models to the system:

1. **Update** [`scripts/init-ollama.sh`](../scripts/init-ollama.sh) - Add model to documentation
2. **Update** [`prisma/schema.prisma`](../prisma/schema.prisma) - Add model to comments
3. **No code changes needed** - Auto-pull handles everything else

Example model additions:
- `phi3:mini` (~2.3 GB) - Fast, good quality
- `qwen2:7b` (~4.4 GB) - Alternative to mistral
- `llama3:8b` (~4.7 GB) - Previous Llama version

## Troubleshooting

### Model Pull Fails

**Symptom:** "No AI provider available" error after selecting new model

**Solutions:**
1. Check Ollama container logs: `docker logs cyberquiz-ollama-prod`
2. Verify disk space: `df -h`
3. Manually pull model: `docker exec cyberquiz-ollama-prod ollama pull <model-name>`
4. Restart buffer service (auto-retries every 30 seconds)

### Out of Memory

**Symptom:** Container crashes after switching to `llama3.1:8b`

**Solutions:**
1. Switch back to `mistral:7b` or `gemma2:2b`
2. Upgrade VM to ≥16 GB RAM
3. Use `gemma2:2b` for resource-constrained environments

### Slow First Generation

**Symptom:** First question takes 3-5 minutes to generate

**Expected Behavior:**
- This is normal when using a new model for the first time
- The system is pulling the model (1-5 GB download)
- Subsequent generations are fast (seconds)
- Check Ollama logs to monitor pull progress

## API Endpoints

### List Available Models

```bash
GET /api/models/available
```

Returns list of models currently pulled and available.

### Health Check

```bash
GET /api/health
```

Shows Ollama provider status and which model is active.

# Ollama Model Selection & Memory Management Guide

## Current Production Configuration

**Active Model:** mistral:7b  
**Memory Required:** ~3.8 GB  
**Production VM:** 7.6 GB total RAM, ~6.0 GB available  

---

## Why mistral:7b?

### The Problem
Initial production deployment used `llama3.1:8b` which requires 4.8 GB of RAM. While the VM has 7.6 GB total, the actual available memory for Ollama was only ~4.6 GB after accounting for:
- OS kernel and services: ~1.5 GB
- Docker container overhead: ~0.5 GB
- Filesystem cache (in use): ~0.6 GB
- Other services (PostgreSQL, etc): ~0.3 GB

**Result:** Loading llama3.1:8b failed with "model requires more system memory (4.8 GiB) than is available (4.6 GiB)" error.

### The Solution
Switched to `mistral:7b` which:
- ✅ Requires only ~3.8 GB (leaves 2.2 GB safety margin)
- ✅ Maintains excellent question generation quality
- ✅ Reliably loads even under memory pressure
- ✅ Proven stable in production

---

## Model Comparison Table

| Model | RAM | Quality | Speed | Recommend | Notes |
|-------|-----|---------|-------|-----------|-------|
| mistral:7b | 3.8 GB | ⭐⭐⭐⭐ | Fast | ✅ YES | Current production choice |
| neural-chat:7b | 3.8 GB | ⭐⭐⭐⭐ | Fast | ✅ MAYBE | Chat-optimized, good alternative |
| llama3.1:8b | 4.8 GB | ⭐⭐⭐⭐⭐ | Medium | ❌ NO | Requires VM upgrade to 16GB |
| llama2:13b | 7+ GB | ⭐⭐⭐⭐⭐ | Slow | ❌ NO | Requires VM upgrade to 32GB |

---

## How to Change Models (If Needed)

### Step 1: Verify Available Memory
```bash
# Check system memory
free -h

# Check Docker available memory
docker stats
```

**Required:** At least 1.5x the model's RAM requirement available.  
Example: For a 4.8GB model, need 7.2GB available.

### Step 2: Update Scripts
Edit `scripts/init-ollama.sh`:
```bash
# Change this line:
/bin/ollama pull mistral:7b

# To your desired model:
/bin/ollama pull llama3.1:8b
```

### Step 3: Update Default Model
Edit `src/lib/ai/providers/ollama.ts`:
```typescript
this.generationModel = process.env.OLLAMA_GENERATION_MODEL || 'mistral:7b';
// Change 'mistral:7b' to your chosen model
```

### Step 4: Test in Development
```bash
docker compose -f docker-compose.dev.yml up -d --build
# Monitor memory usage
docker stats cyberquiz-ollama
```

### Step 5: Deploy to Production
```bash
# On production VM:
cd /root/cyberquiz
git pull origin prod
docker compose down
docker volume rm cyberquiz_ollama-data  # Fresh model pull
docker compose up -d --build
```

---

## Safety Features

### 1. Code Warnings
The OllamaProvider constructor includes validation that warns about unsafe models:
```
⚠️  WARNING: Model "llama3.1:8b" may require excessive memory.
Ensure your system has adequate RAM before using this model.
```

### 2. Documentation
Comments in `scripts/init-ollama.sh` explicitly warn:
```
Do NOT change to llama3.1:8b or llama2:13b as they require...
```

### 3. Comments in Constructor
The provider includes memory requirement notes for each model.

---

## Environment Variables

Override the default model without code changes:

```bash
# In .env or docker-compose environment:
OLLAMA_GENERATION_MODEL=mistral:7b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_VALIDATION_MODEL=mistral:7b
```

---

## Monitoring Memory Usage

### Watch Real-Time Memory
```bash
# Development
docker stats cyberquiz-ollama

# Production
ssh user@vm.address "docker stats cyberquiz-ollama-prod"
```

### Check Container Memory Limits
```bash
docker inspect cyberquiz-ollama --format '{{.HostConfig.Memory}}'
# Output: 0 means unlimited (can use all system RAM)
```

### Monitor During Model Loading
```bash
# Watch logs while pulling
docker logs cyberquiz-ollama -f | grep -E "load|memory|available"
```

---

## Troubleshooting

### Error: "model requires more system memory"
**Cause:** Model is too large for available RAM  
**Solution:** Use a smaller model or upgrade VM

### Error: "No AI provider available"
**Cause:** Model is still loading or failed to pull  
**Solution:** Check logs: `docker logs cyberquiz-ollama`

### Generation is slow
**Cause:** Model is swapping to disk  
**Solution:** Verify available memory with `free -h`, upgrade VM if needed

---

## Future VM Upgrades

If upgrading VM to more memory:

| VM Memory | Recommended Model | Max Model |
|-----------|-------------------|-----------|
| 8 GB | mistral:7b | mistral:7b |
| 16 GB | llama3.1:8b | llama2:13b |
| 32 GB | llama2:13b | mixtral:8x7b |

Update after upgrade:
1. Verify new memory: `free -h`
2. Update scripts as per "How to Change Models"
3. Rebuild containers
4. Monitor first generation with `docker stats`

---

## Production Deployment Checklist

- [ ] Verify available memory ≥ 1.5x model requirement
- [ ] Update both scripts/init-ollama.sh and ollama.ts
- [ ] Test in dev environment first
- [ ] Monitor memory during first generation
- [ ] Confirm "Ollama: available" in `/api/health`
- [ ] Test question generation in admin panel
- [ ] Keep original ollama-data volume backup (optional)


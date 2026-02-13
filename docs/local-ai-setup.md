# LM Studio Local AI Setup - Documentation

## Overview
Following Alex Finn's cost optimization strategy, we've deployed a local AI model to reduce OpenClaw API costs by 60-80% on routine tasks.

## Hardware Configuration
- **Platform**: Apple Silicon (M-series)
- **Available RAM**: 114GB
- **GPU Acceleration**: Metal (active)
- **Optimal for**: Local LLM inference with excellent performance

## Model Selection

### Primary Model: Qwen 2.5 7B Instruct (Q4_K_M)
- **Size**: 4.36 GB
- **Parameters**: 7B
- **Quantization**: Q4_K_M (4-bit, recommended balance)
- **RAM Usage**: ~6-8GB during inference
- **Performance**: Excellent for routine tasks, coding, and reasoning
- **Speed**: 20-40 tokens/second on Apple Silicon

### Alternative Model (Future): Qwen 2.5 32B Instruct
- **Size**: ~20GB
- **Parameters**: 32B
- **Use case**: Higher quality for complex reasoning (when needed)
- **Status**: Partial download available (can be completed if needed)

## Installation Steps

1. **LM Studio**: Already installed with Metal acceleration
2. **Model Download**: 
   ```bash
   wget https://huggingface.co/lmstudio-community/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf
   ```
3. **Import Model**:
   ```bash
   lms import ~/.lmstudio/models/Qwen2.5-7B-Instruct-Q4_K_M.gguf -y --user-repo "lmstudio-community/Qwen2.5-7B-Instruct-GGUF"
   ```
4. **Load Model**:
   ```bash
   lms load qwen2.5-7b-instruct
   ```
5. **Start Server**:
   ```bash
   lms server start --port 1234
   ```

## OpenClaw Integration

### Configuration Updates
Added to `~/.openclaw/openclaw.json`:

1. **New Provider**: `local` at `http://localhost:1234/v1`
2. **Subagent Model**: Set to `local/qwen2.5-7b-instruct` for cost-free subagent tasks
3. **Fallback Chain**: Local model is now second in fallback chain after primary

### Usage

To use the local model explicitly:
```json
{
  "model": "local/qwen2.5-7b-instruct"
}
```

For automatic cost optimization, subagents now default to the local model.

## API Testing

### Verify Server
```bash
curl http://localhost:1234/v1/models
```

### Test Completion
```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-7b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

## Cost Savings Analysis

### Current Cloud Costs (Estimated)
- Claude Sonnet 4: ~$3-5 per 1M tokens
- Kimi K2.5: ~$1-2 per 1M tokens
- Average subagent task: ~500-2000 tokens
- Daily subagent usage: ~50-100 tasks

### Projected Savings
- **Subagent Tasks**: 100% savings (now free via local model)
- **Routine Queries**: ~70% savings (fallback to local when appropriate)
- **Complex Tasks**: No change (still use cloud models)
- **Overall Target**: 60-80% cost reduction

### Monthly Projection
- **Before**: ~$200-400/month in API costs
- **After**: ~$50-100/month (75% reduction)
- **Savings**: ~$150-300/month

## Management Commands

### LM Studio CLI
```bash
# List models
lms ls

# Load model
lms load qwen2.5-7b-instruct

# Unload model
lms unload qwen2.5-7b-instruct

# Check server status
lms ps

# Start/stop server
lms server start --port 1234
lms server stop

# Chat interactively
lms chat qwen2.5-7b-instruct
```

### Monitoring
```bash
# Check if server is running
curl -s http://localhost:1234/v1/models | jq '.data[].id'

# Monitor memory usage (Apple Silicon)
vm_stat && ps aux | grep lmstudio
```

## Best Practices

1. **Always use local model for**:
   - Subagent tasks
   - Simple classification
   - Text formatting/summarization
   - Code review (routine checks)
   - Data extraction

2. **Use cloud models for**:
   - Complex reasoning
   - Creative writing
   - Multi-modal tasks (images)
   - Tasks requiring >32K context

3. **Model Selection Strategy**:
   - Start with local model
   - Fall back to cloud if quality insufficient
   - Monitor token usage to verify savings

## Troubleshooting

### Server Not Responding
```bash
# Restart server
lms server stop
lms server start --port 1234
```

### Model Not Loading
```bash
# Check model is imported
lms ls

# Reload model
lms unload qwen2.5-7b-instruct
lms load qwen2.5-7b-instruct
```

### Performance Issues
- Ensure Metal is enabled (check LM Studio settings)
- Close unnecessary applications
- Consider using Q4_K_M quantization for balance
- Monitor RAM usage (should stay under 50% of available)

## Future Enhancements

1. **Download 32B Model**: For higher quality on complex tasks
2. **Auto-start Server**: Add to launch agents for automatic startup
3. **Model Switching**: Implement intelligent routing based on task complexity
4. **Monitoring Dashboard**: Track local vs cloud usage and savings

## Status
- ✅ LM Studio installed with Metal acceleration
- ✅ Qwen 2.5 7B model downloaded and imported
- ✅ Server running on localhost:1234
- ✅ OpenClaw integration configured
- ✅ Subagents now use local model by default
- ✅ API tested and working

**Setup Complete - Ready for cost-optimized operations!**

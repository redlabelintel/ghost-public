# Quick Reference: Local Hosting Decision Matrix

## Current State (Baseline)
| Metric | Value |
|--------|-------|
| Daily Cost | $10-20 |
| Monthly Cost | $300-600 |
| Annual Cost | $3,600-7,200 |
| Peak Tokens/Day | 191M |
| Cache Hit Rate | 80-95% |
| Current Model | Kimi K2.5 (API) |

---

## ROI Comparison (3-Year TCO)

| Approach | Initial Cost | 3-Year Total | Savings vs API | Break-Even |
|----------|--------------|--------------|----------------|------------|
| API Only (Kimi) | $0 | $16,200 | Baseline | N/A |
| **Hybrid (Phase 1)** | **$0** | **$5,600** | **$10,600 (65%)** | **Immediate** |
| Hybrid (Phase 2) | $1,399 | $6,800 | $9,400 (58%) | 3 months |
| Full Local (Phase 3) | $5,499 | $7,800 | $8,400 (52%) | 14 months |

---

## Recommended Models for 114GB Apple Silicon

| Model | Size | Quantized | Memory | Speed | Quality |
|-------|------|-----------|--------|-------|---------|
| Llama 3.1 70B | 70B | Q4_K_M | ~42GB | 8-12 t/s | ⭐⭐⭐⭐ |
| Qwen 2.5 72B | 72B | Q4_K_M | ~45GB | 8-10 t/s | ⭐⭐⭐⭐ |
| Mistral Large 2 | 123B | Q4_K_M | ~70GB | 5-8 t/s | ⭐⭐⭐⭐⭐ |
| Qwen 2.5 32B | 32B | Q4_K_M | ~20GB | 15-20 t/s | ⭐⭐⭐ |
| Llama 3.1 8B | 8B | Q8_0 | ~10GB | 35-50 t/s | ⭐⭐ |

---

## Phase 1 Success Metrics (30 days)

| Metric | Target | Red Flag |
|--------|--------|----------|
| Cost Reduction | >40% | <20% |
| P95 Latency | <3s | >5s |
| Quality Score | >90% of API | <85% |
| Local Hit Rate | >50% | <30% |
| Uptime | >99.5% | <99% |

---

## Tool Comparison

| Tool | Best For | API | GUI | Apple Silicon | Learning Curve |
|------|----------|-----|-----|---------------|----------------|
| **LM Studio** | Beginners | ⭐⭐⭐⭐⭐ | ✅ Desktop | ✅ Excellent | Low |
| **Ollama** | Developers | ⭐⭐⭐⭐⭐ | ❌ CLI | ✅ Excellent | Low |
| **vLLM** | Production | ⭐⭐⭐⭐⭐ | ❌ API | ⚠️ Limited | High |
| **LocalAI** | Multimodal | ⭐⭐⭐⭐⭐ | ✅ Web | ✅ Good | Medium |

---

## Decision Checkpoints

### ✅ Phase 1: Immediate (0-30 days)
- **Cost:** $0 (use existing hardware)
- **Goal:** Prove 40-50% savings with existing 114GB
- **Go/No-Go:** Day 30 quality review

### ⏳ Phase 2: Optimization (30-90 days)
- **Cost:** $1,399 (Mac Mini M4 Pro)
- **Goal:** Scale to 70% local coverage
- **Go/No-Go:** Day 90 volume analysis

### ⏳ Phase 3: Scale (90+ days)
- **Cost:** $5,499 (Mac Studio M3 Ultra)
- **Goal:** 95%+ local, 256GB multi-model
- **Go/No-Go:** Annual volume projection review

---

## Key Takeaway

**Start with Phase 1 immediately.** Zero risk, immediate savings, data-driven path to larger investment.

> *"Don't let perfect be the enemy of good. 50% savings with zero CAPEX is better than waiting for ideal hardware."* — Aaron

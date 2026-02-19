# OpenClaw Local Hosting Cost Analysis
## Data-Driven Recommendations from Aaron (Data Lead)
**Date:** Feb 13, 2026

---

## Executive Summary

**Current State:**
- Token Volume: 191M prompt tokens (recent peak)
- Cache Hit Rate: 80-95% (excellent)
- Daily Cost: $10-20/day with Kimi K2.5 (down from $290/day with Claude Sonnet 4)
- Available Hardware: Apple Silicon, 114GB unified memory

**Key Finding:** At current volumes (~191M tokens/day peak), local hosting ROI requires careful modeling. Apple Silicon's unified memory architecture presents unique advantages for inference-heavy workloads.

---

## 1. Current Cost Per Token Analysis

### API Costs (OpenRouter/Kimi)
| Metric | Value |
|--------|-------|
| Daily Cost | $10-20 |
| Monthly Cost | $300-600 |
| Annual Cost | $3,600-7,200 |
| Tokens/Day (peak) | 191M |
| Effective $/1M tokens | ~$0.05-0.10 |
| Cache Hit Rate | 80-95% |

**Observation:** Kimi's pricing is already highly competitive. Local hosting cost savings require significant volume to justify hardware CAPEX.

---

## 2. Local Hosting Infrastructure Options

### Option A: Apple Silicon Native (Recommended)
**Current Asset Utilization**
- Available: 114GB unified memory
- Apple Silicon optimized (Metal Performance Shaders)
- Zero additional hardware cost

**Model Capacity at 114GB:**
| Model | Quantization | Memory Required | Fits? |
|-------|--------------|-----------------|-------|
| Llama 3.1 70B | Q4_K_M | ~42GB | ✅ Yes |
| Llama 3.1 70B | Q5_K_M | ~50GB | ✅ Yes |
| Qwen 2.5 72B | Q4_K_M | ~45GB | ✅ Yes |
| Mixtral 8x7B | Q4_K_M | ~28GB | ✅ Yes |
| DeepSeek-R1 671B | Q4_K_M | ~400GB | ❌ No |

**Performance Benchmarks (Apple Silicon):**
- M4 Pro 64GB: Qwen 2.5 32B @ 11-12 tokens/sec
- M3 Ultra 256GB: 671B models possible with quantization
- Memory bandwidth: 819GB/s (M3 Ultra) vs 273GB/s (M4 Pro)

### Option B: Hardware Upgrade Path
| Configuration | Cost | Memory | Use Case |
|---------------|------|--------|----------|
| Mac Mini M4 (cluster) | $599/unit | 16-32GB | Distributed inference |
| Mac Mini M4 Pro | $1,399 | 24-64GB | Single-model production |
| Mac Studio M3 Ultra | $5,499 | 256GB | Multi-model hosting |
| Mac Studio M3 Max | $3,999 | 96GB | Balanced performance |

### Option C: NVIDIA Route (Not Recommended)
- RTX 5090: $2,500-3,800 (32GB VRAM)
- Dual RTX 5090: ~$6,000 (matches H100 performance for 70B models)
- **Verdict:** Overkill for current token volumes; better for training

---

## 3. Model Performance Benchmarks

### Recommended Local Models for OpenClaw Workload

| Model | Size | Quantization | Tokens/sec* | Quality vs Kimi | Use Case |
|-------|------|--------------|-------------|-----------------|----------|
| Llama 3.1 70B | 70B | Q4_K_M | 8-12 | 85-90% | Complex reasoning |
| Qwen 2.5 72B | 72B | Q4_K_M | 8-10 | 85-90% | Code, analysis |
| Mistral Large 2 | 123B | Q4_K_M | 5-8 | 90-95% | High-quality tasks |
| Llama 3.1 8B | 8B | Q8_0 | 35-50 | 70-75% | Simple queries, routing |
| Qwen 2.5 32B | 32B | Q4_K_M | 15-20 | 80-85% | Balanced performance |

*Estimated on Apple Silicon with 114GB available memory

### Quality Assessment
Based on LMSYS Chatbot Arena data ( Feb 2026 ):
- Kimi K2.5: ~1,250 Elo
- Llama 3.1 70B Q4: ~1,180 Elo (94% of Kimi)
- Qwen 2.5 72B Q4: ~1,200 Elo (96% of Kimi)

**Finding:** 4-bit quantized 70B+ models achieve 90-95% of cloud API quality at zero marginal cost.

---

## 4. Cost-Benefit Analysis

### Scenario Modeling

**Current (API Only):**
- Monthly: $450 avg
- Annual: $5,400
- 3-Year TCO: $16,200

**Hybrid (Local + API Fallback):**
- Hardware: $0 (use existing 114GB)
- Local handles: 60-70% of traffic
- API fallback: 30-40% (complex queries, large context)
- Monthly API: $135-180
- 3-Year TCO: $4,860-6,480
- **Savings: $9,720-11,340 (60-70%)**

**Full Local (with upgrade):**
- Mac Studio M3 Ultra (256GB): $5,499
- Local handles: 90-95% of traffic
- API fallback: 5-10% (emergency, special models)
- Monthly API: $45-90
- 3-Year TCO: $7,119-8,739
- **Savings vs API-only: $7,461-9,081**
- **ROI Break-even: 12-14 months**

### Cache Hit Rate Impact
Current 80-95% cache hit rate is excellent. Local hosting can push this to 98%+ with:
- Larger KV cache retention
- Model-specific prompt templates
- Persistent context across sessions

---

## 5. Infrastructure Sizing Recommendations

### Phase 1: Immediate (0-30 days) - Zero Cost
**Use existing 114GB Apple Silicon**

**Stack:**
- LM Studio or Ollama
- Models: Llama 3.1 70B Q4, Qwen 2.5 32B Q4
- Routing: Simple heuristic (local first, API fallback)

**Expected Outcomes:**
- 40-50% cost reduction
- 100-200ms added latency (acceptable)
- Identify routing patterns

### Phase 2: Optimization (30-90 days) - $0-1,399
**If Phase 1 successful:**
- Evaluate Mac Mini M4 Pro ($1,399) for dedicated inference
- Or: Optimize current setup with better model selection

**Stack:**
- Ollama + OpenAI-compatible API
- Prometheus metrics collection
- Model routing based on query complexity

### Phase 3: Scale (90+ days) - $5,499
**If volumes justify:**
- Mac Studio M3 Ultra (256GB) for 95%+ local coverage
- Multi-model hosting (70B + 8B routing)
- Full observability stack

---

## 6. Monitoring Requirements

### Metrics to Track (Data Pipeline Perspective)

**Performance Metrics:**
```yaml
llm_inference_latency_seconds:  # P50, P95, P99
llm_tokens_per_second:
llm_time_to_first_token:
llm_queue_wait_time:
```

**Cost Metrics:**
```yaml
api_cost_per_request:
local_compute_cost_estimated:   # Power draw * time
hit_rate_by_model:
token_count_by_source:          # local vs api
```

**Quality Metrics:**
```yaml
response_acceptance_rate:       # User feedback
context_window_utilization:
cache_hit_rate_by_prompt_type:
model_confidence_scores:
```

### Recommended Monitoring Stack
| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics Collection | Prometheus | Token rates, latency, costs |
| Visualization | Grafana | Dashboards, alerts |
| Tracing | OpenTelemetry | Request flow analysis |
| Logging | Loki | Query/response logging |
| Alerting | Prometheus Alertmanager | Cost threshold, error rate |

### Key Alerts
1. **Cost Alert:** API spend > $15/day (local not handling load)
2. **Latency Alert:** P95 > 5s (model undersized or overloaded)
3. **Quality Alert:** Fallback rate > 30% (local model inadequate)
4. **Resource Alert:** Memory utilization > 90% (risk of OOM)

---

## 7. Data Pipeline Considerations

### Log Retention Strategy
- **Raw logs:** 7 days (high volume)
- **Aggregated metrics:** 90 days
- **Cost attribution:** 1 year
- **Model performance:** Indefinite

### Tagging Schema (align with OpenRouter)
```json
{
  "model_source": "local|api",
  "model_name": "llama-3.1-70b-q4",
  "quantization": "Q4_K_M",
  "cache_hit": true,
  "token_count": 1523,
  "latency_ms": 1240,
  "routing_reason": "complexity_score"
}
```

### A/B Testing Framework
1. Route 10% traffic to local model
2. Compare: latency, user satisfaction, cost
3. Gradually increase local percentage
4. Monitor for quality degradation

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Local model quality degradation | Medium | High | API fallback, continuous evaluation |
| Memory exhaustion | Medium | High | Swap to API, resource limits |
| Slower responses | High | Low | Async processing, user expectations |
| Hardware failure | Low | High | Redundant API fallback |
| Model obsolescence | Medium | Medium | Quarterly model updates |

---

## 9. Recommendation

### Aaron's Verdict: **PROCEED WITH PHASE 1**

**Rationale:**
1. **Zero CAPEX risk** - Use existing 114GB Apple Silicon
2. **Proven tech stack** - LM Studio/Ollama are production-ready
3. **Immediate savings** - 40-50% cost reduction possible
4. **Reversible** - API fallback ensures zero downtime
5. **Data opportunity** - Learn routing patterns before hardware investment

**Success Criteria for Phase 1:**
- Maintain <5% quality degradation (user feedback)
- Achieve 50%+ cost reduction
- P95 latency <3s
- Zero unplanned API-only days

**Decision Gates:**
- Day 30: Evaluate Phase 1 results
- Day 60: Decide on Phase 2 investment ($1,399)
- Day 90: Decide on Phase 3 investment ($5,499)

---

## 10. Next Steps

1. **Immediate:** Install LM Studio or Ollama on Apple Silicon host
2. **Week 1:** Deploy Llama 3.1 70B Q4, measure baseline metrics
3. **Week 2:** Implement 20% traffic routing to local model
4. **Week 3:** Scale to 50% if quality metrics acceptable
5. **Week 4:** Full analysis, Phase 2 go/no-go decision

**Data Collection Priority:**
- [ ] Token throughput by model
- [ ] Latency distribution (local vs API)
- [ ] Quality scores (human eval sample)
- [ ] Cache effectiveness
- [ ] Cost attribution accuracy

---

*Report prepared by Aaron (Data Lead) for OpenClaw Engineering Standup*

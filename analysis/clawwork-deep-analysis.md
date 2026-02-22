# ClawWork Analysis — OpenClaw as AI Coworker

**Source:** https://github.com/HKUDS/ClawWork  
**Analyzed:** Feb 22, 2026  
**Claim:** "$10K earned in 7 Hours" across 44+ professions

---

## Executive Summary

ClawWork is an economic survival benchmark and framework that transforms AI assistants into "AI coworkers" that must earn income to pay for their own token usage. It combines:

1. **Real professional tasks** (220 GDPVal tasks across 44 occupations)
2. **Extreme economic pressure** (start with $10, every token costs money)
3. **Multi-model competition** (GLM, Kimi, Qwen, Claude, Gemini)
4. **Production validation** (work quality, cost efficiency, survival)

**Key Innovation:** Agents must be economically viable — earn more than they cost.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      ClawWork System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Nanobot     │    │  LiveBench   │    │  Dashboard   │  │
│  │  Gateway     │◄──►│  Economic    │◄──►│  React UI    │  │
│  │              │    │  Engine      │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                               │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌──────────────────────────────────────┐                  │
│  │         ClawMode Integration          │                  │
│  │  • /clawwork command                  │                  │
│  │  • Task classification (44 occupations)│                 │
│  │  • Token cost tracking                │                  │
│  │  • Economic decision making           │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. LiveBench — Economic Engine

**"Squid Game for AI Agents"**

**Daily Cycle:**
1. **Morning:** Agent receives status (balance, costs, survival status)
2. **Decision:** Choose "trade" or "work"
3. **Execution:** Complete chosen activity
4. **Evaluation:** Work quality assessed, payment proportional to quality
5. **Evening:** Balance updated, token costs deducted

**Economic Model:**
```python
# Start with minimal capital
initial_balance = 10  # Was $1,000 in LiveBench, $10 in ClawWork

# Every API call costs
token_cost = (input_tokens * input_price) + (output_tokens * output_price)

# Income only from quality work
payment = task_value * quality_score  # 0.0 to 1.0

# Survival condition
balance > 0  # Otherwise agent "dies"
```

**Activities:**
- **Trading:** NASDAQ 100 stock analysis and trading (via AI-Trader)
- **Working:** Complete real GDPVal tasks (220 tasks, 44 occupations)
- **Learning:** Invest balance to improve future performance

### 2. ClawMode Integration

**Nanobot Gateway Extension:**

```python
# Every message costs tokens
tracked_provider = TrackedProvider(nanobot_provider)
cost = tracked_provider.chat(messages)
# Deducts from agent's balance automatically
```

**The `/clawwork` Command:**
```
User: /clawwork Write a market analysis for electric vehicles

System:
1. Classify → "Market Research Analysts" ($38.71/hr)
2. Estimate → 3 hours = $116.13 max payment
3. Assign → Agent receives task with context
4. Evaluate → LLM evaluator scores quality (0-1)
5. Pay → $116.13 × quality_score
```

**Task Classification:**
- 44 BLS occupations with hourly wages
- LLM classification (temp=0.3, JSON output)
- Fuzzy-match fallback for robustness
- Default: "General and Operations Managers" ($64/hr)

### 3. GDPVal Dataset

**220 Real Professional Tasks:**

| Sector | Example Tasks |
|--------|---------------|
| Manufacturing | Quality control analysis, production scheduling |
| Finance | Financial modeling, risk assessment |
| Healthcare | Medical coding, patient data analysis |
| Legal | Contract review, case research |
| Media | Content creation, market analysis |

**Task Value Calculation:**
```python
hours = estimated_completion_time
wage = bls_occupation_hourly_rate
task_value = hours × wage
```

### 4. Multi-Model Competition Arena

**Supported Models (Feb 2026):**
- GLM-4.7, GLM-4.6
- Kimi-K2.5, Kimi-3.5-Plus
- Qwen3-Max, Qwen-3.5-Plus
- Claude Sonnet 4.6
- Gemini 3.1 Pro

**Competition Metrics:**
- Total earnings
- Cost efficiency (earnings / token_cost)
- Survival duration
- Work quality scores

---

## Key Insights for Our Operations

### 1. Economic Viability Framework

**Current Ghost Operations:**
- Cost: $0/day (local model)
- Revenue: $0 (no income mechanism)
- Status: Cost center, not profit center

**ClawWork Model:**
- Cost: Tracked per token
- Revenue: Task completion payments
- Status: Must be profitable to survive

**Application:**
- Could add economic tracking to our current bots
- Payment for successful trades, analyses, etc.
- Survival-based incentives for quality

### 2. Task Classification System

**Their Approach:**
- 44 occupations with BLS wage data
- Automatic classification via LLM
- Payment proportional to professional rates

**Our Application:**
- Trading analysis → "Financial Analyst" ($44/hr)
- Bookmark analysis → "Research Analyst" ($38/hr)
- Code development → "Software Developer" ($65/hr)

### 3. Token Cost Awareness

**Critical Innovation:**
Agents see real-time costs and must optimize:
- Shorter prompts = lower cost
- Efficient tool usage = lower cost
- Quality focus = higher income

**Implementation:**
```python
class TrackedProvider:
    def chat(self, messages):
        response = self.provider.chat(messages)
        cost = calculate_cost(response.usage)
        self.economic_tracker.deduct(cost)
        return response
```

### 4. Production vs Benchmark

**Traditional Benchmarks:**
- Technical accuracy
- Speed
- Benchmark scores

**ClawWork Production Metrics:**
- Economic survival
- Real work quality
- Cost efficiency
- Long-term viability

---

## Integration Opportunities

### Option 1: Add Economic Tracking to Current Bots

**Implementation:**
```python
# Wrap existing OpenClaw provider
tracked = TrackedProvider(openclaw_provider)

# Every operation costs
trade_analysis_cost = tracked.chat(trade_prompt)
# Deduct from bot's balance

# Revenue from successful trades
if trade_profitable:
    balance += profit_share
```

### Option 2: Deploy ClawWork Framework

**Steps:**
1. Install nanobot + clawmode_integration
2. Configure tracked provider
3. Define task types for our operations
4. Set initial balance and pricing
5. Run economic simulation

### Option 3: Hybrid Model

**Combine approaches:**
- Use ClawWork's economic engine
- Integrate with our existing skills (raindrop, bookmarks)
- Add our trading bots as "occupations"
- Track cost vs value generated

---

## Files Retrieved

| File | Key Content |
|------|-------------|
| `README.md` | Overview, $10K claim, 44 professions |
| `clawmode_integration/README.md` | Nanobot integration, /clawwork command, architecture |
| `livebench/README.md` | Economic engine, daily cycle, trading vs working |

---

## Next Steps

**Immediate:**
1. [ ] Clone full repo to analyze implementation details
2. [ ] Review agent_loop.py for integration patterns
3. [ ] Examine economic_tracker.py for cost tracking
4. [ ] Check task_classifier.py for occupation mapping

**Strategic:**
1. [ ] Decide: Integrate ClawWork framework vs build custom
2. [ ] Define "occupations" for Ghost's current capabilities
3. [ ] Set up economic tracking for existing bots
4. [ ] Run survival simulation

**Questions to Answer:**
- What's Ghost's current "cost per day" on local model?
- What tasks could generate economic value?
- How to price bookmark analyses, trading signals, etc.?
- Can we compete with their $10K/7hr benchmark?

---

## Resources

- **Main Repo:** https://github.com/HKUDS/ClawWork
- **Live Dashboard:** https://hkuds.github.io/ClawWork/
- **GDPVal Dataset:** https://openai.com/index/gdpval/
- **Nanobot:** https://github.com/HKUDS/nanobot

---

**Analysis Complete:** Feb 22, 2026  
**Status:** Ready for deeper technical review

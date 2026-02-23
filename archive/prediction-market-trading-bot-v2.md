# Prediction Market Trading Bot Architecture v2.0

**Based on**: Kelly Criterion sizing + 400M trade dataset + Hedge fund execution techniques

---

## Why Previous Bots Failed

| Failure Mode | Root Cause | Fix in v2.0 |
|--------------|------------|-------------|
| Blew up on variance | Fixed position sizing, no bankroll management | **Kelly Criterion** — mathematical optimal sizing |
| Traded on intuition | No backtesting, no edge validation | **400M trade dataset** — institutional-grade backtesting |
| Executed like retail | No microstructure awareness, bad timing | **Hedge fund techniques** — flow analysis, smart execution |
| No risk controls | All-in bets, no drawdown limits | **Half-Kelly + circuit breakers** — survive to trade another day |

---

## Core Architecture

### Layer 1: Data Pipeline (The 400M Dataset)

```
Polymarket/Kalshi API → Tick Data Store → Feature Engineering → Strategy Engine
     ↓                       ↓                    ↓
Real-time order book    Historical backtest   Signal generation
```

**Components:**
- **Tick Store**: Parquet files, partitioned by market + date
- **Feature Pipeline**: Price momentum, order flow, volatility, spread
- **Backtest Engine**: Walk-forward validation on 2020-2025 data

### Layer 2: Signal Generation (The Alpha)

**Hedge Fund Techniques to Implement:**

1. **Flow Analysis**
   - Large order detection (whale watching)
   - Taker direction imbalance (buy vs sell pressure)
   - Volume profile anomalies

2. **Microstructure Signals**
   - Bid-ask bounce exploitation
   - Order book depth analysis
   - Spread compression/expansion patterns

3. **Cross-Market Arbitrage**
   - Same event on Polymarket vs Kalshi
   - Price divergence → risk-free profit

4. **Information Edge**
   - News/social sentiment (fastest feed wins)
   - On-chain data for crypto-related markets
   - API polling at rate limits (aggressive but compliant)

### Layer 3: Position Sizing (Kelly Criterion)

```python
def kelly_size(p_win, odds, bankroll, kelly_fraction=0.5):
    """
    p_win: Probability of winning (from model)
    odds: Decimal odds (payout ratio)
    bankroll: Current bankroll
    kelly_fraction: 0.5 = half-Kelly (recommended)
    """
    p_loss = 1 - p_win
    kelly_pct = (p_win * odds - p_loss) / odds
    
    # Half-Kelly for drawdown tolerance
    adjusted_pct = kelly_pct * kelly_fraction
    
    # Don't bet if negative expectancy
    if adjusted_pct <= 0:
        return 0
    
    # Cap at 10% max per position (risk management)
    adjusted_pct = min(adjusted_pct, 0.10)
    
    return bankroll * adjusted_pct
```

**Kelly Inputs:**
- `p_win`: From backtested model on 400M dataset
- `odds`: From current market price (implied probability)
- `kelly_fraction`: 0.5 (Half-Kelly for psychological comfort)

### Layer 4: Execution Engine (HFT-Style)

**Smart Order Routing:**
- **TWAP** (Time-Weighted Average Price) for large positions
- **Iceberg orders** — hide size to minimize market impact
- **Sniping** — hit liquidity when it appears

**Timing:**
- Poll order book at max API rate
- Execute on divergence from fair value
- Cancel/replace orders based on book movement

### Layer 5: Risk Management

**Circuit Breakers:**
- Max daily loss: 5% of bankroll (stop trading)
- Max drawdown: 20% of peak (emergency review)
- Max position size: 10% of bankroll (hard cap)
- Correlation limit: Max 3 correlated positions

**Kelly Safeguards:**
- Minimum edge: Only trade if p_win > implied probability + 5%
- Variance buffer: Half-Kelly by default
- Cooldown: No new positions after 2 consecutive losses

---

## Implementation Roadmap

### Phase 1: Infrastructure (Week 1)
- [ ] Download 400M trade dataset (36GB)
- [ ] Set up local Python environment with `uv`
- [ ] Build tick data store (Parquet + DuckDB)
- [ ] Connect Polymarket API (read-only)

### Phase 2: Backtesting (Week 2-3)
- [ ] Implement basic flow analysis signals
- [ ] Test on historical data (2020-2025)
- [ ] Measure Sharpe ratio, max drawdown
- [ ] Kelly C sizing vs fixed sizing comparison

### Phase 3: Paper Trading (Week 4)
- [ ] Live API integration (no real money)
- [ ] Signal generation on real-time data
- [ ] Execution simulation (slippage estimation)
- [ ] Validate Kelly sizing in live environment

### Phase 4: Live Trading (Week 5+)
- [ ] Small capital deployment ($100-500)
- [ ] Full Kelly + risk management stack
- [ ] Daily P&L tracking
- [ ] Weekly strategy review

---

## Key Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Sharpe Ratio | >1.5 | Risk-adjusted returns |
| Win Rate | >55% | Edge validation |
| Avg Win/Avg Loss | >1.2:1 | Positive expectancy |
| Max Drawdown | <20% | Survival |
| Kelly Fraction | 0.5 | Variance tolerance |

---

## Why This Bot Works

1. **Mathematical Edge**: Kelly Criterion = optimal growth rate
2. **Validated Signals**: 400M dataset = backtested edge
3. **Smart Execution**: Hedge fund techniques = minimize slippage
4. **Risk Controls**: Circuit breakers = survive bad runs
5. **Data-Driven**: No intuition, no gut feeling, just math

---

## Next Steps

1. Download the dataset
2. Build the backtester
3. Find one edge on historical data
4. Paper trade that edge
5. Scale with Kelly sizing

**Reference:** Combine with Kelly Criterion analysis and 400M dataset bookmark for implementation details.

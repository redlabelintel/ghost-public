# Polymarket Momentum Bot v1.0

**Strategy**: Volume + Price Momentum with Kelly Criterion Sizing  
**Mode**: Paper Trading (no real funds)  
**Based on**: Kelly Criterion (mikita_crypto) + 400M Dataset (RohOnChain) + Claude Code Agents (ZenomTrader)

---

## Quick Start

```bash
# 1. Clone and enter directory
cd projects/polymarket-momentum-bot

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Run paper trading bot
python bot.py
```

---

## How It Works

### Strategy
1. **Volume Spike Detection** → Z-score > 2 (from 400M dataset patterns)
2. **Price Momentum** → 3-period MA crossover
3. **Order Book Imbalance** → Taker direction analysis
4. **Kelly Sizing** → Half-Kelly with 10% max position

### Risk Management
- **Half-Kelly Sizing** → Survives variance
- **Circuit Breakers** → 5% daily loss limit, 20% max drawdown
- **10% Position Cap** → No single bet blows up account

### Paper Trading
- Simulates trades with fake money
- Tracks P&L, win rate, equity curve
- Zero risk while validating strategy

---

## Configuration

Edit `config.yaml`:

```yaml
bot:
  initial_bankroll: 1000.0
  paper_trading: true
  poll_interval: 60  # seconds

strategy:
  volume_threshold: 2.0      # Z-score for volume spike
  momentum_period: 3         # Periods for momentum calc
  confidence_threshold: 0.55 # Minimum confidence to trade

kelly:
  kelly_fraction: 0.5        # Half-Kelly
  max_position_pct: 0.10     # Max 10% per position

risk:
  max_daily_loss_pct: 0.05   # Stop trading after 5% daily loss
  max_drawdown_pct: 0.20     # Stop after 20% drawdown
```

---

## Output

```
==================================================
Polymarket Momentum Bot Starting
Mode: Paper Trading
Initial Bankroll: $1000.00
Poll Interval: 60s
==================================================

PAPER TRADE: Long YES $45.50 at 0.6500
SIGNAL EXECUTED: BUY_YES market-123 Size: $45.50 Confidence: 62.00%

Equity: $1023.50 | Return: 2.35% | Trades: 3
```

---

## Next Steps

1. **Run paper trading for 1 week** → Validate strategy
2. **Analyze equity curve** → Check Sharpe ratio
3. **Tweak parameters** → Optimize on 400M dataset
4. **Go live** → Small size ($100-500)

---

## References

- [Kelly Criterion Analysis](../../analysis/x_bookmark_analysis_2026-02-21_kelly_monte_carlo_mikita.md)
- [400M Dataset Analysis](../../analysis/x_bookmark_analysis_2026-02-21_prediction_market_hedge_funds_roan.md)
- [Autonomous Agents Analysis](../../analysis/x_bookmark_analysis_2026-02-22_autonomous_agents_zenomtrader.md)
